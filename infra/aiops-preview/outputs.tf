output "web_url" {
  description = "AiOps web app."
  value       = google_cloud_run_v2_service.web.uri
}

output "keycloak_url" {
  description = "Keycloak (sign-in and admin console at /admin)."
  value       = google_cloud_run_v2_service.keycloak.uri
}

output "expected_web_url" {
  description = "The deterministic URL the services were configured with; should match web_url's host."
  value       = local.web_url
}

output "registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.aiops.repository_id}"
}
