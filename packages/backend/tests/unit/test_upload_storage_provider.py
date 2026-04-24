import pytest

from app.infrastructure.services.storage_provider import LocalStorageProvider


@pytest.mark.asyncio
async def test_local_storage_upload_accepts_safe_subdirectory(tmp_path):
    provider = LocalStorageProvider(upload_dir=str(tmp_path / "uploads"))

    url = await provider.upload_file(
        file_content=b"hello",
        filename="photo.jpg",
        subdirectory="images",
    )

    assert url == "/uploads/images/photo.jpg"
    assert (tmp_path / "uploads" / "images" / "photo.jpg").exists()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "subdirectory",
    [
        "../etc",
        "images/../secret",
        "..\\..\\etc",
        "/tmp",
        "images/nested",
        "",
    ],
)
async def test_local_storage_upload_rejects_suspicious_subdirectory(
    tmp_path, subdirectory
):
    provider = LocalStorageProvider(upload_dir=str(tmp_path / "uploads"))

    with pytest.raises(ValueError):
        await provider.upload_file(
            file_content=b"hello",
            filename="photo.jpg",
            subdirectory=subdirectory,
        )


@pytest.mark.asyncio
async def test_local_storage_delete_rejects_path_traversal(tmp_path):
    provider = LocalStorageProvider(upload_dir=str(tmp_path / "uploads"))
    outside_file = tmp_path / "outside.txt"
    outside_file.write_text("do-not-delete")

    deleted = await provider.delete_file("/uploads/../../outside.txt")

    assert deleted is False
    assert outside_file.exists()


@pytest.mark.asyncio
async def test_local_storage_delete_valid_file(tmp_path):
    provider = LocalStorageProvider(upload_dir=str(tmp_path / "uploads"))

    await provider.upload_file(
        file_content=b"hello",
        filename="photo.jpg",
        subdirectory="images",
    )

    deleted = await provider.delete_file("/uploads/images/photo.jpg")

    assert deleted is True
    assert not (tmp_path / "uploads" / "images" / "photo.jpg").exists()
