from fastapi.testclient import TestClient

from runway_api.main import create_app


def test_healthz_reports_ok() -> None:
    client = TestClient(create_app())

    response = client.get("/healthz")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"] == "0.0.0"
