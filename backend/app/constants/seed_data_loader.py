import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from passlib.context import CryptContext
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import AsyncSessionLocal
from app.core.logger import get_logger
from app.models import (
    Chat,
    ClientHunter,
    Freelancer,
    Message,
    Project,
    User,
    UserType,
)

logger = get_logger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def check_if_database_is_empty(session: AsyncSession) -> bool:
    """Check if the database is empty (no users exist)."""
    try:
        result = await session.execute(select(func.count(User.id)))
        user_count = result.scalar()
        return user_count == 0
    except Exception as e:
        logger.error(f"Error checking database status: {e}")
        return False


async def get_user_email_to_id_mapping(session: AsyncSession) -> Dict[str, int]:
    """Get mapping of user emails to user IDs."""
    result = await session.execute(select(User.email, User.id))
    return {email: user_id for email, user_id in result.fetchall()}


async def get_chat_mapping(session: AsyncSession) -> Dict[str, int]:
    """Get mapping of chat initiator_participant emails to chat IDs."""
    from sqlalchemy import alias, join

    initiator_user = alias(User.__table__, name="initiator")
    participant_user = alias(User.__table__, name="participant")

    result = await session.execute(
        select(
            initiator_user.c.email.label("initiator_email"),
            participant_user.c.email.label("participant_email"),
            Chat.id
        )
        .select_from(
            join(Chat, initiator_user, Chat.initiator_id == initiator_user.c.id)
            .join(participant_user, Chat.participant_id == participant_user.c.id)
        )
    )
    return {f"{row[0]}_{row[1]}": row[2] for row in result.fetchall()}


async def get_freelancer_email_to_id_mapping(session: AsyncSession) -> Dict[str, int]:
    """Get mapping of freelancer emails to freelancer IDs."""
    from sqlalchemy import join
    result = await session.execute(
        select(User.email, Freelancer.id)
        .select_from(join(Freelancer, User, Freelancer.user_id == User.id))
    )
    return {email: freelancer_id for email, freelancer_id in result.fetchall()}


