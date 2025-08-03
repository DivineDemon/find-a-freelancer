from sqlalchemy import Column, Integer, String

from app.core.base import Base


class ClientHunter(Base):  # ORM Model for Client Hunter
    __tablename__ = "client_hunter"
    
    password = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)
    email = Column(String, nullable=False, unique=True)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
