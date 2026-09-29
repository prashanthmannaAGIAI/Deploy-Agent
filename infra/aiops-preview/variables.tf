variable "project_id" {
  description = "Google Cloud project that hosts the AiOps preview."
  type        = string
  default     = "enliv-342806"
}

variable "region" {
  description = "Region for every AiOps resource."
  type        = string
  default     = "asia-south1"
}

variable "web_image" {
  description = "Web app image, e.g. asia-south1-docker.pkg.dev/<project>/aiops/web:<git sha>."
  type        = string
}

variable "keycloak_image" {
  description = "Keycloak image, e.g. asia-south1-docker.pkg.dev/<project>/aiops/keycloak:<git sha>."
  type        = string
}

variable "cloud_sql_proxy_version" {
  description = "Cloud SQL Auth Proxy image tag (sidecar next to Keycloak)."
  type        = string
  default     = "2.26.0"
}
