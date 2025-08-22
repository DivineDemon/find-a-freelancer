# Development Setup Guide

## Prerequisites

- **Node.js 18+** and **pnpm** (or npm/yarn)
- **Python 3.12+**
- **PostgreSQL** database
- **Git** with Husky hooks

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
pnpm run install:all

# Or install separately:
pnpm install                    # Root dependencies
cd frontend && pnpm install    # Frontend dependencies
cd ../backend && python3 -m pip install -r requirements.txt  # Backend dependencies
```

### 2. Environment Setup

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
VITE_BASE_API_URL=http://localhost:8000
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
pnpm run dev:backend
# or: cd backend && uvicorn app.main:app --reload

# Terminal 2 - Frontend
pnpm run dev:frontend
# or: cd frontend && pnpm run dev
```

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

## Git Hooks (Husky)

The project uses Husky for pre-commit and post-merge hooks:

- **pre-commit**: Runs linting on both frontend and backend
- **post-merge**: Runs linting and starts backend server
- **post-pull**: Runs linting after git pull

### Manual Hook Testing
```bash
# Test pre-commit hook
npx husky run .husky/pre-commit

# Test post-merge hook
npx husky run .husky/post-merge

# Test post-pull hook
npx husky run .husky/post-pull
```

## Code Quality Tools

### Backend (Python)
- **Ruff**: Linting and formatting
- **Pytest**: Testing framework
- **Black**: Code formatting (via Ruff)

### Frontend (TypeScript/React)
- **Biome**: Linting and formatting
- **TypeScript**: Type checking
- **ESLint**: Additional linting rules

## Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE find_a_freelancer;
```

2. Update `.env` file with database connection string
3. Run database migrations (when implemented)

## Testing

### Backend Tests
```bash
cd backend
python3 -m pytest
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

## Troubleshooting

### Common Issues

1. **Husky hooks not working**
   ```bash
   npx husky install
   ```

2. **Python dependencies not found**
   ```bash
   cd backend
   python3 -m pip install -r requirements.txt
   ```

3. **Frontend dependencies missing**
   ```bash
   cd frontend
   pnpm install
   ```

4. **Database connection issues**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists

### Reset Development Environment
```bash
# Clean install
rm -rf node_modules frontend/node_modules
pnpm run install:all
```

## Project Structure

```
find-a-freelancer/
├── .husky/                 # Git hooks
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── core/          # Configuration, database
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API endpoints
│   │   └── schemas/       # Pydantic schemas
│   ├── requirements.txt    # Python dependencies
│   └── ruff.toml         # Ruff configuration
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── routes/        # Application routes
│   │   └── store/         # Redux store
│   ├── package.json       # Node dependencies
│   └── biome.json         # Biome configuration
└── package.json            # Root scripts
```

## Contributing

1. Ensure all hooks pass before committing
2. Follow the established code style
3. Run tests before submitting PRs
4. Update documentation as needed
