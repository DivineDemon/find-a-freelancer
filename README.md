# Find-a-Freelancer

A **full-stack, type-safe freelancing platform** built with modern React frontend and async Python FastAPI backend. This platform connects Client Hunters (who outsource work) with skilled Freelancers (developers) for project collaboration.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Backend Overview (`/backend`)](#backend-overview-backend)
  - [Database Models](#database-models)
  - [API Generation](#automatic-api-generation)
  - [Database & ORM](#database--orm)
  - [Database Seeding](#database-seeding)
  - [Linting & Formatting](#backend-linting--formatting)
  - [Environment Variables](#backend-environment-variables)
- [Frontend Overview (`/frontend`)](#frontend-overview-frontend)
  - [Routing](#routing)
  - [State Management](#state-management)
  - [API Integration & Type Safety](#api-integration--type-safety)
  - [Linting & Formatting](#frontend-linting--formatting)
- [Monorepo Tooling & Automation](#monorepo-tooling--automation)
  - [Pre-commit & Post-merge Hooks](#pre-commit--post-merge-hooks)
  - [Type Safety Across the Stack](#type-safety-across-the-stack)
- [Development Workflow](#development-workflow)
- [Database Management](#database-management)
- [Special Features](#special-features)
- [FAQ](#faq)
- [Contributing](#contributing)

---

## Project Overview

**Find-a-Freelancer** is a comprehensive freelancing platform designed to bridge the gap between Client Hunters (users who outsource work) and skilled Freelancers (developers available for hire).

### Key Features

- **User Management**: Two distinct user types with role-based access control
  - **Client Hunters**: Users who outsource work (require one-time payment)
  - **Freelancers**: Developers available for hire (free to join)
- **Freelancer Discovery**: Advanced search by skills, rates, experience, and availability
- **Chat System**: Secure messaging between clients and freelancers
- **Payment Integration**: PayPal integration with one-time fees for Client Hunters
- **Content Moderation**: Message filtering and security features
- **Notification System**: Real-time alerts for users

### Business Model

- **Client Hunters**: Pay one-time fee to access freelancer network
- **Freelancers**: Free to join and create profiles
- **Revenue**: Platform fees from successful project connections

---

## Project Structure

```
find-a-freelancer/
│
├── backend/                # FastAPI backend (Python)
│   ├── app/                # Main backend application code
│   │   ├── core/           # Core config, DB, logger, middleware
│   │   ├── scripts/        # CLI utilities and database management
│   │   ├── utils/          # Utility functions and helpers
│   │   ├── constants/      # Seed data and static files
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── routers/        # API route definitions
│   │   ├── schemas/        # Pydantic schemas for validation
│   │   ├── main.py         # FastAPI app entrypoint
│   │   └── ...             # Other backend modules
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Backend environment variables
│   └── ...                 # Lint config, cache, etc.
│
├── frontend/               # React frontend (TypeScript)
│   ├── src/                # Source code
│   │   ├── routes/         # Route components (file-based routing)
│   │   ├── store/          # Redux store & API services
│   │   ├── assets/         # Static assets (CSS, images)
│   │   └── main.tsx        # App entrypoint
│   ├── index.html          # HTML template
│   ├── package.json        # Frontend dependencies & scripts
│   ├── tsconfig*.json      # TypeScript configs
│   ├── vite.config.ts      # Vite build config
│   └── ...                 # Lint config, etc.
│
├── .husky/                 # Git hooks (pre-commit, post-merge, etc.)
├── README.md               # This file
└── ...
```

---

## Setup & Installation

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** and **pnpm** (or npm/yarn)
- **PostgreSQL** database
- **Git** with Husky hooks

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/find-a-freelancer.git
cd find-a-freelancer
```

### 2. Install Dependencies

```sh
# Install all dependencies (frontend + backend)
pnpm run install:all

# Or install separately:
pnpm install                    # Root dependencies
cd frontend && pnpm install    # Frontend dependencies
cd ../backend && python3 -m pip install -r requirements.txt  # Backend dependencies
```

### 3. Environment Setup

#### Backend (.env file in backend/ directory)
```bash
# Copy from example
cp backend/app/core/dev_config.py backend/.env

# Required variables:
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/find_a_freelancer
SECRET=your-super-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
APP_NAME=Find a Freelancer BE
VERSION=1.0.0
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

#### Frontend (.env file in frontend/ directory)
```bash
VITE_BASE_API_URL=http://127.0.0.1:8000
```

### 4. Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE find_a_freelancer;
```

2. Update `.env` file with database connection string
3. Database will be automatically initialized and seeded when you start the backend server

### 5. Start Development Servers

- **Backend:**
  ```sh
  # 1. Activate virtual environment from root directory
  source .venv/bin/activate
  
  # 2. Navigate to backend directory
  cd backend
  
  # 3. Start the server
  uvicorn app.main:app --reload
  ```
  
  **Alternative: Use the startup script**
  ```sh
  cd backend
  ./start_server.sh
  ```
  
  **Important Notes:**
  - ✅ **Virtual environment must be activated from the root directory** (`find-a-freelancer`)
  - ✅ **Server must be run from the backend directory** (`backend`)
  - ✅ **Module path**: `app.main:app` (no space after colon)
  - ✅ **Server will be available at**: http://localhost:8000
  - ✅ **API documentation at**: http://localhost:8000/docs

- **Frontend:**
  ```sh
  cd frontend
  pnpm run dev
  ```

---

## Backend Overview (`/backend`)

### FastAPI + SQLAlchemy + Pydantic

- **Async-first**: Uses `asyncpg` and SQLAlchemy's async engine for high concurrency.
- **Automatic API Generation**: All routers in `app/routers/` are auto-included.
- **Type-safe**: Pydantic v2 for request/response validation.
- **Database Seeding**: On startup, seeds the database from `constants/seed_data.json` if empty.

#### Folder Details

- **`app/core/`**: Core utilities (DB, config, logger, database management tools).
- **`app/models/`**: SQLAlchemy ORM models for the freelancing platform.
- **`app/schemas/`**: Pydantic schemas for validation and serialization.
- **`app/routers/`**: All API endpoints (RESTful, modular).
- **`app/constants/`**: Static files and seed data.
- **`main.py`**: Entrypoint, includes all routers, sets up CORS, and runs DB init.

### Database Models

The application includes comprehensive models for a freelancing platform:

#### **User Management System**
- **`User`**: Base user model with authentication and profile data
  - **Two User Types**: 
    - `client_hunter`: Users who hire freelancers for projects (require one-time payment)
    - `freelancer`: Developers who provide services (free to join)
  - **Authentication**: Email/password with JWT tokens
  - **Profile Data**: Basic information (name, email, profile picture)
  - **Role Separation**: Clear distinction between hiring and service-providing users

#### **Extended User Profiles**
- **`Freelancer`**: Extended profile for developers with skills, rates, experience
  - Skills, technologies, hourly/daily rates
  - Portfolio links, availability status, verification
  - Rating system and review tracking
- **`ClientHunter`**: Extended profile for clients with business preferences
  - Company information, industry, project preferences
  - Budget ranges, communication preferences
  - Payment verification status

#### **Communication & Business Logic**
- **`Chat`**: Conversation management between users
- **`Message`**: Individual messages with content filtering capabilities
- **`Payment`**: PayPal integration and one-time fee tracking
- **`Notification`**: User alerts and system messages

### Automatic API Generation

- All routers in `app/routers/` are auto-included in the FastAPI app.
- OpenAPI docs are available at `/docs` (Swagger) and `/redoc`.

### Database & ORM

- **SQLAlchemy** for ORM, with async support.
- **Seed logic**: On startup, checks for existing data and seeds if needed.
- **Relationship integrity**: Proper foreign key constraints and cascading operations.

#### **Database Architecture**
```
users (base table)
├── user_type: 'client_hunter' or 'freelancer'
├── authentication data (email, password_hash)
└── basic profile (first_name, last_name, profile_picture)

client_hunters (extends users)
├── business information (company, industry, project preferences)
├── payment status (one-time fee verification)
└── communication preferences

freelancers (extends users)
├── professional skills and technologies
├── rates and availability
└── portfolio and verification status
```

### Backend Linting & Formatting

- **Ruff** for linting (`ruff .`)
- **Black** for formatting (if configured)
- **Pre-commit hooks** ensure code quality before every commit.

### Backend Environment Variables

- `.env` file in `/backend` for secrets, DB URL, etc.
- Example:
  ```
  DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/find_a_freelancer
  JWT_SECRET_KEY=your-secret
  JWT_ALGORITHM=HS256
  JWT_EXPIRATION_MINUTES=1440
  ```

---

## Frontend Overview (`/frontend`)

### React + TypeScript + Vite

- **File-based Routing**: Powered by [@tanstack/react-router](https://tanstack.com/router).
- **Redux Toolkit**: For state management and API queries.
- **Type-safe API Integration**: End-to-end types for API requests and responses.
- **Tailwind CSS**: For rapid, utility-first styling.
- **Vite**: Lightning-fast dev server and build.

#### Folder Details

- **`src/routes/`**: Route components, auto-registered.
- **`src/store/`**: Redux store, API services (RTK Query).
- **`src/assets/**`: Static assets (CSS, images).
- **`src/main.tsx`**: App entrypoint, sets up router and store.

### Routing

- File-based, zero-config routing with TanStack Router.
- Nested layouts and route-level code splitting.

### State Management

- **Redux Toolkit** for global state.
- **RTK Query** for API calls, with auto-caching and invalidation.

### API Integration & Type Safety

- **TypeScript** everywhere.
- **RTK Query** endpoints are typed.
- **Full-stack type safety**: Backend Pydantic schemas can be used to generate TypeScript types.

### Frontend Linting & Formatting

- **Biome** for linting and formatting
- **TypeScript** for type checking
- **Pre-commit hooks** for code quality

---

## Monorepo Tooling & Automation

### Pre-commit & Post-merge Hooks

- Managed by **Husky** (`.husky/` directory)
- **Pre-commit**: Runs linting and formatting on staged files.
- **Post-merge**: Can auto-install dependencies or run migrations.
- **Post-pull**: Runs linting after git pull operations.
- Hooks are cross-platform and fast.

### Type Safety Across the Stack

- **Pydantic v2** on the backend for strict validation.
- **TypeScript** on the frontend.
- **Full-stack type safety**: End-to-end types for API requests and responses.

---

## Development Workflow

1. **Write code** in `/frontend` or `/backend`.
2. **Pre-commit hooks** ensure code is linted and formatted.
3. **Push/merge**: Post-merge hooks can run install or migration scripts.
4. **API changes**: Update backend schemas, regenerate frontend types if needed.
5. **Run tests** (add your own test setup for both frontend and backend).

---

## Phase 1 Implementation Summary

### **✅ What's Been Completed**

**Phase 1: Foundation & Database** has been successfully implemented, providing a solid foundation for the Find-a-Freelancer platform.

#### **Database Schema & Models**
- **Complete ERD Design**: 7 comprehensive database models with proper relationships
- **User Management**: Base User model with Client Hunter vs Freelancer role separation
- **Profile Extensions**: Detailed profiles for both user types with business-specific fields
- **Communication System**: Chat and messaging infrastructure with content moderation
- **Business Logic**: Payment tracking, notifications, and security features

#### **Technical Implementation**
- **FastAPI Backend**: Modern async web framework with automatic API documentation
- **SQLAlchemy ORM**: Async database operations with PostgreSQL
- **Pydantic Schemas**: Comprehensive data validation and serialization
- **JWT Authentication**: Secure user sessions and role-based access control
- **Database Seeding**: Rich sample data for development and testing

#### **Development Environment**
- **Code Quality**: Husky hooks, linting (Ruff), formatting (Biome)
- **Type Safety**: Full TypeScript and Python type coverage
- **Documentation**: Auto-generated API docs, comprehensive setup guides
- **Testing**: Database models, relationships, and seeding functionality validated

### **🎯 Key Features Ready**

- **User Registration & Authentication**: Login/register for both user types
- **Freelancer Discovery**: Skills, rates, experience, availability search
- **Client Management**: Business profiles, project preferences, payment tracking
- **Communication**: Secure chat system with content filtering
- **Security**: Role-based access, content moderation, payment verification

---

## Phase 2 Implementation Summary

### **✅ What's Been Completed**

**Phase 2: Authentication & User Management** has been successfully implemented, bringing the platform to a fully functional state for user operations.

#### **Authentication System**
- **JWT-based Authentication**: Secure token-based authentication with proper expiration handling
- **User Registration**: Complete registration flow with validation and password hashing
- **User Login**: Secure login with credential validation and token generation
- **Password Security**: bcrypt hashing with configurable rounds for enhanced security
- **Token Management**: Access token generation, verification, and refresh functionality

#### **User Management APIs**
- **Profile Management**: Get and update user profile information
- **Admin Operations**: User verification, status management, and administrative controls
- **User Listing**: Paginated user lists with filtering by type, status, and verification
- **Statistics**: User analytics and platform metrics for administrators

#### **Code Quality & Organization**
- **Spotless Codebase**: Zero linting errors with comprehensive code quality standards
- **File Organization**: Properly structured directories for different purposes:
  - `app/scripts/`: CLI utilities and database management tools
  - `app/utils/`: Utility functions and helpers
  - `app/core/`: Core functionality (config, database, logging, middleware)
  - `app/models/`: Database models and schemas
  - `app/routers/`: API endpoints and route handlers
  - `app/schemas/`: Pydantic validation schemas
- **Enhanced Security**: Improved middleware for logging, security headers, and rate limiting
- **Type Safety**: Enhanced type annotations and proper error handling

#### **Technical Improvements**
- **Database Session Management**: Fixed async session handling and proper connection management
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Input Validation**: Robust validation for all user inputs and API parameters
- **Security Headers**: Implemented security middleware with proper headers
- **Rate Limiting**: Basic rate limiting to prevent abuse
- **Logging System**: Structured logging throughout the application using the logger utility

### **🎯 Key Features Ready**

- **Complete Authentication Flow**: Registration, login, profile management, and logout
- **Role-based Access Control**: Proper separation between Client Hunters and Freelancers
- **Admin Panel Ready**: User management, verification, and platform statistics
- **Security-First Design**: Protected endpoints, input validation, and security headers
- **Production-Ready Code**: Zero linting errors, proper error handling, and clean architecture

### **📁 Updated File Structure**

```
backend/app/
├── core/                   # Core functionality
│   ├── base.py            # Base models and mixins
│   ├── config.py          # Application configuration
│   ├── db.py              # Database connection and sessions
│   ├── db_init.py         # Database initialization
│   ├── jwt.py             # JWT token handling
│   ├── logger.py          # Logging configuration
│   └── middleware.py      # Custom middleware
├── scripts/               # CLI utilities and tools
│   └── manage_db.py       # Database management CLI
├── utils/                 # Utility functions
│   └── auth_utils.py      # Authentication utilities
├── models/                # Database models
├── routers/               # API route handlers
├── schemas/               # Pydantic validation schemas
├── constants/             # Static data and configurations
└── main.py               # Application entry point
```

---

## Phase 3 Implementation Summary

### **✅ What's Been Completed**

**Phase 3: Chat System & Messaging** has been successfully implemented, bringing real-time communication capabilities to the platform.

#### **WebSocket Infrastructure**
- **Real-time Connection Manager**: Handles WebSocket connections and user status tracking
- **User Online/Offline Status**: Track which users are currently active
- **Chat Room Management**: Efficient management of chat participants and message routing

#### **Chat Management System**
- **Complete Chat CRUD**: Create, read, update, archive, and delete conversations
- **Participant Management**: Handle chat participants and access control
- **Project Context**: Store project titles, descriptions, and budget information
- **Chat Statistics**: Comprehensive analytics and search capabilities

#### **Message System**
- **Full Message Operations**: Send, receive, edit, delete, and search messages
- **Content Filtering**: Automatic detection and removal of URLs and contact information
- **Message Search**: Search across all user chats with filtering options
- **Moderation Tools**: Message flagging and violation tracking

#### **Content Security & Filtering**
- **URL Detection**: Automatically identifies and removes web links
- **Contact Information Filtering**: Prevents sharing of emails, phone numbers, social media handles
- **Violation Logging**: Comprehensive logging of content violations for moderation
- **File Security**: Safe filename handling and path traversal prevention

#### **Real-time Features**
- **Live Message Delivery**: Instant message delivery via WebSockets
- **Typing Indicators**: Show when users are typing
- **Read Receipts**: Track message read status
- **Online Status Updates**: Real-time user presence information

### **🎯 Key Features Ready**

- **Real-time Chat**: WebSocket-based instant messaging between users
- **Content Moderation**: Automatic filtering of prohibited content
- **Chat Organization**: Archive, search, and manage conversations efficiently
- **Security First**: User authentication, access control, and content filtering
- **Scalable Architecture**: Efficient database queries with pagination and optimization

### **📁 New Files Created**

```
backend/app/
├── core/
│   └── websocket_manager.py    # WebSocket connection management
├── utils/
│   └── content_filter.py       # Content filtering and security
├── routers/
│   ├── chat_router.py          # Chat management endpoints
│   ├── message_router.py       # Message handling endpoints
│   └── websocket_router.py     # Real-time WebSocket endpoints
└── schemas/
    ├── chat_schema.py          # Comprehensive chat schemas
    └── message_schema.py       # Enhanced message schemas
```

### **🔌 API Endpoints Available**

**Chat Management:**
- `POST /chats/` - Create new chat
- `GET /chats/` - List user's chats with pagination
- `GET /chats/{chat_id}` - Get chat details
- `PUT /chats/{chat_id}` - Update chat information
- `POST /chats/{chat_id}/archive` - Archive chat
- `POST /chats/{chat_id}/unarchive` - Unarchive chat
- `DELETE /chats/{chat_id}` - Soft delete chat
- `GET /chats/stats/summary` - Chat statistics

**Message Management:**
- `POST /messages/` - Send new message
- `GET /messages/chat/{chat_id}` - Get chat messages with pagination
- `GET /messages/{message_id}` - Get specific message
- `PUT /messages/{message_id}` - Edit message
- `DELETE /messages/{message_id}` - Delete message
- `GET /messages/search/` - Search messages across chats
- `POST /messages/{message_id}/flag` - Flag message for moderation

**WebSocket Endpoints:**
- `WS /ws/{user_id}` - Real-time chat connection
- `GET /online-users` - List currently online users
- `GET /user-status/{user_id}` - Check specific user's online status

### **🔒 Security & Compliance**

- **Content Filtering**: Automatically removes URLs and contact information as per requirements
- **User Authentication**: JWT-based access control for all endpoints
- **Chat Access Control**: Users can only access their own conversations
- **Message Ownership**: Users can only edit/delete their own messages
- **Input Validation**: Comprehensive Pydantic schema validation
- **Rate Limiting**: Prevents abuse and ensures platform stability

### **📊 Database Integration**

- **Efficient Queries**: Optimized SQLAlchemy queries with proper indexing
- **Pagination**: Handle large result sets efficiently
- **Soft Deletes**: Preserve data while maintaining logical deletion
- **Audit Trail**: Track message editing and deletion history
- **Real-time Updates**: WebSocket integration with database operations

---

## Database Management

### Automatic Seeding

The database is automatically seeded when the FastAPI application starts up **if the database is empty** (no users exist). This happens in the application lifespan manager.

### Manual Database Management

Use the database management utility for manual operations:

```bash
cd backend

# Create tables only
python3 app/scripts/manage_db.py create-tables

# Seed database (only if empty)
python3 app/scripts/manage_db.py seed

# Complete fresh setup (recommended for first time)
python3 app/scripts/manage_db.py setup-fresh

# Force reseed (clears all data first) ⚠️ DESTRUCTIVE
python3 app/scripts/manage_db.py force-reseed

# Reset database (drop and recreate tables) ⚠️ DESTRUCTIVE
python3 app/scripts/manage_db.py reset
```

### Sample Data

The database is automatically seeded with comprehensive sample data including:

#### **User Base (6 Total Users)**
- **3 Client Hunters**: Users who hire freelancers for projects
- **3 Freelancers**: Developers available for hire with various skills

#### **Extended Profiles**
- **3 Freelancer Profiles**: Different skill sets, rates ($70-85/hour), experience levels
- **3 Client Hunter Profiles**: Various business types (Agency, Startup) with payment status

#### **Communication & Business Data**
- **3 Active Chats**: Real project conversations (E-commerce, DevOps, Mobile App)
- **6 Sample Messages**: Natural conversation flow between clients and freelancers
- **3 Payment Records**: Completed payments and one pending payment
- **5 Notifications**: Chat messages, payment confirmations, system alerts

### Sample Freelancer Profiles

1. **Sarah Johnson** - Senior Full-Stack Developer
   - Rate: $85/hour, $600/day
   - Skills: React, Node.js, Python, FastAPI, PostgreSQL
   - Experience: 7 years, Rating: 4.8/5 (23 reviews)

2. **Alex Rodriguez** - Full-Stack Engineer & DevOps Specialist
   - Rate: $75/hour, $550/day
   - Skills: Python, Django, React, Docker, Kubernetes, AWS
   - Experience: 5 years, Rating: 4.9/5 (31 reviews)

3. **Emma Williams** - Mobile App Developer
   - Rate: $70/hour, $500/day
   - Skills: React Native, Flutter, Firebase, Mobile UI/UX
   - Experience: 4 years, Rating: 4.7/5 (18 reviews)

### Sample Project Conversations

1. **E-commerce Platform Development**
   - Client: John Anderson (TechVenture Solutions)
   - Freelancer: Sarah Johnson
   - Budget: $15,000 - $20,000
   - Tech: React, Python/FastAPI, PostgreSQL, Stripe

2. **DevOps Infrastructure Setup**
   - Client: David Thompson (Digital Marketing Pro)
   - Freelancer: Alex Rodriguez
   - Budget: $8,000 - $12,000
   - Tech: AWS, Docker, CI/CD, monitoring

3. **FinTech Mobile App MVP**
   - Client: Mike Chen (InnovateLab Startup)
   - Freelancer: Emma Williams
   - Budget: $12,000 - $18,000
   - Tech: React Native, secure auth, data visualization

---

## Development Commands

### Linting & Formatting
```bash
# Lint all code
pnpm run lint:all

# Lint specific parts
pnpm run lint:frontend
pnpm run lint:backend

# Format all code
pnpm run format:all

# Format specific parts
pnpm run format:frontend
pnpm run format:backend
```

### Development Servers
```bash
# Start backend server
pnpm run dev:backend

# Start frontend server
pnpm run dev:frontend
```

### Installation
```bash
# Install all dependencies
pnpm run install:all
```

---

## Special Features

- **Monorepo**: One repo, one install, one workflow for frontend and backend.
- **Automatic API docs**: FastAPI auto-generates OpenAPI docs.
- **Database Seeding**: Rich sample data for development and testing.
- **Full-stack type safety**: Reduce runtime bugs with strict types everywhere.
- **Modern tooling**: Vite, TanStack Router, RTK Query, Tailwind, FastAPI, SQLAlchemy, asyncpg.
- **Pre-configured linting/formatting**: Consistent codebase, enforced by hooks.
- **Easy environment management**: `.env` files for both frontend and backend.
- **CORS enabled**: Out-of-the-box support for frontend-backend communication.
- **Hot reload**: Both frontend and backend support instant reload on code changes.
- **Extensible**: Add more routers, models, or frontend routes as your app grows.

---

## FAQ

**Q: Can I use a different database?**  
A: Yes! Just update your `DATABASE_URL` and install the appropriate async driver.

**Q: How do I add a new API route?**  
A: Add a new file in `backend/app/routers/`, define your endpoints, and it will be auto-included.

**Q: How do I generate TypeScript types from my backend?**  
A: Use [openapi-typescript](https://github.com/drwpow/openapi-typescript) with your FastAPI OpenAPI schema.

**Q: How do I run tests?**  
A: Add your preferred test runner (e.g., pytest for backend, vitest/jest for frontend).

**Q: How do I reset the database?**  
A: Use `python3 app/core/manage_db.py reset` (⚠️ destructive operation).

**Q: How do I seed the database manually?**  
A: Use `python3 app/core/manage_db.py seed` or `python3 app/core/manage_db.py setup-fresh`.

---

## Contributing

1. Fork the repo and create your branch.
2. Make your changes with clear, descriptive commits.
3. Ensure all linting and formatting checks pass.
4. Submit a pull request!

---

**Happy coding! 🚀**