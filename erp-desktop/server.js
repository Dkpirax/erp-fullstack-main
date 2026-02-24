const express = require("express");
const path = require("path");
const cors = require("cors");
const sequelize = require("./config/database");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build (assuming it will be copied to dist-frontend)
app.use(express.static(path.join(__dirname, "dist-frontend")));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        backend: "node-desktop",
        database: "sqlite-connected",
        version: "1.0.0"
    });
});

// We will inject the API routes when the server is started from main.js
// so that we can pass the initialized io instance if needed.

// Initialize database models and sync
const initDB = async () => {
    try {
        await sequelize.authenticate();
        // Here we require the models. We will point to the copied models folder.
        const { User } = require('./models/index');

        console.log('🔄 Syncing SQLite database models...');
        await sequelize.sync({ alter: true });
        console.log('✅ SQLite database models synced.');

        // Seed Admin User
        const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
        if (!adminExists) {
            console.log('🔄 Creating default admin user...');
            const hashedPassword = await User.hashPassword('admin');
            await User.create({
                username: 'admin',
                email: 'admin@example.com',
                hashed_password: hashedPassword,
                full_name: 'System Administrator',
                is_active: true,
                is_superuser: true,
                role: 'admin',
                branch_id: null
            });
            console.log('✅ Admin user created: admin / admin');
        }
    } catch (error) {
        console.error("❌ Failed to initialize database:", error);
    }
}

// Function to start the server, called from electron main.js
const startExpressServer = async () => {
    await initDB();

    // Require API Routes locally
    const apiRoutes = require('./routes/api');
    app.use("/api/v1", apiRoutes);

    // All other routes serve the React app
    app.use((req, res, next) => {
        res.sendFile(path.join(__dirname, "dist-frontend", "index.html"));
    });

    const http = require('http');
    const server = http.createServer(app);
    const { Server } = require("socket.io");
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Initialize socket logic
    require('../sockets/chat')(io);
    app.set('io', io);

    return new Promise((resolve) => {
        // Listen on port 0 to get a random free port from the OS
        server.listen(0, () => {
            const address = server.address();
            console.log(`\n🚀 Desktop Local Server running on http://localhost:${address.port}`);
            resolve({ server, port: address.port });
        });
    });
};

module.exports = { startExpressServer, app };
