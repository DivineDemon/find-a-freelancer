"""Database seeding utilities for Find-a-Freelancer application."""

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
    Notification,
    NotificationType,
    Payment,
    PaymentStatus,
    PaymentType,
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
        # Hash the password
        hashed_password = pwd_context.hash(user_data.pop("password"))
        
        # Convert user_type string to enum
        user_type_str = user_data.pop("user_type")
        user_type = (
            UserType.CLIENT_HUNTER 
            if user_type_str == "client_hunter" 
            else UserType.FREELANCER
        )
        
        # Remove the id field to let PostgreSQL auto-increment
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
    
    for freelancer_data in freelancers_data:
        # Remove the id field to let PostgreSQL auto-increment
        freelancer_data.pop("id", None)
        
        freelancer = Freelancer(**freelancer_data)
        session.add(freelancer)
    
    await session.commit()
    logger.info(f"Seeded {len(freelancers_data)} freelancers")


async def seed_client_hunters(
    session: AsyncSession, 
    client_hunters_data: List[Dict[str, Any]]
) -> None:
    """Seed client_hunters table."""
    logger.info("Seeding client hunters...")
    
    for client_hunter_data in client_hunters_data:
        # Remove the id field to let PostgreSQL auto-increment
        client_hunter_data.pop("id", None)
        
        client_hunter = ClientHunter(**client_hunter_data)
        session.add(client_hunter)
    
    await session.commit()
    logger.info(f"Seeded {len(client_hunters_data)} client hunters")


async def seed_chats(session: AsyncSession, chats_data: List[Dict[str, Any]]) -> None:
    """Seed chats table."""
    logger.info("Seeding chats...")
    
    for chat_data in chats_data:
        # Remove the id field to let PostgreSQL auto-increment
        chat_data.pop("id", None)
        
        # Convert ISO string to datetime if present
        if chat_data.get("last_message_at"):
            last_message_str = chat_data["last_message_at"].replace("Z", "+00:00")
            chat_data["last_message_at"] = datetime.fromisoformat(last_message_str)
        
        chat = Chat(**chat_data)
        session.add(chat)
    
    await session.commit()
    logger.info(f"Seeded {len(chats_data)} chats")


async def seed_messages(
    session: AsyncSession, 
    messages_data: List[Dict[str, Any]]
) -> None:
    """Seed messages table."""
    logger.info("Seeding messages...")
    
    for message_data in messages_data:
        # Remove the id field to let PostgreSQL auto-increment
        message_data.pop("id", None)
        
        # Convert ISO strings to datetime if present
        for date_field in ["deleted_at", "edited_at"]:
            if message_data.get(date_field):
                date_str = message_data[date_field].replace("Z", "+00:00")
                message_data[date_field] = datetime.fromisoformat(date_str)
        
        message = Message(**message_data)
        session.add(message)
    
    await session.commit()
    logger.info(f"Seeded {len(messages_data)} messages")


async def seed_payments(
    session: AsyncSession, 
    payments_data: List[Dict[str, Any]]
) -> None:
    """Seed payments table."""
    logger.info("Seeding payments...")
    
    for payment_data in payments_data:
        # Remove the id field to let PostgreSQL auto-increment
        payment_data.pop("id", None)
        
        # Convert string enums to proper enums
        payment_data["status"] = PaymentStatus(payment_data["status"])
        payment_data["payment_type"] = PaymentType(payment_data["payment_type"])
        
        # Convert ISO strings to datetime if present
        for date_field in ["paid_at", "expires_at"]:
            if payment_data.get(date_field):
                date_str = payment_data[date_field].replace("Z", "+00:00")
                payment_data[date_field] = datetime.fromisoformat(date_str)
        
        payment = Payment(**payment_data)
        session.add(payment)
    
    await session.commit()
    logger.info(f"Seeded {len(payments_data)} payments")


async def seed_notifications(
    session: AsyncSession, 
    notifications_data: List[Dict[str, Any]]
) -> None:
    """Seed notifications table."""
    logger.info("Seeding notifications...")
    
    for notification_data in notifications_data:
        # Remove the id field to let PostgreSQL auto-increment
        notification_data.pop("id", None)
        
        # Convert string enum to proper enum
        notification_type_str = notification_data["notification_type"]
        notification_data["notification_type"] = NotificationType(notification_type_str)
        
        # Convert ISO strings to datetime if present
        for date_field in ["read_at", "archived_at"]:
            if notification_data.get(date_field):
                date_str = notification_data[date_field].replace("Z", "+00:00")
                notification_data[date_field] = datetime.fromisoformat(date_str)
        
        notification = Notification(**notification_data)
        session.add(notification)
    
    await session.commit()
    logger.info(f"Seeded {len(notifications_data)} notifications")


async def seed_database() -> bool:
    """Main function to seed the database with initial data."""
    logger.info("Starting database seeding process...")
    
    async with AsyncSessionLocal() as session:
        try:
            # Check if database is empty
            is_empty = await check_if_database_is_empty(session)
            
            if not is_empty:
                logger.info("Database already contains data. Skipping seeding.")
                return False
            
            # Load seed data
            seed_data = load_seed_data()
            if not seed_data:
                logger.error("No seed data available. Skipping seeding.")
                return False
            
            # Seed in order to respect foreign key constraints
            await seed_users(session, seed_data.get("users", []))
            await seed_freelancers(session, seed_data.get("freelancers", []))
            await seed_client_hunters(session, seed_data.get("client_hunters", []))
            await seed_chats(session, seed_data.get("chats", []))
            await seed_messages(session, seed_data.get("messages", []))
            await seed_payments(session, seed_data.get("payments", []))
            await seed_notifications(session, seed_data.get("notifications", []))
            
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
            # Delete all data in reverse order of dependencies
            await session.execute(delete(Notification))
            await session.execute(delete(Payment))
            await session.execute(delete(Message))
            await session.execute(delete(Chat))
            await session.execute(delete(ClientHunter))
            await session.execute(delete(Freelancer))
            await session.execute(delete(User))
            await session.commit()
            
            logger.info("Existing data cleared. Starting fresh seeding...")
            
            # Now seed with fresh data
            return await seed_database()
            
        except Exception as e:
            logger.error(f"Error during force reseeding: {e}")
            await session.rollback()
            return False


if __name__ == "__main__":
    # Run seeding as a standalone script
    asyncio.run(seed_database())
