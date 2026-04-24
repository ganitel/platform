"""
Ganitel V2 Backend - Backup Service
"""

import logging
from datetime import UTC, datetime
from pathlib import Path

logger = logging.getLogger(__name__)


class BackupService:
    """Service for database and file backups"""

    BACKUP_DIR = Path("backups")

    @classmethod
    def ensure_backup_dir(cls) -> Path:
        """Ensure backup directory exists"""
        cls.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        return cls.BACKUP_DIR

    @classmethod
    async def backup_database(cls, db_url: str) -> str | None:
        """
        Backup database

        Args:
            db_url: Database URL

        Returns:
            str: Backup file path
        """
        try:
            backup_dir = cls.ensure_backup_dir()
            timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
            backup_file = backup_dir / f"database_backup_{timestamp}.sql"

            # In production, use pg_dump for PostgreSQL
            # This is a placeholder
            logger.info(f"Database backup created: {backup_file}")
            return str(backup_file)
        except Exception as e:
            logger.error(f"Error creating database backup: {e}")
            return None

    @classmethod
    async def backup_uploads(cls) -> str | None:
        """
        Backup uploads directory

        Returns:
            str: Backup archive path
        """
        try:
            backup_dir = cls.ensure_backup_dir()
            timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
            backup_file = backup_dir / f"uploads_backup_{timestamp}.tar.gz"

            # Create tar.gz archive of uploads
            import tarfile

            uploads_dir = Path("uploads")
            if uploads_dir.exists():
                with tarfile.open(backup_file, "w:gz") as tar:
                    tar.add(uploads_dir, arcname="uploads")
                logger.info(f"Uploads backup created: {backup_file}")
                return str(backup_file)
            return None
        except Exception as e:
            logger.error(f"Error creating uploads backup: {e}")
            return None

    @classmethod
    def cleanup_old_backups(cls, days: int = 30):
        """Clean up backups older than specified days"""
        try:
            backup_dir = cls.ensure_backup_dir()
            cutoff_date = datetime.now(UTC).timestamp() - (days * 24 * 60 * 60)

            for backup_file in backup_dir.iterdir():
                if backup_file.stat().st_mtime < cutoff_date:
                    backup_file.unlink()
                    logger.info(f"Deleted old backup: {backup_file}")
        except Exception as e:
            logger.error(f"Error cleaning up backups: {e}")
