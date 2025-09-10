#!/usr/bin/env python3

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
            print(result.stdout)  # noqa: T201
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"{description} failed: {e}")
        if e.stderr:
            logger.error(f"Error: {e.stderr}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 manage_migrations.py <command>")  # noqa: T201
        print("\nAvailable commands:")  # noqa: T201
        print("  init          - Initialize Alembic (already done)")  # noqa: T201
        print("  current       - Show current migration revision")  # noqa: T201
        print("  history       - Show migration history")  # noqa: T201
        print("  create <msg>  - Create a new migration")  # noqa: T201
        print("  upgrade       - Apply pending migrations")  # noqa: T201
        print("  downgrade     - Revert last migration")  # noqa: T201
        print("  stamp <rev>   - Mark database as at specific revision")  # noqa: T201
        print("  check         - Check if database is up to date")  # noqa: T201
        print("\nExamples:")  # noqa: T201
        print("  python3 manage_migrations.py create 'add new table'")  # noqa: T201
        print("  python3 manage_migrations.py upgrade")  # noqa: T201
        print("  python3 manage_migrations.py current")  # noqa: T201
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
        print("Alembic is already initialized. Use 'create' to make new migrations.")  # noqa: T201
    
    else:
        logger.error(f"Unknown command: {command}")
        print("Run without arguments to see available commands.")  # noqa: T201


if __name__ == "__main__":
    main()
