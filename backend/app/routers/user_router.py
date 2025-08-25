"""User management router for admin operations and user listing."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.logger import get_logger
from app.models.freelancer import Freelancer
from app.models.user import User
from app.routers.auth_router import get_current_user
from app.schemas.freelancer_schema import FreelancerRead
from app.schemas.user_schema import UserRead, UserUpdate

logger = get_logger(__name__)
router = APIRouter()


# Response models for API documentation
class FilterOptionsResponse(BaseModel):
    """Response model for filter options."""
    skills: List[str]
    technologies: List[str]
    hourly_rate_range: dict
    experience_range: dict


class UserStatsResponse(BaseModel):
    """Response model for user statistics."""
    total_users: int
    client_hunters: int
    freelancers: int
    active_users: int


@router.get("/me", response_model=UserRead)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: int, db=Depends(get_db)):
    """Get user by ID."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/freelancer-profile", response_model=FreelancerRead)
async def get_freelancer_profile(user_id: int, db=Depends(get_db)):
    """Get freelancer profile by user ID."""
    freelancer = await db.execute(
        select(Freelancer)
        .options(selectinload(Freelancer.projects))
        .where(Freelancer.user_id == user_id)
    )
    freelancer = freelancer.scalar_one_or_none()

    if not freelancer:
        raise HTTPException(
            status_code=404, detail="Freelancer profile not found")

    return freelancer


@router.get("", response_model=List[UserRead])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    min_hourly_rate: Optional[float] = Query(None, ge=0),
    max_hourly_rate: Optional[float] = Query(None, ge=0),
    min_experience: Optional[int] = Query(None, ge=0),
    max_experience: Optional[int] = Query(None, ge=0),
    skills: Optional[str] = Query(None),
    technologies: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    search_query: Optional[str] = Query(None),
    db=Depends(get_db)
):
    """List users with filtering options."""
    try:
        # Start with base query for freelancers
        query = (
            select(User)
            .join(Freelancer, User.id == Freelancer.user_id)
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
            query = query.where(
                or_(*[func.lower(Freelancer.skills).contains(skill)
                    for skill in skill_list])
            )

        if technologies:
            tech_list = [tech.strip().lower()
                         for tech in technologies.split(",")]
            query = query.where(
                or_(*[func.lower(Freelancer.technologies).contains(tech)
                    for tech in tech_list])
            )

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
        result = await db.execute(query)
        users = result.scalars().all()

        return users

    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/filters/options", response_model=FilterOptionsResponse)
async def get_filter_options(db=Depends(get_db)):
    """Get available filter options for user discovery."""
    try:
        # Get skills and technologies from freelancers
        skills_result = await db.execute(
            select(Freelancer.skills)
        )
        all_skills = []
        for row in skills_result:
            if row[0]:
                all_skills.extend(row[0])

        technologies_result = await db.execute(
            select(Freelancer.technologies)
        )
        all_technologies = []
        for row in technologies_result:
            if row[0]:
                all_technologies.extend(row[0])

        # Get price and experience ranges
        rates_result = await db.execute(
            select(func.min(Freelancer.hourly_rate),
                   func.max(Freelancer.hourly_rate))
        )
        min_rate, max_rate = rates_result.first()

        experience_result = await db.execute(
            select(func.min(Freelancer.years_of_experience),
                   func.max(Freelancer.years_of_experience))
        )
        min_exp, max_exp = experience_result.first()

        return {
            "skills": list(set(all_skills)),
            "technologies": list(set(all_technologies)),
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
            "technologies": [],
            "hourly_rate_range": {"min": 0, "max": 100},
            "experience_range": {"min": 0, "max": 20}
        }


@router.get("/stats/summary", response_model=UserStatsResponse)
async def get_user_stats(db=Depends(get_db)):
    """Get user statistics summary."""
    try:
        # Count total users
        total_users = await db.scalar(select(func.count(User.id)))

        # Count by user type
        client_hunters = await db.scalar(
            select(func.count(User.id)).where(
                User.user_type == "client_hunter")
        )
        freelancers = await db.scalar(
            select(func.count(User.id)).where(User.user_type == "freelancer")
        )

        # Count active users
        active_users = await db.scalar(
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


@router.put("/me", response_model=UserRead)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Update current user information."""
    try:
        # Update user fields
        for field, value in user_update.dict(exclude_unset=True).items():
            setattr(current_user, field, value)

        await db.commit()
        await db.refresh(current_user)
        return current_user

    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
