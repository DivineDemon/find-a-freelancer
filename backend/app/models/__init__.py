# Import all models to ensure they are registered with SQLAlchemy
from app.models.chat import Chat
from app.models.client_hunter import ClientHunter
from app.models.freelancer import Freelancer
from app.models.message import Message
from app.models.notification import Notification, NotificationType
from app.models.payment import Payment, PaymentStatus, PaymentType
from app.models.user import User, UserType

# Export all models
__all__ = [
    "User",
    "UserType",
    "Freelancer",
    "ClientHunter",
    "Chat",
    "Message",
    "Payment",
    "PaymentStatus",
    "PaymentType",
    "Notification",
    "NotificationType",
]
