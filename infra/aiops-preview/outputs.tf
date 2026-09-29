output "web_url" {
  description = "AiOps web app."
  value       = google_cloud_run_v2_service.web.uri
}

output "keycloak_url" {
  description = "Keycloak (sign-in and admin console at /admin)."
  value       = google_cloud_run_v2_service.keycloak.uri
}

output "public_web_url" {
  description = "The custom-domain address the services are configured with."
  value       = local.web_url
}

output "registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.aiops.repository_id}"
}

output "dns_records" {
  description = "Records to add at the DNS provider for the custom domains."
  value = {
    for m in [google_cloud_run_domain_mapping.web, google_cloud_run_domain_mapping.auth] :
    m.name => [for r in m.status[0].resource_records : "${r.type} ${r.name} -> ${r.rrdata}"]
  }
}
