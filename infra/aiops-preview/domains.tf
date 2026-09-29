# Custom domains through Cloud Run domain mapping (no load balancer, no extra cost).
# Requires the parent domain to be verified in Search Console by the account running Terraform.
# DNS: add the records from the `dns_records` output at the domain's DNS provider (GoDaddy);
# Google then issues the certificates automatically.

resource "google_cloud_run_domain_mapping" "web" {
  name     = var.web_domain
  location = var.region
  metadata {
    namespace = var.project_id
  }
  spec {
    route_name = google_cloud_run_v2_service.web.name
  }
}

resource "google_cloud_run_domain_mapping" "auth" {
  name     = var.auth_domain
  location = var.region
  metadata {
    namespace = var.project_id
  }
  spec {
    route_name = google_cloud_run_v2_service.keycloak.name
  }
}
