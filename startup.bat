@echo off
echo Starting Python backend server...
cd src\model
call .venv\Scripts\activate.bat
python -m uvicorn model:app --reload --port 5000
