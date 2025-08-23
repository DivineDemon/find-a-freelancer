#!/usr/bin/env python3
"""Database management utility for Find-a-Freelancer application."""

import argparse
import asyncio
import sys
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.constants.seed_data_loader import force_reseed_database, seed_database
from app.core.db import engine
from app.core.db_init import init_db, reset_db
from app.core.logger import get_logger

logger = get_logger(__name__)


async def create_tables():
    """Create all database tables."""
    try:
        await init_db(engine)
        logger.info("✅ Database tables created successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Error creating tables: {e}")
        return False


async def seed_data():
    """Seed the database with initial data."""
    try:
        success = await seed_database()
        if success:
            logger.info("✅ Database seeded successfully!")
        else:
            logger.info("ℹ️ Database already contains data or seeding was skipped.")
        return success
    except Exception as e:
        logger.error(f"❌ Error seeding database: {e}")
        return False


async def force_reseed():
    """Force reseed the database (clears existing data)."""
    try:
        confirm = input(
            "⚠️ This will delete ALL existing data. Are you sure? (yes/no): "
        )
        if confirm.lower() != 'yes':
            logger.info("Operation cancelled.")
            return False
        
        success = await force_reseed_database()
        if success:
            logger.info("✅ Database force reseeded successfully!")
        else:
            logger.error("❌ Force reseeding failed.")
        return success
    except Exception as e:
        logger.error(f"❌ Error force reseeding database: {e}")
        return False


async def reset_database():
    """Reset the database (drop and recreate all tables)."""
    try:
        confirm = input(
            "⚠️ This will drop and recreate ALL tables. Are you sure? (yes/no): "
        )
        if confirm.lower() != 'yes':
            logger.info("Operation cancelled.")
            return False
        
        await reset_db(engine)
        logger.info("✅ Database reset successfully!")
        
        # Ask if user wants to seed data
        seed_confirm = input(
            "Would you like to seed the database with initial data? (yes/no): "
        )
        if seed_confirm.lower() == 'yes':
            await seed_data()
        
        return True
    except Exception as e:
        logger.error(f"❌ Error resetting database: {e}")
        return False


async def setup_fresh_database():
    """Complete fresh database setup (create tables + seed data)."""
    try:
        logger.info("🔨 Setting up fresh database...")
        
        # Create tables
        await create_tables()
        
        # Seed data
        await seed_data()
        
        logger.info("🎉 Fresh database setup completed!")
        return True
    except Exception as e:
        logger.error(f"❌ Error setting up fresh database: {e}")
        return False


async def main():
    """Main function to handle command line arguments."""
    parser = argparse.ArgumentParser(description="Database management utility")
    parser.add_argument(
        "command",
        choices=[
            "create-tables", "seed", "force-reseed", "reset", "setup-fresh"
        ],
        help="Database management command to run"
    )
    
    args = parser.parse_args()
    
    logger.info(f"🚀 Running database command: {args.command}")
    
    try:
        if args.command == "create-tables":
            await create_tables()
        elif args.command == "seed":
            await seed_data()
        elif args.command == "force-reseed":
            await force_reseed()
        elif args.command == "reset":
            await reset_database()
        elif args.command == "setup-fresh":
            await setup_fresh_database()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    logger.info("📊 Find-a-Freelancer Database Management Utility")
    logger.info("=" * 50)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warning("\n⚠️ Operation cancelled by user.")
    except Exception as e:
        logger.error(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
