"""
Repository layer for persona management
Handles CRUD operations for AI agent personas
"""
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from models.persona_models import Persona, PersonaResponse, PersonaListResponse
from database.connection import get_async_database


async def get_personas_collection() -> AsyncIOMotorCollection:
    """Get the personas collection"""
    db = get_async_database()
    return db["personas"]


async def create_persona(persona_data: dict) -> str:
    """
    Create a new persona

    Args:
        persona_data: Persona data dictionary

    Returns:
        str: Created persona ID
    """
    collection = await get_personas_collection()

    persona = Persona(**persona_data)
    persona_dict = persona.model_dump(by_alias=True, exclude={"id"})

    result = await collection.insert_one(persona_dict)
    return str(result.inserted_id)


async def get_persona(persona_id: str) -> Optional[PersonaResponse]:
    """
    Get a specific persona by ID

    Args:
        persona_id: Persona ID

    Returns:
        PersonaResponse or None if not found
    """
    collection = await get_personas_collection()

    try:
        persona_data = await collection.find_one({"_id": ObjectId(persona_id)})

        if not persona_data:
            return None

        return PersonaResponse(
            id=str(persona_data["_id"]),
            name=persona_data.get("name", "Unnamed Persona"),
            description=persona_data.get("description", ""),
            system_prompt=persona_data.get("system_prompt", ""),
            temperature=persona_data.get("temperature", 0.2),
            model_preference=persona_data.get("model_preference"),
            provider_preference=persona_data.get("provider_preference"),
            capabilities=persona_data.get("capabilities", []),
            is_system=persona_data.get("is_system", False),
            is_active=persona_data.get("is_active", True),
            created_at=persona_data.get("created_at", datetime.utcnow()),
            updated_at=persona_data.get("updated_at", datetime.utcnow()),
            use_count=persona_data.get("use_count", 0),
            avatar_emoji=persona_data.get("avatar_emoji", "🤖"),
            tags=persona_data.get("tags", [])
        )
    except Exception as e:
        print(f"Error getting persona: {e}")
        return None


async def list_personas(
    is_system: Optional[bool] = None,
    is_active: bool = True,
    tags: Optional[List[str]] = None,
    limit: int = 50,
    skip: int = 0
) -> List[PersonaListResponse]:
    """
    List personas with optional filtering

    Args:
        is_system: Filter by system/custom personas
        is_active: Filter by active status
        tags: Filter by tags
        limit: Maximum number to return
        skip: Number to skip (pagination)

    Returns:
        List of PersonaListResponse objects
    """
    collection = await get_personas_collection()

    # Build query
    query = {"is_active": is_active}
    if is_system is not None:
        query["is_system"] = is_system
    if tags:
        query["tags"] = {"$in": tags}

    cursor = collection.find(query).sort("use_count", -1).skip(skip).limit(limit)

    personas = []
    async for persona_data in cursor:
        personas.append(PersonaListResponse(
            id=str(persona_data["_id"]),
            name=persona_data.get("name", "Unnamed Persona"),
            description=persona_data.get("description", ""),
            temperature=persona_data.get("temperature", 0.2),
            capabilities=persona_data.get("capabilities", []),
            is_system=persona_data.get("is_system", False),
            is_active=persona_data.get("is_active", True),
            use_count=persona_data.get("use_count", 0),
            avatar_emoji=persona_data.get("avatar_emoji", "🤖"),
            tags=persona_data.get("tags", [])
        ))

    return personas


async def update_persona(persona_id: str, update_data: dict) -> bool:
    """
    Update a persona

    Args:
        persona_id: Persona ID
        update_data: Fields to update

    Returns:
        bool: True if successful, False otherwise
    """
    collection = await get_personas_collection()

    try:
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()

        # Don't allow updating is_system for system personas
        persona = await collection.find_one({"_id": ObjectId(persona_id)})
        if persona and persona.get("is_system"):
            update_data.pop("is_system", None)

        result = await collection.update_one(
            {"_id": ObjectId(persona_id)},
            {"$set": update_data}
        )

        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating persona: {e}")
        return False


async def delete_persona(persona_id: str) -> bool:
    """
    Delete a persona (only custom personas, not system personas)

    Args:
        persona_id: Persona ID

    Returns:
        bool: True if deleted, False otherwise
    """
    collection = await get_personas_collection()

    try:
        # Check if it's a system persona
        persona = await collection.find_one({"_id": ObjectId(persona_id)})
        if persona and persona.get("is_system"):
            return False  # Don't delete system personas

        result = await collection.delete_one({"_id": ObjectId(persona_id)})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting persona: {e}")
        return False


async def increment_persona_use_count(persona_id: str) -> bool:
    """
    Increment the use count for a persona

    Args:
        persona_id: Persona ID

    Returns:
        bool: True if successful, False otherwise
    """
    collection = await get_personas_collection()

    try:
        result = await collection.update_one(
            {"_id": ObjectId(persona_id)},
            {
                "$inc": {"use_count": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        return result.modified_count > 0
    except Exception as e:
        print(f"Error incrementing use count: {e}")
        return False


async def get_default_persona() -> Optional[PersonaResponse]:
    """
    Get the default persona (Mira)

    Returns:
        PersonaResponse or None
    """
    collection = await get_personas_collection()

    persona_data = await collection.find_one({"name": "Mira", "is_system": True})

    if not persona_data:
        return None

    return PersonaResponse(
        id=str(persona_data["_id"]),
        name=persona_data.get("name", "Mira"),
        description=persona_data.get("description", ""),
        system_prompt=persona_data.get("system_prompt", ""),
        temperature=persona_data.get("temperature", 0.2),
        model_preference=persona_data.get("model_preference"),
        provider_preference=persona_data.get("provider_preference"),
        capabilities=persona_data.get("capabilities", []),
        is_system=persona_data.get("is_system", True),
        is_active=persona_data.get("is_active", True),
        created_at=persona_data.get("created_at", datetime.utcnow()),
        updated_at=persona_data.get("updated_at", datetime.utcnow()),
        use_count=persona_data.get("use_count", 0),
        avatar_emoji=persona_data.get("avatar_emoji", "🤖"),
        tags=persona_data.get("tags", [])
    )


async def get_all_tags() -> List[str]:
    """
    Get all unique tags from all personas

    Returns:
        List of unique tags
    """
    collection = await get_personas_collection()

    try:
        tags = await collection.distinct("tags")
        return sorted([tag for tag in tags if tag])
    except Exception as e:
        print(f"Error getting tags: {e}")
        return []
