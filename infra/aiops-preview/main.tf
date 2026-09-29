# AiOps preview: the AiOps platform itself on Cloud Run (not a customer deployment target).
# Lives in a shared project, so every resource is named aiops-*, labelled, and managed only
# here. Nothing existing in the project is imported or changed. See README.md.

terraform {
  required_version = ">= 1.9"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 8.4" }
    random = { source = "hashicorp/random", version = "~> 3.9" }
  }
  # Bucket created once by hand (README step 1): it must exist before Terraform can use it.
  backend "gcs" {
    bucket = "aiops-tfstate-enliv-342806"
    prefix = "preview"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  default_labels = {
    runway-project = "aiops"
    runway-env     = "preview"
    managed-by     = "terraform"
  }
}

data "google_project" "this" {}

locals {
  # Public addresses (custom domains, see domains.tf). Known before the services exist, so
  # Keycloak and the web app can point at each other without a dependency cycle.
  web_url      = "https://${var.web_domain}"
  keycloak_url = "https://${var.auth_domain}"
  sql_instance = "${var.project_id}:${var.region}:${google_sql_database_instance.keycloak.name}"
}

# --- Images ------------------------------------------------------------------------------

resource "google_artifact_registry_repository" "aiops" {
  repository_id = "aiops"
  location      = var.region
  format        = "DOCKER"
  description   = "AiOps platform images"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions { keep_count = 5 }
  }
  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition { older_than = "2592000s" } # 30 days
  }
}

# --- Identities (least privilege) --------------------------------------------------------

resource "google_service_account" "web" {
  account_id   = "aiops-web"
  display_name = "AiOps web app (Cloud Run)"
}

resource "google_service_account" "keycloak" {
  account_id   = "aiops-keycloak"
  display_name = "AiOps Keycloak (Cloud Run)"
}

# Additive binding: adds this one member, leaves every other binding in the project alone.
resource "google_project_iam_member" "keycloak_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.keycloak.email}"
}

# --- Secrets (generated here, never in the repo or local .env) ---------------------------

resource "random_password" "db" {
  length  = 32
  special = false
}
resource "random_password" "keycloak_admin" {
  length  = 32
  special = false
}
resource "random_password" "client_secret" {
  length  = 48
  special = false
}
resource "random_password" "auth_secret" {
  length  = 48
  special = false
}

locals {
  secrets = {
    "aiops-keycloak-db-password"    = random_password.db.result
    "aiops-keycloak-admin-password" = random_password.keycloak_admin.result
    "aiops-web-client-secret"       = random_password.client_secret.result
    "aiops-auth-secret"             = random_password.auth_secret.result
  }
  # Which service account may read which secret.
  secret_readers = {
    "aiops-keycloak-db-password"    = [google_service_account.keycloak.email]
    "aiops-keycloak-admin-password" = [google_service_account.keycloak.email]
    "aiops-web-client-secret"       = [google_service_account.keycloak.email, google_service_account.web.email]
    "aiops-auth-secret"             = [google_service_account.web.email]
  }
  secret_access = flatten([
    for name, readers in local.secret_readers : [for r in readers : { secret = name, member = r }]
  ])
}

resource "google_secret_manager_secret" "s" {
  for_each  = local.secrets
  secret_id = each.key
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "s" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.s[each.key].id
  secret_data = each.value
}

resource "google_secret_manager_secret_iam_member" "access" {
  for_each  = { for a in local.secret_access : "${a.secret}/${a.member}" => a }
  secret_id = google_secret_manager_secret.s[each.value.secret].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value.member}"
}

# --- Keycloak database ("Cheapest": smallest shared-core instance) ------------------------

resource "google_sql_database_instance" "keycloak" {
  # Deleted Cloud SQL names are blocked for about a week; "-sg" since the move to Singapore.
  name                = "aiops-keycloak-db-sg"
  database_version    = "POSTGRES_16"
  region              = var.region
  deletion_protection = false # preview: `terraform destroy` removes everything

  settings {
    tier              = "db-f1-micro"
    edition           = "ENTERPRISE"
    availability_type = "ZONAL"
    disk_type         = "PD_HDD"
    disk_size         = 10
    user_labels = {
      runway-project = "aiops"
      runway-env     = "preview"
    }
    backup_configuration {
      enabled = true
      backup_retention_settings { retained_backups = 7 }
    }
    ip_configuration {
      # Public IP with no authorised networks: reachable only through the Cloud SQL Auth
      # Proxy, which authenticates with IAM and encrypts the connection.
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"
    }
    database_flags {
      name  = "max_connections"
      value = "25"
    }
  }
}

resource "google_sql_database" "keycloak" {
  name     = "keycloak"
  instance = google_sql_database_instance.keycloak.name
}

resource "google_sql_user" "keycloak" {
  name     = "keycloak"
  instance = google_sql_database_instance.keycloak.name
  password = random_password.db.result
}

