"""
Ganitel V2 Backend - Create Survey Use Case
"""
from datetime import datetime

from app.domain.entities.survey import Survey, SurveyStatus
from app.domain.repositories.survey_repository import ISurveyRepository
from app.exceptions import ValidationError


class CreateSurveyUseCase:
    """Use case for creating a survey"""

    def __init__(self, survey_repository: ISurveyRepository):
        self.survey_repository = survey_repository

    def execute(
        self,
        title: str,
        description: str | None = None,
        category: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        is_anonymous: bool = False,
        allow_multiple_responses: bool = False
    ) -> Survey:
        """
        Create a survey

        Args:
            title: Survey title
            description: Survey description
            category: Survey category
            start_date: Survey start date
            end_date: Survey end date
            is_anonymous: Whether survey is anonymous
            allow_multiple_responses: Whether multiple responses allowed

        Returns:
            Survey: Created survey
        """
        if not title:
            raise ValidationError("Survey title is required")

        # Validate dates
        if start_date and end_date and start_date >= end_date:
            raise ValidationError("End date must be after start date")

        survey = Survey(
            title=title,
            description=description,
            category=category,
            start_date=start_date,
            end_date=end_date,
            is_anonymous=is_anonymous,
            allow_multiple_responses=allow_multiple_responses,
            status=SurveyStatus.DRAFT.value
        )

        return self.survey_repository.create(survey)

