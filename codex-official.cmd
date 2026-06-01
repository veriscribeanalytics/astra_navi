@echo off
setlocal

:: --- Official OpenAI Account ---
set HTTPS_PROXY=
set HTTP_PROXY=
set OPENAI_API_KEY=

echo ============================================
echo   Codex CLI - Official OpenAI Account
echo   Provider: openai  Model: gpt-5.5
echo ============================================
echo.

:: --- Navigate to project ---
cd /d "C:\Users\AI INNOVATIONS\Desktop\VedicAstra\frontend\astra_navi"

:: --- Restore official config ---
copy /Y "C:\Users\AI INNOVATIONS\.codex\config-openai.toml" "C:\Users\AI INNOVATIONS\.codex\config.toml" >nul 2>nul

:: --- Check login status ---
echo [*] Checking login status...
codex login status 2>&1 | findstr /C:"ChatGPT" >nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] You are NOT logged in with ChatGPT OAuth.
    echo [!] A browser will open for login...
    echo.
    codex login
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] codex login failed! Try: codex login
        pause
        exit /b 1
    )
)

echo [*] Working directory: %cd%
echo [*] Launching Codex CLI...
echo.
codex

echo.
echo [*] Codex session ended.
pause
endlocal
