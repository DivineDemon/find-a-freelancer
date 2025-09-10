"""User management router for admin operations and user listing."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.logger import get_logger
from app.models.freelancer import Freelancer
from app.models.user import User
from app.schemas.freelancer_schema import (
    DashboardFreelancerResponse,
)
from app.schemas.generic import UserJWT
from app.schemas.user_schema import (
    ClientHunterProfileSummary,
    ComprehensiveUserResponse,
    FreelancerProfileSummary,
    ProjectSummary,
    UserRead,
)
from app.utils.auth_utils import get_current_user

logger = get_logger(__name__)
router = APIRouter(prefix="/users", tags=["User Management"])


# Response models for API documentation
class FilterOptionsResponse(BaseModel):
    """Response model for filter options."""
    skills: List[str]
    hourly_rate_range: dict
    experience_range: dict


class UserStatsResponse(BaseModel):
    """Response model for user statistics."""
    total_users: int
    client_hunters: int
    freelancers: int
    active_users: int


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get current user information."""
    # Get the full user object from the database
    user_result = await session.execute(
        select(User).where(User.id == int(current_user.sub))
    )
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserRead.model_validate(user)


@router.get("/{user_id}", response_model=ComprehensiveUserResponse)
async def get_user(user_id: int, session: AsyncSession = Depends(get_db)):
    """Get comprehensive user data by ID including profile and projects."""
    # Get user with all related data
    result = await session.execute(
        select(User)
        .options(
            selectinload(User.freelancer_profile).selectinload(
                Freelancer.projects),
            selectinload(User.client_hunter_profile)
        )
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Build comprehensive response
    response_data = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "profile_picture": user.profile_picture,
        "user_type": user.user_type,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "freelancer_profile": None,
        "client_hunter_profile": None,
        "projects": None
    }

    # Add freelancer profile and projects if user is a freelancer
    if user.user_type == "freelancer" and user.freelancer_profile:
        freelancer = user.freelancer_profile
        response_data["freelancer_profile"] = FreelancerProfileSummary(
            id=freelancer.id,
            title=freelancer.title,
            bio=freelancer.bio,
            hourly_rate=freelancer.hourly_rate,
            years_of_experience=freelancer.years_of_experience,
            skills=freelancer.skills,
            portfolio_url=freelancer.portfolio_url,
            github_url=freelancer.github_url,
            linkedin_url=freelancer.linkedin_url,
            is_available=freelancer.is_available,
            country=freelancer.country,
            created_at=freelancer.created_at,
            updated_at=freelancer.updated_at
        )

        # Add projects if they exist
        if freelancer.projects:
            response_data["projects"] = [
                ProjectSummary(
                    id=project.id,
                    title=project.title,
                    description=project.description,
                    url=project.url,
                    cover_image=project.cover_image,
                    earned=project.earned,
                    time_taken=project.time_taken,
                    created_at=project.created_at,
                    updated_at=project.updated_at
                )
                for project in freelancer.projects
            ]

    # Add client hunter profile if user is a client hunter
    elif user.user_type == "client_hunter" and user.client_hunter_profile:
        client_hunter = user.client_hunter_profile
        response_data["client_hunter_profile"] = ClientHunterProfileSummary(
            id=client_hunter.id,
            first_name=client_hunter.first_name,
            last_name=client_hunter.last_name,
            country=client_hunter.country,
            is_paid=client_hunter.is_paid,
            payment_date=client_hunter.payment_date,
            created_at=client_hunter.created_at,
            updated_at=client_hunter.updated_at
        )

    return response_data


