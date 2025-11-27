@echo off
REM Digital FlipBoard - Local Development Setup for Windows

echo.
echo 🚀 Digital FlipBoard - Development Setup
echo ==========================================
echo.

REM Check Node.js
echo ✓ Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo   Node version: %NODE_VERSION%
echo.

REM Check npm
echo ✓ Checking npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo   npm version: %NPM_VERSION%
echo.

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Server dependencies installed
echo.

REM Check Redis
echo 🔍 Checking Redis...
where redis-cli >nul 2>nul
if %errorlevel% equ 0 (
    echo   ✓ Redis CLI found
    redis-cli ping >nul 2>nul
    if %errorlevel% equ 0 (
        echo   ✓ Redis is running
    ) else (
        echo   ⚠️  Redis is not running
    )
) else (
    echo   ⚠️  Redis not found locally
    echo.
    echo   Options to install Redis on Windows:
    echo   1. Windows Subsystem for Linux (WSL2):
    echo      wsl --install
    echo      wsl sudo apt-get install redis-server
    echo.
    echo   2. Docker Desktop (Recommended):
    echo      docker run -d -p 6379:6379 --name flipboard-redis redis:7-alpine
    echo.
    echo   3. Memurai (Windows native):
    echo      https://github.com/microsoftarchive/memurai-docker
    echo.
)
echo.

REM Check .env file
echo ⚙️  Checking environment configuration...
if exist .env (
    echo   ✓ .env file found
) else (
    echo   ⚠️  .env file not found
    echo     Create from .env.example:
    echo     copy .env.example .env
)
echo.

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo.
echo 1. Make sure Redis is running:
echo    - Option A: redis-server (if installed locally)
echo    - Option B: docker run -d -p 6379:6379 redis:7-alpine
echo.
echo 2. Start the development server (in a new terminal):
echo    npm run server:dev
echo.
echo 3. Start the frontend (in another terminal):
echo    npm run dev
echo.
echo 4. Test in browser:
echo    - Frontend: http://localhost:5173
echo    - Server health: http://localhost:3001/health/ready
echo.

pause
