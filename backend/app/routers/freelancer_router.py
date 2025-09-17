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
    FreelancerCompleteUpdate,
)
from app.schemas.generic import UserJWT
from app.schemas.user_schema import (
    ComprehensiveUserResponse,
    FreelancerProfileSummary,
    ProjectSummary,
)
from app.utils.auth_utils import get_current_user

logger = get_logger(__name__)
router = APIRouter(prefix="/freelancer", tags=["Freelancer Management"])

class FilterOptionsResponse(BaseModel):
    skills: List[str]
    hourly_rate_range: dict
    experience_range: dict

class FreelancerStatsResponse(BaseModel):
    total_freelancers: int
    active_freelancers: int
    available_freelancers: int

class StatusToggleResponse(BaseModel):
    message: str
    is_active: bool

class FreelancerUpdate(BaseModel):
    title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    years_of_experience: Optional[int] = None
    skills: Optional[List[str]] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    is_available: Optional[bool] = None
    country: Optional[str] = None

@router.get("/all", response_model=List[DashboardFreelancerResponse])
async def get_all_freelancers(
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
    try:
        query = (
            select(Freelancer, User)
            .options(selectinload(Freelancer.projects))
            .join(User, Freelancer.user_id == User.id)
            .where(User.user_type == "freelancer")
        )

        if min_hourly_rate is not None:
            query = query.where(Freelancer.hourly_rate >= min_hourly_rate)

        if max_hourly_rate is not None:
            query = query.where(Freelancer.hourly_rate <= max_hourly_rate)

        if min_experience is not None:
            query = query.where(Freelancer.years_of_experience >= min_experience)

        if max_experience is not None:
            query = query.where(Freelancer.years_of_experience <= max_experience)

        if skills:
            skill_list = [skill.strip().lower() for skill in skills.split(",")]
            skill_conditions = []
            for i, skill in enumerate(skill_list):
                skill_conditions.append(
                    text(
                        f"freelancers.skills::text ILIKE :skill_pattern_{i}"
                    ).bindparams(
                        **{f"skill_pattern_{i}": f"%{skill}%"}
                    )
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

        query = query.offset(skip).limit(limit)
        result = await session.execute(query)
        rows = result.all()

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

@router.get("/{freelancer_id}", response_model=ComprehensiveUserResponse)
async def get_freelancer(
    freelancer_id: int,
    session: AsyncSession = Depends(get_db)
):
    result = await session.execute(
        select(User)
        .options(
            selectinload(User.freelancer_profile).selectinload(Freelancer.projects)
        )
        .where(
            User.id == freelancer_id, 
            User.user_type == "freelancer"
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Freelancer not found")

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
    }

    if user.freelancer_profile:
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

    return response_data

@router.put("/{freelancer_id}", response_model=FreelancerProfileSummary)
async def update_freelancer(
    freelancer_id: int,
    update_data: FreelancerCompleteUpdate,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    if int(current_user.sub) != freelancer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile"
        )

    result = await session.execute(
        select(User).where(
            User.id == freelancer_id, 
            User.user_type == "freelancer"
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Freelancer not found")

    result = await session.execute(
        select(Freelancer).where(Freelancer.user_id == freelancer_id)
    )
    freelancer = result.scalar_one_or_none()

    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer profile not found")

    user_fields = [
        'email', 'first_name', 'last_name', 'phone', 'profile_picture', 'is_active'
    ]
    for field in user_fields:
        if field in update_data.model_dump(exclude_unset=True):
            value = getattr(update_data, field)
            setattr(user, field, value)

    freelancer_fields = [
        'title', 'bio', 'hourly_rate', 'years_of_experience', 'skills',
        'portfolio_url', 'github_url', 'linkedin_url', 'is_available', 'country'
    ]
    for field in freelancer_fields:
        if field in update_data.model_dump(exclude_unset=True):
            value = getattr(update_data, field)
            if (hasattr(value, '__str__') and 
                field in ['portfolio_url', 'github_url', 'linkedin_url']):
                value = str(value)
            setattr(freelancer, field, value)

    try:
        await session.commit()
        await session.refresh(user)
        await session.refresh(freelancer)
        
        return FreelancerProfileSummary.model_validate(freelancer)
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.patch("/toggle_status/{freelancer_id}", response_model=StatusToggleResponse)
async def toggle_freelancer_status(
    freelancer_id: int,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    if int(current_user.sub) != freelancer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile"
        )

    result = await session.execute(
        select(User).where(
            User.id == freelancer_id, 
            User.user_type == "freelancer"
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Freelancer not found")

    user.is_active = not user.is_active
    await session.commit()

    status_text = "activated" if user.is_active else "deactivated"
    return StatusToggleResponse(
        message=f"Freelancer status {status_text}",
        is_active=user.is_active
    )

@router.get("/filters/options", response_model=FilterOptionsResponse)
async def get_filter_options(session: AsyncSession = Depends(get_db)):
    try:
        skills_result = await session.execute(select(Freelancer.skills))
        all_skills = []
        for row in skills_result:
            if row[0]:
                all_skills.extend(row[0])

        rates_result = await session.execute(
            select(
            func.min(Freelancer.hourly_rate), 
            func.max(Freelancer.hourly_rate)
        )
        )
        rate_row = rates_result.first()
        min_rate, max_rate = (rate_row[0], rate_row[1]) if rate_row else (0, 100)

        experience_result = await session.execute(
            select(
                func.min(Freelancer.years_of_experience),
                func.max(Freelancer.years_of_experience)
            )
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
        return {
            "skills": [],
            "hourly_rate_range": {"min": 0, "max": 100},
            "experience_range": {"min": 0, "max": 20}
        }

@router.get("/stats/summary", response_model=FreelancerStatsResponse)
async def get_freelancer_stats(session: AsyncSession = Depends(get_db)):
    try:
        total_freelancers = await session.scalar(
            select(func.count(User.id)).where(
                User.user_type == "freelancer"
            )
        )

        active_freelancers = await session.scalar(
            select(func.count(User.id)).where(
                User.user_type == "freelancer",
                User.is_active
            )
        )

        available_freelancers = await session.scalar(
            select(func.count(Freelancer.id)).where(
                Freelancer.is_available
            )
        )

        return {
            "total_freelancers": total_freelancers or 0,
            "active_freelancers": active_freelancers or 0,
            "available_freelancers": available_freelancers or 0
        }

    except Exception as e:
        logger.error(f"Error getting freelancer stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
