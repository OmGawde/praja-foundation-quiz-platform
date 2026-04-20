@echo off
echo ============================================
echo   PRAJA QUIZ PLATFORM - Setup Script
echo ============================================
echo.

echo [1/2] Installing Server Dependencies...
echo ----------------------------------------
cd /d "C:\Users\9c23o\NEW SSIP\praja-quiz-platform\server"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Server npm install failed!
    pause
    exit /b 1
)
echo Server dependencies installed successfully!
echo.

echo [2/2] Installing Client Dependencies...
echo ----------------------------------------
cd /d "C:\Users\9c23o\NEW SSIP\praja-quiz-platform\client"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Client npm install failed!
    pause
    exit /b 1
)
echo Client dependencies installed successfully!
echo.

echo ============================================
echo   ALL DEPENDENCIES INSTALLED SUCCESSFULLY!
echo ============================================
echo.
echo Next steps:
echo   1. Make sure MongoDB is running on port 27017
echo   2. Open Terminal 1: cd server ^& npm run dev
echo   3. Open Terminal 2: cd client ^& npm run dev
echo   4. Open http://localhost:5173
echo.
pause
