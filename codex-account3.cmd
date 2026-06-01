@echo off
setlocal

echo ============================================
echo   Codex CLI - Freemodel Account 3
echo   Provider: freemodel  Model: gpt-5.5
echo ============================================
echo.

:: --- Save official ChatGPT auth ---
copy /Y "C:\Users\AI INNOVATIONS\.codex\auth.json" "C:\Users\AI INNOVATIONS\.codex\auth-chatgpt.json" >nul

:: --- Switch to freemodel account 3 auth ---
copy /Y "C:\Users\AI INNOVATIONS\.codex\auth-freemodel-account3.json" "C:\Users\AI INNOVATIONS\.codex\auth.json" >nul

:: --- Switch config to freemodel provider ---
copy /Y "C:\Users\AI INNOVATIONS\.codex\config-freemodel.toml" "C:\Users\AI INNOVATIONS\.codex\config.toml" >nul
echo [*] Switched to freemodel provider + Account 3

:: --- No proxy needed ---
set HTTPS_PROXY=
set HTTP_PROXY=

:: --- Navigate to project ---
cd /d "C:\Users\AI INNOVATIONS\Desktop\VedicAstra\frontend\astra_navi"
echo [*] Working directory: %cd%

:: --- Launch Codex CLI ---
echo [*] Launching Codex CLI...
echo.
codex

:: --- Restore Official OpenAI auth + config ---
copy /Y "C:\Users\AI INNOVATIONS\.codex\auth-chatgpt.json" "C:\Users\AI INNOVATIONS\.codex\auth.json" >nul
copy /Y "C:\Users\AI INNOVATIONS\.codex\config-openai.toml" "C:\Users\AI INNOVATIONS\.codex\config.toml" >nul

echo.
echo [*] Restored Official OpenAI auth + config.
echo [*] Codex session ended.
pause
endlocal
