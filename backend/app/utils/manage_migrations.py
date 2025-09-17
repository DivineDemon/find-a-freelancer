
import os
import subprocess
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.logger import get_logger

logger = get_logger(__name__)


def run_command(command, description):
    try:
        result = subprocess.run(
            command, shell=True, check=True, capture_output=True, text=True
        )
        if result.stdout:
            logger.info(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"{description} failed: {e}")
        if e.stderr:
            logger.error(f"Error: {e.stderr}")
        return False


def main():
    if len(sys.argv) < 2:
        logger.info("Usage: python3 manage_migrations.py <command>")
        logger.info("\nAvailable commands:")
        logger.info("  init          - Initialize Alembic (already done)")
        logger.info("  current       - Show current migration revision")
        logger.info("  history       - Show migration history")
        logger.info("  create <msg>  - Create a new migration")
        logger.info("  upgrade       - Apply pending migrations")
        logger.info("  downgrade     - Revert last migration")
        logger.info("  stamp <rev>   - Mark database as at specific revision")
        logger.info("  check         - Check if database is up to date")
        logger.info("\nExamples:")
        logger.info("  python3 manage_migrations.py create 'add new table'")
        logger.info("  python3 manage_migrations.py upgrade")
        logger.info("  python3 manage_migrations.py current")
        return

    command = sys.argv[1].lower()

    if command == "current":
        run_command("alembic current", "Checking current migration revision")
    
    elif command == "history":
        run_command("alembic history", "Showing migration history")
    
    elif command == "create" and len(sys.argv) > 2:
        message = " ".join(sys.argv[2:])
        run_command(
            f'alembic revision --autogenerate -m "{message}"',
            f"Creating migration: {message}"
        )
    
    elif command == "upgrade":
        run_command("alembic upgrade head", "Applying pending migrations")
    
    elif command == "downgrade":
        run_command("alembic downgrade -1", "Reverting last migration")
    
    elif command == "stamp" and len(sys.argv) > 2:
        revision = sys.argv[2]
        run_command(
            f"alembic stamp {revision}",
            f"Stamping database at revision {revision}"
        )
    
    elif command == "check":
        run_command("alembic check", "Checking if database is up to date")
    
    elif command == "init":
        logger.info(
            "Alembic is already initialized. Use 'create' to make new migrations."
        )
    
    else:
        logger.error(f"Unknown command: {command}")
        logger.info("Run without arguments to see available commands.")


if __name__ == "__main__":
    main()
