"""User management router for admin operations and user listing."""

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.logger import get_logger
from app.models.user import User, UserType
from app.routers.auth_router import get_current_user
from app.schemas.user_schema import UserRead, UserUpdate, UserStatsSummary
from app.schemas.freelancer_schema import FreelancerRead

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["User Management"])


async def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Get current user and verify they have admin privileges."""
    # For now, we'll consider verified users as admins
    # In a real app, you might have a separate admin role
    if current_user.is_verified is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


@router.get("/", response_model=List[UserRead])
async def list_users(
    session: Annotated[AsyncSession, Depends(get_session)],
    user_type: UserType | None = Query(
        None, description="Filter by user type"
    ),
    is_active: bool | None = Query(
        None, description="Filter by active status"
    ),
    is_verified: bool | None = Query(
        None, description="Filter by verification status"
    ),
    # Advanced filtering parameters
    min_hourly_rate: float | None = Query(
        None, ge=0, le=10000, description="Minimum hourly rate (0-10000)"
    ),
    max_hourly_rate: float | None = Query(
        None, ge=0, le=10000, description="Maximum hourly rate (0-10000)"
    ),
    min_experience: int | None = Query(
        None, ge=0, le=100, description="Minimum years of experience (0-100)"
    ),
    max_experience: int | None = Query(
        None, ge=0, le=100, description="Maximum years of experience (0-100)"
    ),
    skills: str | None = Query(
        None, description="Comma-separated list of skills to filter by"
    ),
    technologies: str | None = Query(
        None, description="Comma-separated list of technologies to filter by"
    ),
    work_type: str | None = Query(
        None, description="Preferred work type (remote, onsite, hybrid)"
    ),
    search_query: str | None = Query(
        None, description="Search query for name, title, or bio"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=100, 
        description="Maximum number of records to return"
    ),
):
    """List users with advanced filtering, search, and pagination."""
    from sqlalchemy import or_, and_, func
    from app.models.freelancer import Freelancer

    # Start with base user query
    query = select(User).distinct()

    # Join with freelancer profile if we need freelancer-specific filters
    needs_freelancer_join = any([
        min_hourly_rate is not None,
        max_hourly_rate is not None,
        min_experience is not None,
        max_experience is not None,
        skills is not None,
        technologies is not None,
        work_type is not None,
        search_query is not None
    ])

    if needs_freelancer_join:
        query = query.join(Freelancer, User.id == Freelancer.user_id)

    # Apply basic filters
    if user_type:
        query = query.where(User.user_type == user_type)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if is_verified is not None:
        query = query.where(User.is_verified == is_verified)
    
    # Apply advanced freelancer filters
    if min_hourly_rate is not None:
        query = query.where(Freelancer.hourly_rate >= min_hourly_rate)
    if max_hourly_rate is not None:
        query = query.where(Freelancer.hourly_rate <= max_hourly_rate)
    if min_experience is not None:
        query = query.where(Freelancer.years_of_experience >= min_experience)
    if max_experience is not None:
        query = query.where(Freelancer.years_of_experience <= max_experience)

    # Apply skills filter
    if skills:
        skill_list = [skill.strip().lower() for skill in skills.split(",")]
        # Check if any of the required skills are in the freelancer's skills
        skill_conditions = [
            func.lower(func.cast(Freelancer.skills, func.Text)).contains(skill)
            for skill in skill_list
        ]
        query = query.where(or_(*skill_conditions))

    # Apply technologies filter
    if technologies:
        tech_list = [tech.strip().lower() for tech in technologies.split(",")]
        # Check if any of the required technologies are in the freelancer's technologies
        tech_conditions = [
            func.lower(func.cast(Freelancer.technologies,
                       func.Text)).contains(tech)
            for tech in tech_list
        ]
        query = query.where(or_(*tech_conditions))

    # Apply work type filter
    if work_type:
        query = query.where(
            func.cast(Freelancer.preferred_work_type,
                      func.Text).contains(work_type)
        )

    # Apply search query
    if search_query:
        search_term = f"%{search_query.lower()}%"
        search_conditions = [
            func.lower(User.first_name).contains(search_term),
            func.lower(User.last_name).contains(search_term),
            func.lower(Freelancer.title).contains(search_term),
            func.lower(Freelancer.bio).contains(search_term)
        ]
        query = query.where(or_(*search_conditions))

        # Log search queries for analytics
        logger.info(f"Search query executed: '{search_query}' by user")

    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await session.execute(query)
    users = result.scalars().all()
    
    return [UserRead.model_validate(user) for user in users]


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get a specific user by ID."""
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserRead.model_validate(user)


