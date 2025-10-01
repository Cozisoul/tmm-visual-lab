@echo off
echo Starting TMM Visual Lab...
echo.
echo Opening test page in browser...
start test.html
echo.
echo Starting Python HTTP server on port 8000...
echo Open http://localhost:8000 in your browser to access the main application
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
