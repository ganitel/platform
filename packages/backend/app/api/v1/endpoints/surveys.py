"""
Ganitel V2 Backend - Survey Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.survey_schemas import SurveyCreateRequest, SurveyResponse
from app.application.use_cases.surveys.create_survey import CreateSurveyUseCase
from app.database import get_db
from app.dependencies import get_current_admin
from app.domain.entities.user import User
from app.exceptions import ValidationError
from app.infrastructure.repositories.survey_repository import SurveyRepository

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.post("/", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
async def create_survey(
    request: SurveyCreateRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a survey (admin only)"""
    try:
        repository = SurveyRepository(db)
        use_case = CreateSurveyUseCase(repository)

        survey = use_case.execute(
            title=request.title,
            description=request.description,
            category=request.category,
            start_date=request.start_date,
            end_date=request.end_date,
            is_anonymous=request.is_anonymous,
            allow_multiple_responses=request.allow_multiple_responses,
        )

        return SurveyResponse(
            id=str(survey.id),
            title=survey.title,
            description=survey.description,
            category=survey.category,
            status=survey.status,
            start_date=survey.start_date,
            end_date=survey.end_date,
            is_anonymous=survey.is_anonymous,
            allow_multiple_responses=survey.allow_multiple_responses,
            response_count=survey.response_count,
            created_at=survey.created_at,
            updated_at=survey.updated_at,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create survey",
        ) from None


@router.get("/active", response_model=list[SurveyResponse])
async def get_active_surveys(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    """Get active surveys"""
    try:
        repository = SurveyRepository(db)
        surveys = repository.get_active_surveys(skip, limit)

        return [
            SurveyResponse(
                id=str(s.id),
                title=s.title,
                description=s.description,
                category=s.category,
                status=s.status,
                start_date=s.start_date,
                end_date=s.end_date,
                is_anonymous=s.is_anonymous,
                allow_multiple_responses=s.allow_multiple_responses,
                response_count=s.response_count,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in surveys
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get active surveys",
        ) from None
