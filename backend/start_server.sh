#!/bin/bash

# Find-a-Freelancer Backend Server Startup Script

echo "🚀 Starting Find-a-Freelancer Backend Server..."

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: backend directory with app/main.py"
    exit 1
fi

# Check if virtual environment exists in parent directory
if [ ! -f "../.venv/bin/activate" ]; then
    echo "❌ Error: Virtual environment not found in parent directory"
    echo "   Expected: ../.venv/bin/activate"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source ../.venv/bin/activate

# Check if required packages are installed
echo "🔍 Checking dependencies..."
python3 -c "import fastapi, uvicorn, sqlalchemy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: Required packages not installed"
    echo "   Please run: pip install -r requirements.txt"
    exit 1
fi

# Start the server
echo "🌐 Starting FastAPI server..."
echo "   Server will be available at: http://localhost:8000"
echo "   API docs will be available at: http://localhost:8000/docs"
echo "   Press Ctrl+C to stop the server"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
