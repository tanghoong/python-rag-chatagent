"""
Repository layer for project settings management
Handles CRUD operations for project-based settings in MongoDB
"""
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from models.settings_models import (
    ProjectSettings,
    ProjectSettingsResponse,
    ProjectSettingsCreate,
    ProjectSettingsUpdate,
    AppSettings
)
from database.connection import get_async_database


def _get_settings_collection() -> AsyncIOMotorCollection:
    """Get project settings collection"""
    db = get_async_database()
    return db["project_settings"]


async def create_project_settings(project_data: ProjectSettingsCreate) -> str:
    """
    Create new project settings

    Args:
        project_data: Project settings creation data

    Returns:
        str: Created project settings ID
    """
    collection = _get_settings_collection()

    # Check if project name already exists
    existing = await collection.find_one({"project_name": project_data.project_name})
    if existing:
        raise ValueError(f"Project '{project_data.project_name}' already exists")

    # Use provided settings or defaults
    settings = project_data.settings if project_data.settings else AppSettings()

    project_settings = ProjectSettings(
        project_name=project_data.project_name,
        settings=settings,
        description=project_data.description
    )

    # Convert to dict and prepare for insertion
    settings_dict = project_settings.model_dump(by_alias=True, exclude={"id"})

    result = await collection.insert_one(settings_dict)
    return str(result.inserted_id)


async def get_project_settings(project_name: str) -> Optional[ProjectSettingsResponse]:
    """
    Get project settings by project name

    Args:
        project_name: Project identifier

    Returns:
        ProjectSettingsResponse or None if not found
    """
    collection = _get_settings_collection()

    settings_data = await collection.find_one({"project_name": project_name, "is_active": True})

    if not settings_data:
        return None

    # Convert ObjectId to string for response
    settings_data["id"] = str(settings_data.pop("_id"))

    return ProjectSettingsResponse(**settings_data)


async def get_project_settings_by_id(settings_id: str) -> Optional[ProjectSettingsResponse]:
    """
    Get project settings by ID

    Args:
        settings_id: Project settings ID

    Returns:
        ProjectSettingsResponse or None if not found
    """
    collection = _get_settings_collection()

    try:
        settings_data = await collection.find_one({"_id": ObjectId(settings_id)})

        if not settings_data:
            return None

        # Convert ObjectId to string for response
        settings_data["id"] = str(settings_data.pop("_id"))

        return ProjectSettingsResponse(**settings_data)
    except Exception:
        return None


async def list_project_settings(include_inactive: bool = False) -> List[ProjectSettingsResponse]:
    """
    List all project settings

    Args:
        include_inactive: Whether to include inactive projects

    Returns:
        List of ProjectSettingsResponse
    """
    collection = _get_settings_collection()

    query = {} if include_inactive else {"is_active": True}
    cursor = collection.find(query).sort("created_at", -1)

    settings_list = []
    async for settings_data in cursor:
        settings_data["id"] = str(settings_data.pop("_id"))
        settings_list.append(ProjectSettingsResponse(**settings_data))

    return settings_list


async def update_project_settings(
    project_name: str,
    update_data: ProjectSettingsUpdate
) -> Optional[ProjectSettingsResponse]:
    """
    Update project settings

    Args:
        project_name: Project identifier
        update_data: Update data

    Returns:
        Updated ProjectSettingsResponse or None if not found
    """
    collection = _get_settings_collection()

    # Build update document
    update_doc = {"updated_at": datetime.utcnow()}

    if update_data.settings is not None:
        update_doc["settings"] = update_data.settings.model_dump()

    if update_data.description is not None:
        update_doc["description"] = update_data.description

    if update_data.is_active is not None:
        update_doc["is_active"] = update_data.is_active

    result = await collection.update_one(
        {"project_name": project_name},
        {"$set": update_doc}
    )

    if result.matched_count == 0:
        return None

    return await get_project_settings(project_name)


async def delete_project_settings(project_name: str) -> bool:
    """
    Delete project settings (soft delete by marking as inactive)

    Args:
        project_name: Project identifier

    Returns:
        bool: True if deleted, False if not found
    """
    collection = _get_settings_collection()

    result = await collection.update_one(
        {"project_name": project_name},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )

    return result.matched_count > 0


async def hard_delete_project_settings(project_name: str) -> bool:
    """
    Permanently delete project settings

    Args:
        project_name: Project identifier

    Returns:
        bool: True if deleted, False if not found
    """
    collection = _get_settings_collection()

    result = await collection.delete_one({"project_name": project_name})

    return result.deleted_count > 0
