"""
Ganitel V2 Backend - Survey Repository Interface
"""
from abc import abstractmethod

from app.domain.entities.survey import Survey, SurveyStatus
from app.domain.repositories.base_repository import BaseRepository


class ISurveyRepository(BaseRepository[Survey]):
    """Survey repository interface"""

    @abstractmethod
    def get_active_surveys(self, skip: int = 0, limit: int = 100) -> list[Survey]:
        """Get active surveys"""
        raise NotImplementedError

    @abstractmethod
    def get_by_status(self, status: SurveyStatus, skip: int = 0, limit: int = 100) -> list[Survey]:
        """Get surveys by status"""
        raise NotImplementedError

