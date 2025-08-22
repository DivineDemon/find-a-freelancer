"""
Development configuration example for Find-a-Freelancer backend.
Copy these values to your .env file.
"""

# Database Configuration
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/find_a_freelancer

# Security
# SECRET=your-super-secret-key-here-change-in-production
# JWT_ALGORITHM=HS256
# JWT_EXPIRATION_MINUTES=1440

# Application
# APP_NAME=Find a Freelancer BE
# VERSION=1.0.0
# LOG_LEVEL=INFO

# CORS
# CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Example .env file content:
ENV_EXAMPLE = """
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/find_a_freelancer
SECRET=your-super-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
APP_NAME=Find a Freelancer BE
VERSION=1.0.0
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
"""