def load_seed_data() -> Dict[str, Any]:
    """Load seed data from JSON file."""
    seed_file = Path(__file__).parent / "seed_data.json"
    
    try:
        with open(seed_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info("Seed data loaded successfully from JSON file")
        return data
    except FileNotFoundError:
        logger.error(f"Seed data file not found: {seed_file}")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing seed data JSON: {e}")
        return {}


async def seed_users(session: AsyncSession, users_data: List[Dict[str, Any]]) -> None:
    """Seed users table."""
    logger.info("Seeding users...")
    
    for user_data in users_data:
        hashed_password = pwd_context.hash(user_data.pop("password"))
        
        user_type_str = user_data.pop("user_type")
        user_type = (
            UserType.CLIENT_HUNTER 
            if user_type_str == "client_hunter" 
            else UserType.FREELANCER
        )
        
        user_data.pop("id", None)
        
        user = User(
            **user_data,
            password_hash=hashed_password,
            user_type=user_type
        )
        session.add(user)
        await session.commit()

    logger.info(f"Seeded {len(users_data)} users")


async def seed_freelancers(
    session: AsyncSession, 
    freelancers_data: List[Dict[str, Any]]
) -> None:
    """Seed freelancers table."""
    logger.info("Seeding freelancers...")
    
    user_email_to_id = await get_user_email_to_id_mapping(session)

    for freelancer_data in freelancers_data:
        freelancer_data.pop("id", None)
        
        user_email = freelancer_data.pop("user_email")
        user_id = user_email_to_id.get(user_email)
        if not user_id:
            logger.error(f"User not found for email: {user_email}")
            continue

        freelancer = Freelancer(user_id=user_id, **freelancer_data)
        session.add(freelancer)
    
    await session.commit()
    logger.info(f"Seeded {len(freelancers_data)} freelancers")


async def seed_client_hunters(
    session: AsyncSession, 
    client_hunters_data: List[Dict[str, Any]]
) -> None:
    """Seed client_hunters table."""
    logger.info("Seeding client hunters...")
    
    user_email_to_id = await get_user_email_to_id_mapping(session)

    for client_hunter_data in client_hunters_data:
        client_hunter_data.pop("id", None)
        
        user_email = client_hunter_data.pop("user_email")
        user_id = user_email_to_id.get(user_email)
        if not user_id:
            logger.error(f"User not found for email: {user_email}")
            continue

        client_hunter = ClientHunter(user_id=user_id, **client_hunter_data)
        session.add(client_hunter)
    
    await session.commit()
    logger.info(f"Seeded {len(client_hunters_data)} client hunters")


async def seed_chats(session: AsyncSession, chats_data: List[Dict[str, Any]]) -> None:
    """Seed chats table."""
    logger.info("Seeding chats...")
    
    user_email_to_id = await get_user_email_to_id_mapping(session)

    for chat_data in chats_data:
        chat_data.pop("id", None)
        
        initiator_email = chat_data.pop("initiator_email")
        participant_email = chat_data.pop("participant_email")

        initiator_id = user_email_to_id.get(initiator_email)
        participant_id = user_email_to_id.get(participant_email)

        if not initiator_id or not participant_id:
            logger.error(
                f"User not found for emails: {initiator_email}, {participant_email}")
            continue

        if chat_data.get("last_message_at"):
            last_message_str = chat_data["last_message_at"].replace("Z", "+00:00")
            dt = datetime.fromisoformat(last_message_str)
            chat_data["last_message_at"] = dt.replace(tzinfo=None)
        
        chat = Chat(
            initiator_id=initiator_id,
            participant_id=participant_id,
            **chat_data
        )
        session.add(chat)
    
    await session.commit()
    logger.info(f"Seeded {len(chats_data)} chats")


async def seed_messages(
    session: AsyncSession, 
    messages_data: List[Dict[str, Any]]
) -> None:
    """Seed messages table."""
    logger.info("Seeding messages...")
    
    user_email_to_id = await get_user_email_to_id_mapping(session)

    chat_mapping = await get_chat_mapping(session)

    for message_data in messages_data:
        message_data.pop("id", None)
        
        chat_initiator_email = message_data.pop("chat_initiator_email")
        chat_participant_email = message_data.pop("chat_participant_email")
        sender_email = message_data.pop("sender_email")

        chat_key = f"{chat_initiator_email}_{chat_participant_email}"
        chat_id = chat_mapping.get(chat_key)
        if not chat_id:
            logger.error(
                f"Chat not found for: {chat_initiator_email}, {chat_participant_email}")
            continue

        sender_id = user_email_to_id.get(sender_email)
        if not sender_id:
            logger.error(f"User not found for email: {sender_email}")
            continue

        for date_field in ["deleted_at", "edited_at"]:
            if message_data.get(date_field):
                date_str = message_data[date_field].replace("Z", "+00:00")
                message_data[date_field] = datetime.fromisoformat(date_str)
        
        message = Message(
            chat_id=chat_id,
            sender_id=sender_id,
            **message_data
        )
        session.add(message)
    
    await session.commit()
    logger.info(f"Seeded {len(messages_data)} messages")


async def seed_projects(
    session: AsyncSession,
    projects_data: List[Dict[str, Any]]
) -> None:
    """Seed projects table."""
    logger.info("Seeding projects...")

    freelancer_email_to_id = await get_freelancer_email_to_id_mapping(session)

    for project_data in projects_data:
        project_data.pop("id", None)

        freelancer_email = project_data.pop("freelancer_email")
        freelancer_id = freelancer_email_to_id.get(freelancer_email)
        if not freelancer_id:
            logger.error(f"Freelancer not found for email: {freelancer_email}")
            continue

        project = Project(freelancer_id=freelancer_id, **project_data)
        session.add(project)

    await session.commit()
    logger.info(f"Seeded {len(projects_data)} projects")


async def seed_payments(
    session: AsyncSession, 
    payments_data: List[Dict[str, Any]]
) -> None:
    """Seed payments table."""
    logger.info("Seeding payments...")
    
    user_email_to_id = await get_user_email_to_id_mapping(session)

    for payment_data in payments_data:
        payment_data.pop("id", None)
        
        user_email = payment_data.pop("user_email")
        user_id = user_email_to_id.get(user_email)
        if not user_id:
            logger.error(f"User not found for email: {user_email}")
            continue
    
    await session.commit()
    logger.info(f"Seeded {len(payments_data)} payments")




async def seed_database() -> bool:
    """Main function to seed the database with initial data."""
    logger.info("Starting database seeding process...")
    
    async with AsyncSessionLocal() as session:
        try:
            is_empty = await check_if_database_is_empty(session)
            
            if not is_empty:
                logger.info("Database already contains data. Skipping seeding.")
                return False
            
            seed_data = load_seed_data()
            if not seed_data:
                logger.error("No seed data available. Skipping seeding.")
                return False
            
            await seed_users(session, seed_data.get("users", []))
            await seed_freelancers(session, seed_data.get("freelancers", []))
            await seed_client_hunters(session, seed_data.get("client_hunters", []))
            await seed_projects(session, seed_data.get("projects", []))
            await seed_chats(session, seed_data.get("chats", []))
            await seed_messages(session, seed_data.get("messages", []))
            await seed_payments(session, seed_data.get("payments", []))
            
            logger.info("Database seeding completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Error during database seeding: {e}")
            await session.rollback()
            return False


async def force_reseed_database() -> bool:
    """Force reseed the database (clears existing data first)."""
    logger.warning("Force reseeding database - this will clear all existing data!")
    
    async with AsyncSessionLocal() as session:
        try:
            await session.execute(delete(Message))
            await session.execute(delete(Chat))
            await session.execute(delete(Project))
            await session.execute(delete(ClientHunter))
            await session.execute(delete(Freelancer))
            await session.execute(delete(User))
            await session.commit()
            
            logger.info("Existing data cleared. Starting fresh seeding...")
            
            return await seed_database()
            
        except Exception as e:
            logger.error(f"Error during force reseeding: {e}")
            await session.rollback()
            return False


if __name__ == "__main__":
    asyncio.run(seed_database())
