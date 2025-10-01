#!/bin/bash
echo "Starting TMM Visual Lab..."
echo ""
echo "Opening test page in browser..."
if command -v xdg-open > /dev/null; then
    xdg-open test.html
elif command -v open > /dev/null; then
    open test.html
else
    echo "Please open test.html in your browser manually"
fi
echo ""
echo "Starting Python HTTP server on port 8000..."
echo "Open http://localhost:8000 in your browser to access the main application"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
python3 -m http.server 8000
