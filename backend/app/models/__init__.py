# Import all models here for Alembic to detect them
from app.models.chat import Chat
from app.models.client_hunter import ClientHunter
from app.models.freelancer import Freelancer
from app.models.message import Message
from app.models.payment import Payment
from app.models.project import Project
from app.models.user import User, UserType

# Export all models
__all__ = [
    "User",
    "UserType",
    "Freelancer",
    "ClientHunter",
    "Project",
    "Chat",
    "Message",
    "Payment",
]
