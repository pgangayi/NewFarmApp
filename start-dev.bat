@echo off
echo ========================================
echo FARMERS BOOT - DEVELOPMENT SERVER START
echo ========================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found. Copying from .env.example...
    copy ".env.example" ".env"
    echo Please edit .env file with your actual values before continuing.
    pause
    exit /b 1
)

echo [1/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

echo [2/4] Environment check...
for /f "tokens=2 delims==" %%a in ('findstr "JWT_SECRET" .env') do set JWT_SECRET=%%a
for /f "tokens=2 delims==" %%a in ('findstr "API_URL" .env') do set API_URL=%%a

if "%JWT_SECRET%"=="" (
    echo ERROR: JWT_SECRET not set in .env file
    pause
    exit /b 1
)

echo [3/4] Starting development servers...
echo Starting Cloudflare Functions server on port 8787...
start cmd /k "cd backend && npx wrangler dev --local --port 8787"

echo Waiting 3 seconds for functions server to start...
timeout /t 3 /nobreak >nul

echo Starting frontend development server on port 5173...
start cmd /k "cd frontend && npm run dev"

echo [4/4] Servers started successfully!
echo.
echo Frontend: http://localhost:5173
echo API: http://localhost:8787
echo.
echo Press any key to exit this script (servers will continue running)...
pause >nul