from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import HttpUrl, TypeAdapter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.logger import get_logger
from app.models.freelancer import Freelancer
from app.models.project import Project
from app.schemas.freelancer_schema import (
    ProjectCreate,
    ProjectDeleteResponse,
    ProjectRead,
    ProjectUpdate,
)
from app.schemas.generic import UserJWT
from app.utils.auth_utils import get_current_user

logger = get_logger(__name__)
router = APIRouter(prefix="/projects",
                   tags=["Project", "Freelancer Management"])


@router.get("/", response_model=List[ProjectRead])
async def get_all_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    freelancer_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_db),
):
    try:
        query = select(Project)
        
        if freelancer_id:
            query = query.where(Project.freelancer_id == freelancer_id)
        
        query = query.offset(skip).limit(limit).order_by(Project.created_at.desc())
        
        result = await session.execute(query)
        projects = result.scalars().all()
        
        return [ProjectRead.model_validate(project) for project in projects]
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch projects")


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project_by_id(
    project_id: int,
    session: AsyncSession = Depends(get_db),
):
    try:
        result = await session.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return ProjectRead.model_validate(project)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch project")


@router.post("/", response_model=ProjectRead)
async def create_project(
    project_data: ProjectCreate,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    try:
        result = await session.execute(
            select(Freelancer).where(Freelancer.user_id == int(current_user.sub))
        )
        freelancer = result.scalar_one_or_none()
        
        if not freelancer:
            error_msg = (
                "Freelancer profile not found. Please complete your profile first."
            )
            raise HTTPException(status_code=404, detail=error_msg)
        
        project = Project(
            freelancer_id=freelancer.id,
            title=project_data.title,
            description=project_data.description,
            url=project_data.url.unicode_string() if project_data.url else None,
            cover_image=project_data.cover_image,
            earned=project_data.earned,
            time_taken=project_data.time_taken,
        )
        
        session.add(project)
        await session.commit()
        await session.refresh(project)
        
        return ProjectRead(
            id=project.id,
            freelancer_id=project.freelancer_id,
            title=project.title,
            description=project.description,
            url=(
                TypeAdapter(HttpUrl).validate_python(project.url) 
                if project.url else None
            ),
            cover_image=project.cover_image,
            earned=project.earned,
            time_taken=project.time_taken,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project for user {current_user.sub}: {str(e)}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to create project")


@router.put("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    try:
        result = await session.execute(
            select(Freelancer).where(Freelancer.user_id == int(current_user.sub))
        )
        freelancer = result.scalar_one_or_none()
        
        if not freelancer:
            raise HTTPException(
                status_code=404, 
                detail="Freelancer profile not found"
            )
        
        result = await session.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.freelancer_id != freelancer.id:
            raise HTTPException(
                status_code=403, 
                detail="You can only update your own projects"
            )
        
        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(project, field):
                if (hasattr(value, 'unicode_string') and 
                    field in ['url']):
                    value = value.unicode_string()
                setattr(project, field, value)
        
        await session.commit()
        await session.refresh(project)
        
        return ProjectRead(
            id=project.id,
            freelancer_id=project.freelancer_id,
            title=project.title,
            description=project.description,
            url=(
                TypeAdapter(HttpUrl).validate_python(project.url) 
                if project.url else None
            ),
            cover_image=project.cover_image,
            earned=project.earned,
            time_taken=project.time_taken,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {str(e)}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to update project")


@router.delete("/{project_id}", response_model=ProjectDeleteResponse)
async def delete_project(
    project_id: int,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    try:
        result = await session.execute(
            select(Freelancer).where(Freelancer.user_id == int(current_user.sub))
        )
        freelancer = result.scalar_one_or_none()
        
        if not freelancer:
            raise HTTPException(
                status_code=404, 
                detail="Freelancer profile not found"
            )
        
        result = await session.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.freelancer_id != freelancer.id:
            raise HTTPException(
                status_code=403, 
                detail="You can only delete your own projects"
            )
        
        await session.delete(project)
        await session.commit()
        
        return ProjectDeleteResponse(message="Project deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {str(e)}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete project")
