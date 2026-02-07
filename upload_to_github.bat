@echo off
echo ===================================================
echo   Student Registration Website - GitHub Uploader
echo ===================================================
echo.

:: 1. Initialize Git
echo 1. Initializing Git...
git init
echo.

:: 2. Add files
echo 2. Adding files...
git add .
echo.

:: 3. Commit
echo 3. Committing changes...
set /p commitMsg="Enter commit message (e.g. 'Updated website'): "
git commit -m "%commitMsg%"
echo.

:: 4. Add Remote (Only needs to be done once)
echo.
echo Have you already connected to GitHub? (Type Y or N)
set /p connected="Answer: "

if /I "%connected%"=="N" (
    echo.
    echo Please paste your GitHub Repository URL below:
    echo (Example: https://github.com/USERNAME/REPO-NAME.git)
    set /p repoUrl="Repository URL: "
    git remote add origin %repoUrl%
    git branch -M main
)

:: 5. Push
echo.
echo 5. Uploading to GitHub...
git push -u origin main

echo.
echo ===================================================
echo   Done! Your code is now on GitHub.
echo ===================================================
pause
