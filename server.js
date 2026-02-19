const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const apiRoutes = require("./routes/api");
const sequelize = require("./config/database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
// API Routes
app.use("/api/v1", apiRoutes);

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Serve static files from React build
app.use(express.static(path.join(__dirname, "client", "dist")));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        backend: "node",
        database: "connected",
        version: "1.0.0"
    });
});

// All other routes serve the React app
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// Initialize database and start server
const startServer = async () => {
    console.log('--- Server Restart Triggered ---');
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Initialize models and associations
        const { User } = require('./models/index'); // This loads all models and sets up associations


        // ...

        // Sync database models
        console.log('🔄 Syncing database models...');
        await sequelize.sync({ alter: false }); // alter:true causes ER_TOO_MANY_KEYS over time
        console.log('✅ Database models synced.');

        // Seed Admin User
        try {
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
        } catch (seedError) {
            console.error('⚠️ Failed to seed admin user:', seedError);
        }

        // Create HTTP server and initialize Socket.IO
        const http = require('http');
        const server = http.createServer(app);
        const { Server } = require("socket.io");
        const io = new Server(server, {
            cors: {
                origin: "*", // allow all or specify client URL
                methods: ["GET", "POST"]
            }
        });

        // Initialize socket logic
        require('./sockets/chat')(io);

        // Make io accessible to our router
        app.set('io', io);

        // Start server
        server.listen(PORT, () => {
            console.log(`\n╔════════════════════════════════════════════════════════╗`);
            console.log(`║     ERP FULLSTACK APPLICATION - RUNNING               ║`);
            console.log(`╚════════════════════════════════════════════════════════╝`);
            console.log(`\n🚀 Server: http://localhost:${PORT}`);
            console.log(`📊 Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
            console.log(`🔌 API: http://localhost:${PORT}/api/v1`);
            console.log(`📚 Docs: http://localhost:${PORT}/api-docs`);
            console.log(`\n💡 Press Ctrl+C to stop\n`);
        });
    } catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};

startServer();
