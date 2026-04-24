"""Controlled upload access endpoint tests (TX03)."""

from fastapi import status


def test_download_requires_authentication(client):
    response = client.get(
        "/api/v1/upload/download", params={"file_ref": "/uploads/images/public.jpg"}
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_download_rejects_invalid_file_reference(client, auth_token):
    response = client.get(
        "/api/v1/upload/download",
        headers={"Authorization": f"Bearer {auth_token}"},
        params={"file_ref": "../../etc/passwd"},
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Invalid file reference"


def test_download_denies_unauthorized_user(
    client, auth_token, sample_provider, db_session, monkeypatch, tmp_path
):
    from app.infrastructure.services import media_access_service as media_module

    file_ref = "/uploads/images/provider-private.jpg"
    sample_provider.profile_picture = file_ref
    db_session.add(sample_provider)
    db_session.commit()

    upload_root = tmp_path / "uploads"
    monkeypatch.setattr(media_module.settings, "UPLOAD_DIR", str(upload_root))

    uploads_dir = upload_root / "images"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    target = uploads_dir / "provider-private.jpg"
    target.write_bytes(b"provider-private-content")

    try:
        response = client.get(
            "/api/v1/upload/download",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={"file_ref": file_ref},
        )
    finally:
        if target.exists():
            target.unlink()

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Access denied"


def test_download_returns_file_for_authorized_user(
    client, auth_token, sample_user, db_session, monkeypatch, tmp_path
):
    from app.infrastructure.services import media_access_service as media_module

    file_ref = "/uploads/images/user-owned.jpg"
    sample_user.profile_picture = file_ref
    db_session.add(sample_user)
    db_session.commit()

    upload_root = tmp_path / "uploads"
    monkeypatch.setattr(media_module.settings, "UPLOAD_DIR", str(upload_root))

    uploads_dir = upload_root / "images"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    target = uploads_dir / "user-owned.jpg"
    expected_content = b"user-owned-content"
    target.write_bytes(expected_content)

    try:
        response = client.get(
            "/api/v1/upload/download",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={"file_ref": file_ref},
        )
    finally:
        if target.exists():
            target.unlink()

    assert response.status_code == status.HTTP_200_OK
    assert response.content == expected_content