@router.get("", response_model=List[DashboardFreelancerResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    min_hourly_rate: Optional[float] = Query(None, ge=0),
    max_hourly_rate: Optional[float] = Query(None, ge=0),
    min_experience: Optional[int] = Query(None, ge=0),
    max_experience: Optional[int] = Query(None, ge=0),
    skills: Optional[str] = Query(None),
    search_query: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_db)
):
    """List freelancers with user information and filtering options."""
    try:
        # Start with base query for freelancers with user data
        query = (
            select(Freelancer, User)
            .options(selectinload(Freelancer.projects))
            .join(User, Freelancer.user_id == User.id)
            .where(User.user_type == "freelancer")
        )

        # Apply filters
        if min_hourly_rate is not None:
            query = query.where(Freelancer.hourly_rate >= min_hourly_rate)

        if max_hourly_rate is not None:
            query = query.where(Freelancer.hourly_rate <= max_hourly_rate)

        if min_experience is not None:
            query = query.where(
                Freelancer.years_of_experience >= min_experience)

        if max_experience is not None:
            query = query.where(
                Freelancer.years_of_experience <= max_experience)

        if skills:
            skill_list = [skill.strip().lower() for skill in skills.split(",")]
            # Use PostgreSQL JSON contains operator for skills filtering
            skill_conditions = []
            for i, skill in enumerate(skill_list):
                skill_conditions.append(
                    text(f"freelancers.skills::text \
                        ILIKE :skill_pattern_{i}").bindparams(
                        **{f"skill_pattern_{i}": f"%{skill}%"})
                )
            query = query.where(or_(*skill_conditions))


        if search_query:
            search_term = f"%{search_query.lower()}%"
            query = query.where(
                or_(
                    func.lower(User.first_name).like(search_term),
                    func.lower(User.last_name).like(search_term),
                    func.lower(Freelancer.title).like(search_term),
                    func.lower(Freelancer.bio).like(search_term)
                )
            )

        # Apply pagination
        query = query.offset(skip).limit(limit)

        # Execute query
        result = await session.execute(query)
        rows = result.all()

        # Map to dashboard response format
        dashboard_freelancers = []
        for freelancer, user in rows:
            freelancer_data = {
                "freelancer_image": user.profile_picture,
                "freelancer_position": freelancer.title,
                "freelancer_rate": freelancer.hourly_rate,
                "freelancer_experience": freelancer.years_of_experience,
                "skills": freelancer.skills,
                "user_id": user.id,
                "freelancer_id": freelancer.id,
                "freelancer_first_name": user.first_name,
                "freelancer_last_name": user.last_name,
            }
            dashboard_freelancers.append(freelancer_data)

        return dashboard_freelancers

    except Exception as e:
        logger.error(f"Error listing freelancers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/filters/options", response_model=FilterOptionsResponse)
async def get_filter_options(session: AsyncSession = Depends(get_db)):
    """Get available filter options for user discovery."""
    try:
        # Get skills from freelancers
        skills_result = await session.execute(
            select(Freelancer.skills)
        )
        all_skills = []
        for row in skills_result:
            if row[0]:
                all_skills.extend(row[0])

        # Get price and experience ranges
        rates_result = await session.execute(
            select(func.min(Freelancer.hourly_rate),
                   func.max(Freelancer.hourly_rate))
        )
        rate_row = rates_result.first()
        min_rate, max_rate = (
            rate_row[0], rate_row[1]) if rate_row else (0, 100)

        experience_result = await session.execute(
            select(func.min(Freelancer.years_of_experience),
                   func.max(Freelancer.years_of_experience))
        )
        exp_row = experience_result.first()
        min_exp, max_exp = (exp_row[0], exp_row[1]) if exp_row else (0, 20)

        return {
            "skills": list(set(all_skills)),
            "hourly_rate_range": {
                "min": min_rate or 0,
                "max": max_rate or 100
            },
            "experience_range": {
                "min": min_exp or 0,
                "max": max_exp or 20
            }
        }

    except Exception as e:
        logger.error(f"Error getting filter options: {e}")
        # Return default values on error
        return {
            "skills": [],
            "hourly_rate_range": {"min": 0, "max": 100},
            "experience_range": {"min": 0, "max": 20}
        }


@router.get("/stats/summary", response_model=UserStatsResponse)
async def get_user_stats(session: AsyncSession = Depends(get_db)):
    """Get user statistics summary."""
    try:
        # Count total users
        total_users = await session.scalar(select(func.count(User.id)))

        # Count by user type
        client_hunters = await session.scalar(
            select(func.count(User.id)).where(
                User.user_type == "client_hunter")
        )
        freelancers = await session.scalar(
            select(func.count(User.id)).where(User.user_type == "freelancer")
        )

        # Count active users
        active_users = await session.scalar(
            select(func.count(User.id)).where(User.is_active)
        )

        return {
            "total_users": total_users,
            "client_hunters": client_hunters,
            "freelancers": freelancers,
            "active_users": active_users
        }

    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Removed redundant PUT /me endpoint - use /auth/me instead


# Profile creation is now handled automatically during registration
