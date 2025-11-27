#!/bin/bash
# Digital FlipBoard - Local Development Setup

echo "🚀 Digital FlipBoard - Development Setup"
echo "=========================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "  Node version: $(node -v)"
echo ""

# Check npm
echo "✓ Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "  npm version: $(npm -v)"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✓ Frontend dependencies installed"
echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    cd ..
    exit 1
fi
cd ..
echo "✓ Server dependencies installed"
echo ""

# Check Redis
echo "🔍 Checking Redis..."
if command -v redis-cli &> /dev/null; then
    echo "  ✓ Redis CLI found"
    if redis-cli ping &> /dev/null; then
        echo "  ✓ Redis is running"
    else
        echo "  ⚠️  Redis is not running - start with: redis-server"
    fi
else
    echo "  ⚠️  Redis not found locally"
    echo ""
    echo "  Options to install Redis:"
    echo "  1. macOS (Homebrew):      brew install redis"
    echo "  2. Linux (Ubuntu):        sudo apt-get install redis-server"
    echo "  3. Windows (WSL2):        wsl sudo apt-get install redis-server"
    echo "  4. Docker:                docker run -d -p 6379:6379 redis:7-alpine"
    echo ""
    echo "  After installing, start Redis with:"
    echo "  - Locally:  redis-server"
    echo "  - Docker:   docker run -d -p 6379:6379 redis:7-alpine"
    echo ""
fi
echo ""

# Check .env file
echo "⚙️  Checking environment configuration..."
if [ -f .env ]; then
    echo "  ✓ .env file found"
else
    echo "  ⚠️  .env file not found"
    echo "    Copy from .env.example and update with your values:"
    echo "    cp .env.example .env"
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Make sure Redis is running:"
echo "   redis-server"
echo ""
echo "2. Start the development server (in another terminal):"
echo "   npm run server:dev"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   npm run dev"
echo ""
echo "4. Open browser and test:"
echo "   - Frontend: http://localhost:5173"
echo "   - Server health: http://localhost:3001/health/ready"
echo ""
