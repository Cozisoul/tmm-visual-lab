# TMM-OS / VISUAL-LAB: A Creative Coding Workbench

This project is a browser-based creative coding environment built with p5.js. It provides a suite of generative art and design tools, allowing users to create complex visuals, manipulate media, and explore algorithmic art concepts in a unified interface.

## Features

- **Multi-Tool System:** A library of diverse creative tools, from grid generators to particle engines and 3D renderers.
- **Interactive Canvas:** A central artboard where all creations are rendered.
- **Media Bus:** Upload images and videos to be used as input for supported tools (e.g., `PixelSorter`, `UniversalRasterizer`).
- **Global Effects:** Apply a "Game of Life" cellular automata simulation over any tool's output, with the ability to link simulation metrics to tool controls.
- **Rich Export Options:** Save your artwork as a PNG (with optional transparent background), SVG, or animated WebM video.

## How to Run

Because this project uses features (like video exporting) that are restricted by browser security when running from a local `file://` path, you need to run it from a local web server.

### Quick Start
1. **Test the setup first**: Open `test.html` in your browser to verify all dependencies are working
2. **Start the server**: Run one of the methods below
3. **Open the app**: Navigate to `http://localhost:8000` in your browser

### Using Python (Recommended)
1. Open a terminal or command prompt in the project's root directory.
2. Run the following command:
   ```bash
   python -m http.server 8000
   ```
3. Open your web browser and navigate to `http://localhost:8000`.

### Using Node.js (if you have it installed)
1. Install a simple HTTP server: `npm install -g http-server`
2. Run: `http-server -p 8000`
3. Open your web browser and navigate to `http://localhost:8000`.

### Using VS Code Live Server
1. Install the Live Server extension in Visual Studio Code.
2. Open the project folder in VS Code.
3. Right-click on `index.html` in the file explorer and select "Open with Live Server".

### Troubleshooting
- If you see errors, check the browser console (F12) for details
- Make sure you're accessing the app via `http://localhost:8000`, not `file://`
- Some features require HTTPS in production environments

## Project Structure

- `index.html`: The main HTML file that defines the structure of the three-column layout.
- `style.css`: Contains all the styling for the user interface.
- `sketch.js`: The core p5.js script. It manages the main draw loop, the artboard, global effects, and tool loading.
- `script.js`: Handles all UI interactions, such as button clicks and slider inputs, and binds them to the active tool's properties.
- `tools/`: A directory containing the individual JavaScript class files for each creative tool.