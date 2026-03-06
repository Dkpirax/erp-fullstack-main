# ERP Fullstack Application

A complete ERP system combining React frontend and Node.js backend into a single deployable application.

## 🎯 Overview

This is a **unified fullstack application** that combines:
- **Frontend**: React + TypeScript + Bootstrap
- **Backend**: Node.js + Express + Sequelize
- **Database**: MySQL
- **Deployment**: Apache + Node.js or Standalone Node.js

## ✨ Features

- ✅ Single application (frontend + backend combined)
- ✅ Production-ready build
- ✅ Apache deployment support
- ✅ JWT authentication
- ✅ MySQL database integration
- ✅ WooCommerce integration
- ✅ Social Media integration
- ✅ User management
- ✅ Complete API

## 📦 Project Structure

```
erp-fullstack/
├── client/                 # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── dist/              # Production build
├── config/                # Backend configuration
├── models/                # Database models
├── middleware/            # Express middleware
├── routes/                # API routes
├── scripts/               # Utility scripts
├── server.js              # Main server
├── package.json           # Dependencies
├── .env                   # Configuration
├── apache.conf            # Apache config
├── setup.bat              # Setup script
├── copy_files.bat         # File copy script
└── DEPLOYMENT.md          # Deployment guide
```

## 🚀 Quick Start

### Step 1: Copy Files

```bash
cd erp-fullstack
copy_files.bat
```

This copies all files from `erp-frontend` and `erp-backend-node`.

### Step 2: Complete Setup

```bash
setup.bat
```

This will:
1. Install backend dependencies
2. Install frontend dependencies
3. Build frontend for production
4. Create admin user

### Step 3: Start Application

```bash
npm start
```

Access at: **http://localhost:3000**

## 🔐 Login Credentials

- **Email**: admin@example.com
- **Password**: admin

⚠️ **Change the password after first login!**

## 🌐 Deployment

### Option 1: Standalone Node.js (Easiest)

```bash
npm start
```

For production with PM2:
```bash
npm install -g pm2
pm2 start server.js --name erp-app
pm2 save
pm2 startup
```

### Option 2: Apache + Node.js

1. **Configure Apache** (see `apache.conf`)
2. **Start Node.js**: `npm start`
3. **Access via Apache**: http://erp.local

See `DEPLOYMENT.md` for detailed instructions.

## 📊 Database

Uses MySQL database `erp_db`.

**Configuration** (`.env`):
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=SysAdmin@123
DB_NAME=erp_db
```

**Create admin user**:
```bash
npm run create-admin
```

## 🛠️ Development

### Run in Development Mode

```bash
npm run dev
```

This runs:
- Backend on port 3000 (with nodemon)
- Frontend on port 5173 (with Vite dev server)

### Build Frontend

```bash
cd client
npm run build
```

### API Endpoints

Base URL: `http://localhost:3000/api/v1`

**Authentication:**
- `POST /login/access-token` - Login
- `GET /users/me` - Get current user

**Users:**
- `GET /users` - List users (admin)
- `POST /users` - Create user (admin)

**WooCommerce:**
- `GET /woocommerce/products`
- `GET /woocommerce/orders`
- `GET /woocommerce/reports/totals`

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development mode |
| `npm run build` | Build frontend |
| `npm run create-admin` | Create admin user |
| `npm run install-all` | Install all dependencies |

## 🔧 Configuration

### Environment Variables

Edit `.env`:

```env
PORT=3000                    # Server port
DB_HOST=127.0.0.1           # Database host
DB_USER=root                # Database user
DB_PASSWORD=SysAdmin@123    # Database password
DB_NAME=erp_db              # Database name
JWT_SECRET=supersecretkey   # Change in production!
NODE_ENV=production         # Environment
```

### Frontend Configuration

The frontend automatically uses relative URLs (`/api/v1`) which works when served from the same origin.

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Error

1. Check MySQL is running
2. Verify credentials in `.env`
3. Ensure database exists: `CREATE DATABASE erp_db;`

### Frontend Shows Blank Page

1. Build frontend: `cd client && npm run build`
2. Check `client/dist` folder exists
3. Restart server: `npm start`

### Apache Proxy Not Working

1. Enable proxy modules in Apache
2. Check Node.js is running
3. Verify virtual host configuration

## 📚 Documentation

- **DEPLOYMENT.md** - Complete deployment guide
- **apache.conf** - Apache configuration examples
- **client/README.md** - Frontend documentation

## 🔒 Security

**Production Checklist:**

- [ ] Change `JWT_SECRET`
- [ ] Update database password
- [ ] Change admin password
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall
- [ ] Set up backups
- [ ] Enable log rotation

## 🎯 Features Implemented

### Authentication
- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ User management
- ✅ Role-based access control

### Frontend
- ✅ React + TypeScript
- ✅ Bootstrap UI
- ✅ Responsive design
- ✅ WooCommerce pages
- ✅ Social Media pages
- ✅ Dashboard

### Backend
- ✅ Express.js API
- ✅ Sequelize ORM
- ✅ MySQL database
- ✅ RESTful endpoints
- ✅ Error handling
- ✅ CORS configuration

## 📈 Performance

- **Frontend**: Optimized production build with Vite
- **Backend**: Express.js with connection pooling
- **Database**: MySQL with proper indexing
- **Caching**: Can add Redis for session management

## 🤝 Support

For issues or questions:
1. Check `DEPLOYMENT.md`
2. Review logs: `pm2 logs erp-app`
3. Check Apache logs
4. Verify database connection

## 📄 License

Same as the main ERP project.

---

## 🎉 You're Ready!

Your fullstack ERP application is ready to deploy!

**Quick commands:**
```bash
copy_files.bat    # Copy files from separate projects
setup.bat         # Complete setup
npm start         # Start application
```

Access at: **http://localhost:3000**

🚀 **Happy deploying!**
