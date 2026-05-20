from collections.abc import Iterable


def normalize_db_entry(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.strip().lower()
    return cleaned or None


def normalize_db_entries(values: Iterable[str | None]) -> set[str]:
    return {entry for value in values if (entry := normalize_db_entry(value))}
