"""
Ganitel V2 Backend - Survey Repository Implementation
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime

from app.domain.entities.survey import Survey, SurveyStatus
from app.domain.repositories.survey_repository import ISurveyRepository

class SurveyRepository(ISurveyRepository):
    """SQLAlchemy implementation of Survey Repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, survey: Survey) -> Survey:
        """Create a new survey"""
        self.db.add(survey)
        self.db.commit()
        self.db.refresh(survey)
        return survey
    
    def get_by_id(self, survey_id: UUID) -> Optional[Survey]:
        """Get survey by ID"""
        return self.db.query(Survey).filter(
            Survey.id == survey_id,
            Survey.deleted_at.is_(None)
        ).first()
    
    def get_active_surveys(self, skip: int = 0, limit: int = 100) -> List[Survey]:
        """Get active surveys"""
        now = datetime.utcnow()
        return self.db.query(Survey).filter(
            Survey.status == SurveyStatus.ACTIVE.value,
            Survey.deleted_at.is_(None),
            (Survey.start_date.is_(None) | (Survey.start_date <= now)),
            (Survey.end_date.is_(None) | (Survey.end_date >= now))
        ).offset(skip).limit(limit).all()
    
    def get_by_status(self, status: SurveyStatus, skip: int = 0, limit: int = 100) -> List[Survey]:
        """Get surveys by status"""
        return self.db.query(Survey).filter(
            Survey.status == status.value,
            Survey.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def update(self, survey: Survey) -> Survey:
        """Update survey"""
        from datetime import datetime
        survey.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(survey)
        return survey
    
    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all surveys"""
        return self.db.query(Survey).filter(
            Survey.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def delete(self, survey_id: UUID) -> bool:
        """Delete survey"""
        survey = self.get_by_id(survey_id)
        if survey:
            self.db.delete(survey)
            self.db.commit()
            return True
        return False

