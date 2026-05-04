@echo off
echo.
echo ============================================
echo   TOS Trading Journal - Dashboard Server
echo ============================================
echo.
echo Installing Flask if needed...
pip install flask --quiet

echo.
echo Starting server...
echo Open your browser to: http://localhost:5000
echo.
python server.py
pause
