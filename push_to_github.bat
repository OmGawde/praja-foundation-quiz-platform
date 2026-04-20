@echo off
echo Running GitHub setup...

git add .
git commit -m "Initial commit: PRAJA FOUNDATION QUIZ PLATFORM"
git branch -M main

echo.
echo Now creating repository on Github...
gh repo create praja-foundation-quiz-platform --public --source=. --remote=origin --push

echo.
echo Finished!
pause
