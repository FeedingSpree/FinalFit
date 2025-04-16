const { spawn } = require('child_process');
const path = require('path');

function startPythonServer() {
    console.log('Starting Python backend server...');
    
    // Get the absolute paths
    const pythonPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
    const modelDir = path.join(__dirname, 'src', 'model');
    
    // Log the paths for debugging
    console.log('Python Path:', pythonPath);
    console.log('Model Directory:', modelDir);

    const pythonProcess = spawn(pythonPath, [
        '-m', 'uvicorn',
        'model:app',
        '--reload',
        '--port', '5000',
        '--host', 'localhost'
    ], {
        cwd: modelDir,
        shell: true,
        stdio: 'pipe'
    });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Server: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Server Error: ${data}`);
    });

    pythonProcess.on('error', (error) => {
        console.error('Failed to start Python server:', error);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python server exited with code ${code}`);
    });

    // Ensure the process is killed on exit
    process.on('SIGINT', () => {
        pythonProcess.kill();
        process.exit();
    });

    return pythonProcess;
}

// Start the Python server and store the reference
const pythonServer = startPythonServer();

// Export the server reference if needed
module.exports = pythonServer;