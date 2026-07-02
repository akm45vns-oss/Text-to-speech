from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_translation_uses_frontend_json_aliases() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/translate",
            json={
                "text": "Read documents aloud.",
                "sourceLanguage": "auto",
                "targetLanguage": "hi",
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["sourceLanguage"] == "auto"
    assert body["targetLanguage"] == "hi"
    assert body["translatedText"].startswith("[Hindi translation pending]")


def test_history_starts_as_a_list() -> None:
    with TestClient(app) as client:
        response = client.get("/api/history")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