# --- Keycloak on Cloud Run (scales to zero; proxy sidecar for the database) ---------------

resource "google_cloud_run_v2_service" "keycloak" {
  name                = "aiops-keycloak"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account                  = google_service_account.keycloak.email
    timeout                          = "300s"
    max_instance_request_concurrency = 80
    scaling {
      min_instance_count = 0
      max_instance_count = 1 # local cache: a single instance
    }

    containers {
      name       = "keycloak"
      image      = var.keycloak_image
      depends_on = ["cloud-sql-proxy"]
      ports { container_port = 8080 }
      resources {
        limits            = { cpu = "1", memory = "1536Mi" }
        cpu_idle          = true
        startup_cpu_boost = true
      }
      env {
        name  = "KC_HOSTNAME"
        value = local.keycloak_url
      }
      env {
        name  = "KC_HTTP_ENABLED"
        value = "true"
      }
      env {
        name  = "KC_PROXY_HEADERS"
        value = "xforwarded"
      }
      env {
        name  = "KC_CACHE"
        value = "local"
      }
      env {
        name  = "KC_DB_URL"
        value = "jdbc:postgresql://127.0.0.1:5432/keycloak"
      }
      env {
        name  = "KC_DB_USERNAME"
        value = google_sql_user.keycloak.name
      }
      env {
        name  = "KC_DB_POOL_MAX_SIZE"
        value = "10"
      }
      env {
        name  = "KC_BOOTSTRAP_ADMIN_USERNAME"
        value = "aiops-bootstrap-admin"
      }
      env {
        name  = "JAVA_OPTS_KC_HEAP"
        value = "-XX:MaxRAMPercentage=70"
      }
      # Substituted into realm-runway.json on first import.
      env {
        name  = "WEB_BASE_URL"
        value = local.web_url
      }
      env {
        name = "KC_DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.s["aiops-keycloak-db-password"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "KC_BOOTSTRAP_ADMIN_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.s["aiops-keycloak-admin-password"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "KEYCLOAK_WEB_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.s["aiops-web-client-secret"].secret_id
            version = "latest"
          }
        }
      }
      # Readiness, not just an open port: Keycloak opens 8080 while still bootstrapping (and
      # answers 503). With CPU allocated only during requests, a probe that passes early lets
      # Cloud Run throttle the CPU and the first-boot schema setup stalls. Cloud Run keeps full
      # CPU until this passes and only then routes traffic, so users wait instead of seeing 503.
      startup_probe {
        http_get {
          path = "/health/ready"
          port = 9000
        }
        period_seconds    = 5
        timeout_seconds   = 3
        failure_threshold = 60 # up to 5 minutes (first boot creates the schema)
      }
    }

    containers {
      name  = "cloud-sql-proxy"
      image = "gcr.io/cloud-sql-connectors/cloud-sql-proxy:${var.cloud_sql_proxy_version}"
      args = [
        "--structured-logs",
        "--port=5432",
        "--health-check",
        "--http-address=0.0.0.0",
        "--http-port=9090",
        local.sql_instance,
      ]
      resources {
        limits   = { cpu = "1", memory = "512Mi" }
        cpu_idle = true
      }
      startup_probe {
        http_get {
          path = "/startup"
          port = 9090
        }
        period_seconds    = 2
        failure_threshold = 30
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.access,
    google_secret_manager_secret_version.s,
    google_project_iam_member.keycloak_sql_client,
    google_sql_database.keycloak,
    google_sql_user.keycloak,
  ]
}

# --- Web app on Cloud Run ----------------------------------------------------------------

resource "google_cloud_run_v2_service" "web" {
  name                = "aiops-web"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = google_service_account.web.email
    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
    containers {
      image = var.web_image
      ports { container_port = 8080 }
      resources {
        limits            = { cpu = "1", memory = "512Mi" }
        cpu_idle          = true
        startup_cpu_boost = true
      }
      env {
        name  = "RUNWAY_ENV"
        value = "preview"
      }
      env {
        name  = "AUTH_URL"
        value = local.web_url
      }
      env {
        name  = "WEB_BASE_URL"
        value = local.web_url
      }
      env {
        name  = "KEYCLOAK_ISSUER"
        value = "${local.keycloak_url}/realms/runway"
      }
      env {
        name  = "KEYCLOAK_WEB_CLIENT_ID"
        value = "runway-web"
      }
      env {
        name = "KEYCLOAK_WEB_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.s["aiops-web-client-secret"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "AUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.s["aiops-auth-secret"].secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.access,
    google_secret_manager_secret_version.s,
  ]
}

# Public web pages and the Keycloak sign-in page. Sign-in itself is invite-only.
resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "keycloak_public" {
  name     = google_cloud_run_v2_service.keycloak.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
