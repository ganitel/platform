"""
Ganitel V2 Backend - Policy Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.policy_schemas import PolicyCreateRequest, PolicyResponse
from app.application.use_cases.policies.create_policy import CreatePolicyUseCase
from app.database import get_db
from app.dependencies import get_current_admin
from app.domain.entities.policy import PolicyType
from app.domain.entities.user import User
from app.exceptions import ConflictError, ValidationError
from app.infrastructure.repositories.policy_repository import PolicyRepository

router = APIRouter(prefix="/policies", tags=["policies"])


@router.post("/", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    request: PolicyCreateRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a policy (admin only)"""
    try:
        repository = PolicyRepository(db)
        use_case = CreatePolicyUseCase(repository)

        policy = use_case.execute(
            title=request.title,
            content=request.content,
            policy_type=request.policy_type,
            slug=request.slug,
            display_order=request.display_order,
        )

        return PolicyResponse(
            id=str(policy.id),
            title=policy.title,
            content=policy.content,
            policy_type=policy.policy_type,
            slug=policy.slug,
            is_active=policy.is_active,
            display_order=policy.display_order,
            version=policy.version,
            created_at=policy.created_at,
            updated_at=policy.updated_at,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create policy",
        ) from None


@router.get("/", response_model=list[PolicyResponse])
async def get_policies(
    policy_type: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get policies"""
    try:
        repository = PolicyRepository(db)

        if policy_type:
            try:
                policy_type_enum = PolicyType(policy_type)
                policies = repository.get_by_type(policy_type_enum, skip, limit)
            except ValueError:
                policies = repository.get_active_policies(skip, limit)
        else:
            policies = repository.get_active_policies(skip, limit)

        return [
            PolicyResponse(
                id=str(p.id),
                title=p.title,
                content=p.content,
                policy_type=p.policy_type,
                slug=p.slug,
                is_active=p.is_active,
                display_order=p.display_order,
                version=p.version,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in policies
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get policies",
        ) from None


@router.get("/{slug}", response_model=PolicyResponse)
async def get_policy_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get policy by slug"""
    try:
        repository = PolicyRepository(db)
        policy = repository.get_by_slug(slug)

        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found"
            )

        return PolicyResponse(
            id=str(policy.id),
            title=policy.title,
            content=policy.content,
            policy_type=policy.policy_type,
            slug=policy.slug,
            is_active=policy.is_active,
            display_order=policy.display_order,
            version=policy.version,
            created_at=policy.created_at,
            updated_at=policy.updated_at,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get policy",
        ) from None