@router.get("/{user_id}/freelancer-profile", response_model=FreelancerRead)
async def get_freelancer_profile(
    user_id: int,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get freelancer profile for a specific user."""
    from app.models.freelancer import Freelancer

    result = await session.execute(
        select(Freelancer).where(Freelancer.user_id == user_id)
    )
    freelancer = result.scalar_one_or_none()

    if not freelancer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Freelancer profile not found"
        )

    return FreelancerRead.model_validate(freelancer)


@router.get("/filters/options", response_model=dict)
async def get_filter_options(
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get available filter options for freelancer discovery."""
    from app.models.freelancer import Freelancer

    try:
        # Get distinct skills
        skills_result = await session.execute(
            select(Freelancer.skills).distinct()
        )
        all_skills = []
        for row in skills_result:
            if row[0]:  # Check if skills exist
                all_skills.extend(row[0])
        unique_skills = list(set(all_skills))

        # Get distinct technologies
        tech_result = await session.execute(
            select(Freelancer.technologies).distinct()
        )
        all_technologies = []
        for row in tech_result:
            if row[0]:  # Check if technologies exist
                all_technologies.extend(row[0])
        unique_technologies = list(set(all_technologies))

        # Get distinct work types
        work_type_result = await session.execute(
            select(Freelancer.preferred_work_type).distinct()
        )
        all_work_types = []
        for row in work_type_result:
            if row[0]:  # Check if work types exist
                all_work_types.extend(row[0])
        unique_work_types = list(set(all_work_types))

        # Get price range
        price_result = await session.execute(
            select(
                func.min(Freelancer.hourly_rate),
                func.max(Freelancer.hourly_rate)
            )
        )
        price_range = price_result.first()

        # Get experience range
        exp_result = await session.execute(
            select(
                func.min(Freelancer.years_of_experience),
                func.max(Freelancer.years_of_experience)
            )
        )
        exp_range = exp_result.first()

        return {
            "skills": sorted(unique_skills),
            "technologies": sorted(unique_technologies),
            "work_types": sorted(unique_work_types),
            "price_range": {
                "min": float(price_range[0]) if price_range[0] else 0,
                "max": float(price_range[1]) if price_range[1] else 1000
            },
            "experience_range": {
                "min": int(exp_range[0]) if exp_range[0] else 0,
                "max": int(exp_range[1]) if exp_range[1] else 50
            }
        }
    except Exception as e:
        # Log the error and return default values
        from app.core.logger import get_logger
        logger = get_logger(__name__)
        logger.error(f"Error fetching filter options: {str(e)}")

        # Return default values to prevent frontend errors
        return {
            "skills": [],
            "technologies": [],
            "work_types": [],
            "price_range": {"min": 0, "max": 1000},
            "experience_range": {"min": 0, "max": 50}
        }


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Update a user (admin only)."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        if field == "new_password" and value:
            user.set_password(value)
        elif field != "current_password" and field != "new_password":
            setattr(user, field, value)
    
    await session.commit()
    await session.refresh(user)
    
    return UserRead.from_orm(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Delete a user (admin only)."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Soft delete - mark as inactive
    user.is_active = False  # type: ignore
    await session.commit()


@router.post("/{user_id}/verify", response_model=UserRead)
async def verify_user(
    user_id: int,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Verify a user account (admin only)."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_verified = True  # type: ignore
    await session.commit()
    await session.refresh(user)
    
    return UserRead.from_orm(user)


@router.get("/stats/summary", response_model=UserStatsSummary)
async def get_user_stats(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get user statistics summary (admin only)."""
    # Count total users
    total_result = await session.execute(select(func.count(User.id)))
    total_users = total_result.scalar() or 0
    
    # Count by user type
    client_hunters_result = await session.execute(
        select(func.count(User.id)).where(
            User.user_type == UserType.CLIENT_HUNTER)
    )
    client_hunters_count = client_hunters_result.scalar() or 0
    
    freelancers_result = await session.execute(
        select(func.count(User.id)).where(
            User.user_type == UserType.FREELANCER)
    )
    freelancers_count = freelancers_result.scalar() or 0
    
    # Count active and verified users
    active_result = await session.execute(
        select(func.count(User.id)).where(User.is_active.is_(True))
    )
    active_users = active_result.scalar() or 0
    
    verified_result = await session.execute(
        select(func.count(User.id)).where(User.is_verified.is_(True))
    )
    verified_users = verified_result.scalar() or 0
    
    return {
        "total_users": total_users,
        "client_hunters": client_hunters_count,
        "freelancers": freelancers_count,
        "active_users": active_users,
        "verified_users": verified_users,
        "verification_rate": (
            round((verified_users / total_users * 100), 2) 
            if total_users > 0 else 0
        )
    }
