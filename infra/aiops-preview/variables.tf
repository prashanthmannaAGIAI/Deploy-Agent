variable "project_id" {
  description = "Google Cloud project that hosts the AiOps preview."
  type        = string
  default     = "enliv-342806"
}

variable "region" {
  description = "Region for every AiOps resource. asia-southeast1 (Singapore) because Cloud Run domain mapping is not allowed in asia-south1."
  type        = string
  default     = "asia-southeast1"
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

variable "web_domain" {
  description = "Custom domain for the web app (a subdomain of a domain verified in Search Console)."
  type        = string
  default     = "aiops.zosa-agentic.ai"
}

variable "auth_domain" {
  description = "Custom domain for Keycloak (sign-in)."
  type        = string
  default     = "auth.aiops.zosa-agentic.ai"
}
