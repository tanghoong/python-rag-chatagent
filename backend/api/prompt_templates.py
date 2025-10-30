"""
Prompt Template API Endpoints

Provides REST API for managing and using prompt templates.
Supports CRUD operations, usage tracking, and category filtering.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database.connection import get_async_database
from database.prompt_template_repository import PromptTemplateRepository
from models.prompt_template_models import (
    PromptTemplate,
    PromptTemplateCreate,
    PromptTemplateUpdate,
    PromptTemplateStats
)

router = APIRouter(prefix="/api/prompt-templates", tags=["prompt-templates"])

# Initialize repository
db = get_async_database()
prompt_template_repo = PromptTemplateRepository(db)


@router.get("/list", response_model=List[PromptTemplate])
async def list_templates(
    category: Optional[str] = None,
    is_system: Optional[bool] = None,
    is_custom: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    user_id: str = "default_user"
):
    """
    List prompt templates with optional filters
    
    Args:
        category: Filter by category (rag, tasks, reminders, memory, code, research, writing)
        is_system: Filter system templates (True) or user templates (False)
        is_custom: Filter custom templates (True) or default templates (False)
        skip: Number of templates to skip (pagination)
        limit: Maximum number of templates to return
        user_id: User identifier
        
    Returns:
        List of prompt templates
    """
    try:
        await prompt_template_repo.initialize()
        templates = await prompt_template_repo.list(
            user_id=user_id,
            category=category,
            is_system=is_system,
            is_custom=is_custom,
            skip=skip,
            limit=limit
        )
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch templates: {str(e)}")


@router.get("/popular", response_model=List[PromptTemplate])
async def get_popular_templates(
    limit: int = Query(6, ge=1, le=20),
    user_id: str = "default_user"
):
    """
    Get most popular templates sorted by ranking score
    
    Args:
        limit: Maximum number of templates to return (1-20)
        user_id: User identifier
        
    Returns:
        List of popular prompt templates
    """
    try:
        await prompt_template_repo.initialize()
        templates = await prompt_template_repo.get_popular(user_id=user_id, limit=limit)
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch popular templates: {str(e)}")


@router.get("/recent", response_model=List[PromptTemplate])
async def get_recent_templates(
    limit: int = Query(5, ge=1, le=10),
    user_id: str = "default_user"
):
    """
    Get recently used templates
    
    Args:
        limit: Maximum number of templates to return (1-10)
        user_id: User identifier
        
    Returns:
        List of recently used prompt templates
    """
    try:
        await prompt_template_repo.initialize()
        templates = await prompt_template_repo.get_recent(user_id=user_id, limit=limit)
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent templates: {str(e)}")


@router.get("/categories", response_model=List[str])
async def get_categories(user_id: str = "default_user"):
    """
    Get all available template categories
    
    Args:
        user_id: User identifier
        
    Returns:
        List of category names
    """
    try:
        await prompt_template_repo.initialize()
        categories = await prompt_template_repo.get_categories(user_id=user_id)
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")


@router.get("/stats", response_model=PromptTemplateStats)
async def get_template_stats(user_id: str = "default_user"):
    """
    Get template usage statistics
    
    Args:
        user_id: User identifier
        
    Returns:
        Template statistics including counts and most popular
    """
    try:
        await prompt_template_repo.initialize()
        stats = await prompt_template_repo.get_stats(user_id=user_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch template stats: {str(e)}")


@router.get("/{template_id}", response_model=PromptTemplate)
async def get_template(template_id: str, user_id: str = "default_user"):
    """
    Get a specific template by ID
    
    Args:
        template_id: Template identifier
        user_id: User identifier
        
    Returns:
        Prompt template or 404 if not found
    """
    try:
        await prompt_template_repo.initialize()
        template = await prompt_template_repo.get_by_id(template_id, user_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch template: {str(e)}")


@router.post("/create", response_model=PromptTemplate)
async def create_template(
    template_data: PromptTemplateCreate,
    user_id: str = "default_user"
):
    """
    Create a new custom template
    
    Args:
        template_data: Template creation data
        user_id: User identifier
        
    Returns:
        Created template
    """
    try:
        await prompt_template_repo.initialize()
        
        # Force custom template settings
        template_data.is_system = False
        template_data.is_custom = True
        
        template = await prompt_template_repo.create(template_data, user_id)
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create template: {str(e)}")


@router.put("/{template_id}", response_model=PromptTemplate)
async def update_template(
    template_id: str,
    template_data: PromptTemplateUpdate,
    user_id: str = "default_user"
):
    """
    Update a custom template (only custom templates can be updated)
    
    Args:
        template_id: Template identifier
        template_data: Template update data
        user_id: User identifier
        
    Returns:
        Updated template or 404 if not found
    """
    try:
        await prompt_template_repo.initialize()
        template = await prompt_template_repo.update(template_id, template_data, user_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found or not editable")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update template: {str(e)}")


@router.delete("/{template_id}")
async def delete_template(template_id: str, user_id: str = "default_user"):
    """
    Delete a custom template (only custom templates can be deleted)
    
    Args:
        template_id: Template identifier
        user_id: User identifier
        
    Returns:
        Success status
    """
    try:
        await prompt_template_repo.initialize()
        success = await prompt_template_repo.delete(template_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Template not found or not deletable")
        return {"success": True, "message": "Template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete template: {str(e)}")


@router.post("/{template_id}/track-usage", response_model=PromptTemplate)
async def track_template_usage(
    template_id: str,
    success: bool = True,
    user_id: str = "default_user"
):
    """
    Track template usage for analytics and ranking
    
    Args:
        template_id: Template identifier
        success: Whether the template usage was successful
        user_id: User identifier
        
    Returns:
        Updated template with new usage stats
    """
    try:
        await prompt_template_repo.initialize()
        template = await prompt_template_repo.track_usage(template_id, user_id, success)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track usage: {str(e)}")