# ERP Fullstack - Deployment Guide

## 📦 Project Structure

```
erp-fullstack/
├── client/                 # React frontend (copied from erp-frontend)
│   ├── src/
│   ├── public/
│   ├── dist/              # Built static files (after npm run build)
│   └── package.json
├── config/                # Backend configuration
│   └── database.js
├── models/                # Database models
│   └── User.js
├── middleware/            # Express middleware
│   └── auth.js
├── routes/                # API routes
│   └── api.js
├── scripts/               # Utility scripts
│   └── create_admin.js
├── server.js              # Main server (serves API + static files)
├── package.json           # Backend dependencies
├── .env                   # Environment configuration
├── apache.conf            # Apache configuration
└── setup.bat              # Complete setup script
```

## 🚀 Quick Start

### 1. Complete Setup (One Command)

```bash
cd erp-fullstack
setup.bat
```

This will:
- Install all dependencies (backend + frontend)
- Build the frontend for production
- Create admin user
- Show deployment options

### 2. Start the Application

```bash
npm start
```

Access at: **http://localhost:3000**

## 🌐 Deployment Options

### Option 1: Standalone Node.js (Recommended)

**Advantages:**
- Simple deployment
- Single process
- Easy to manage
- Works on any OS

**Steps:**

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api/v1

4. **For production, use PM2:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name erp-app
   pm2 save
   pm2 startup
   ```

### Option 2: Apache + Node.js

**Advantages:**
- Apache handles static files
- Better for high traffic
- Can use Apache features (SSL, caching, etc.)

**Requirements:**
- Apache with mod_proxy enabled
- Node.js running in background

**Steps:**

#### Windows (XAMPP)

1. **Enable Apache modules** in `httpd.conf`:
   ```apache
   LoadModule proxy_module modules/mod_proxy.so
   LoadModule proxy_http_module modules/mod_proxy_http.so
   LoadModule rewrite_module modules/mod_rewrite.so
   ```

2. **Add virtual host** to `httpd-vhosts.conf`:
   ```apache
   <VirtualHost *:80>
       ServerName erp.local
       
       ProxyPreserveHost On
       ProxyPass / http://localhost:3000/
       ProxyPassReverse / http://localhost:3000/
       
       ErrorLog "logs/erp-error.log"
       CustomLog "logs/erp-access.log" combined
   </VirtualHost>
   ```

3. **Update hosts file** (`C:\Windows\System32\drivers\etc\hosts`):
   ```
   127.0.0.1 erp.local
   ```

4. **Start Node.js backend:**
   ```bash
   npm start
   ```

5. **Restart Apache** and access: http://erp.local

#### Linux

1. **Enable Apache modules:**
   ```bash
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo a2enmod rewrite
   ```

2. **Create virtual host** (`/etc/apache2/sites-available/erp.conf`):
   ```apache
   <VirtualHost *:80>
       ServerName erp.local
       
       ProxyPreserveHost On
       ProxyPass / http://localhost:3000/
       ProxyPassReverse / http://localhost:3000/
       
       ErrorLog ${APACHE_LOG_DIR}/erp-error.log
       CustomLog ${APACHE_LOG_DIR}/erp-access.log combined
   </VirtualHost>
   ```

3. **Enable site:**
   ```bash
   sudo a2ensite erp.conf
   sudo systemctl restart apache2
   ```

4. **Start Node.js with PM2:**
   ```bash
   pm2 start server.js --name erp-app
   pm2 startup
   pm2 save
   ```

### Option 3: Apache Serving Static Files Only

**Advantages:**
- Apache serves static files (faster)
- Node.js only handles API

**Configuration:**

```apache
<VirtualHost *:80>
    ServerName erp.local
    DocumentRoot "D:/Projects/ERP GIT/erp-fullstack/client/dist"
    
    # Proxy API requests to Node.js
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    
    # Serve static files
    <Directory "D:/Projects/ERP GIT/erp-fullstack/client/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # React Router support
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## 🔧 Configuration

### Environment Variables (.env)

```env
PORT=3000                    # Server port
DB_HOST=127.0.0.1           # Database host
DB_USER=root                # Database user
DB_PASSWORD=SysAdmin@123    # Database password
DB_NAME=erp_db              # Database name
JWT_SECRET=supersecretkey   # JWT secret
NODE_ENV=production         # Environment
```

### Frontend API Configuration

The frontend is pre-configured to use relative URLs (`/api/v1`), which works automatically when served from the same origin.

## 📊 Database Setup

The application uses the same MySQL database as the Python backend.

**Create admin user:**
```bash
npm run create-admin
```

**Credentials:**
- Email: admin@example.com
- Password: admin

## 🔒 Production Checklist

- [ ] Change `JWT_SECRET` in `.env`
- [ ] Update database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Build frontend: `cd client && npm run build`
- [ ] Configure firewall (allow port 3000 or 80)
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure Apache virtual host
- [ ] Use PM2 for process management
- [ ] Set up log rotation
- [ ] Configure backup strategy
- [ ] Test all API endpoints
- [ ] Change default admin password

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
lsof -i :3000
kill -9 <PID>
```

### Apache Proxy Not Working

1. Check modules are enabled
2. Verify Node.js is running
3. Check Apache error logs
4. Ensure no firewall blocking

### Frontend Shows 404

1. Rebuild frontend: `cd client && npm run build`
2. Check `client/dist` folder exists
3. Restart Node.js server

### Database Connection Error

1. Verify MySQL is running
2. Check credentials in `.env`
3. Ensure database `erp_db` exists
4. Test connection: `mysql -u root -p`

## 📝 Maintenance

### Update Application

```bash
# Update backend
npm install

# Update frontend
cd client
npm install
npm run build
cd ..

# Restart
pm2 restart erp-app
```

### View Logs

```bash
# PM2 logs
pm2 logs erp-app

# Apache logs
tail -f /var/log/apache2/erp-error.log
```

### Backup Database

```bash
mysqldump -u root -p erp_db > backup_$(date +%Y%m%d).sql
```

## 🎯 Performance Tips

1. **Enable gzip compression** in Apache
2. **Use PM2 cluster mode** for multiple CPU cores
3. **Configure Apache caching** for static files
4. **Use CDN** for assets
5. **Enable HTTP/2** in Apache
6. **Optimize database** queries and indexes

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Apache mod_proxy](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

**Need help?** Check the logs or contact support.
