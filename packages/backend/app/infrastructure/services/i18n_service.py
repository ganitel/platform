"""
Ganitel V2 Backend - Internationalization Service
"""

import json
from pathlib import Path
from typing import ClassVar


class I18nService:
    """Service for internationalization"""

    TRANSLATIONS_DIR = Path("translations")
    DEFAULT_LANGUAGE = "fr"
    SUPPORTED_LANGUAGES: ClassVar[list[str]] = ["fr", "en"]

    _translations: ClassVar[dict[str, dict[str, str]]] = {}

    @classmethod
    def load_translations(cls, language: str | None = None) -> dict[str, str]:
        """Load translations for a language"""
        lang = language or cls.DEFAULT_LANGUAGE

        if lang in cls._translations:
            return cls._translations[lang]

        translation_file = cls.TRANSLATIONS_DIR / f"{lang}.json"

        if translation_file.exists():
            with open(translation_file, encoding="utf-8") as f:
                translations = json.load(f)
                cls._translations[lang] = translations
                return translations

        # Return empty dict if file doesn't exist
        return {}

    @classmethod
    def translate(cls, key: str, language: str | None = None, **kwargs) -> str:
        """
        Translate a key

        Args:
            key: Translation key
            language: Language code
            **kwargs: Variables for string formatting

        Returns:
            str: Translated string
        """
        translations = cls.load_translations(language)
        translation = translations.get(key, key)

        # Format with variables if provided
        if kwargs:
            try:
                translation = translation.format(**kwargs)
            except KeyError:
                pass

        return translation

    @classmethod
    def get_supported_languages(cls) -> list[str]:
        """Get list of supported languages"""
        return cls.SUPPORTED_LANGUAGES
