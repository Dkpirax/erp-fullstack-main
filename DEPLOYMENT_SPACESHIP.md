# Deploying ERP Fullstack to Spaceship.com (Shared Hosting)

This guide is specifically designed for **shared hosting environments** like **Spaceship.com** that use cPanel and support Node.js apps via **CloudLinux Selector**.

## 📋 Prerequisites

1.  **Spaceship Hosting Account** with cPanel access.
2.  **Domain or Subdomain** pointed to your hosting.
3.  **Database Created**: A MySQL database + User created in cPanel.

---

## 🚀 Step 1: Prepare Your Application

We need to bundle the backend code along with the *built* frontend files.

1.  Open your project folder in Windows Explorer.
2.  Double-click **`build_deployment.bat`**.
3.  Wait for the process to finish. It will:
    *   Install dependencies.
    *   Build the React frontend.
    *   Create a **`deployment`** folder.
    *   **Automatically create `erp-deploy.zip`** for you.
4.  Locate **`erp-deploy.zip`** in your project folder.

---

## 📤 Step 2: Upload to cPanel

1.  Log in to your **Spaceship cPanel**.
2.  Go to **File Manager**.
3.  Create a folder for your app (e.g., `erp-app`) in the root (usually `/home/yourusername/erp-app`).
    *   **Do NOT** put it inside `public_html` yet. It's safer to keep the code outside the public web root.
4.  **Upload** `erp-deploy.zip` to this new folder.
5.  **Extract** the zip file.

---

## ⚙️ Step 3: Create Database

1.  In cPanel, go to **MySQL® Database Wizard**.
2.  **Step 1:** Create a Database (e.g., `youruser_erp`).
3.  **Step 2:** Create a User (e.g., `youruser_admin`).
4.  **Step 3:** Assign Privileges -> Check **ALL PRIVILEGES**.
5.  **Important:** Note down the Database Name, Username, and Password.

---

## 🔧 Step 4: Setup Node.js App

1.  In cPanel, search for **Setup Node.js App**.
2.  Click **Create Application**.
3.  Configure the following:
    *   **Node.js Version**: Select **18.x** or **20.x** (Compatible with your local dev).
    *   **Application Mode**: `Production`.
    *   **Application Root**: `/erp-app` (The folder where you extracted files).
    *   **Application URL**: Select your domain (e.g., `erp.yourdomain.com`).
    *   **Application Startup File**: `server.js`.
4.  Click **Create**.

---

## 🛠️ Step 5: Install Dependencies & Configure

1.  Once created, the app details page will open.
2.  Click **Run NPM Install**.
    *   This installs backend dependencies on the server.
3.  **Environment Variables (Configuring Database):**
    *   Look for the **Environment Variables** section on the Node.js App page.
    *   Click **Add Variable** and add these:

    | Name | Value |
    | :--- | :--- |
    | `PORT` | `3000` (or leave default, Passenger handles this mostly) |
    | `DB_HOST` | `localhost` (Usually localhost for cPanel) |
    | `DB_USER` | `youruser_admin` (From Step 3) |
    | `DB_PASSWORD` | `your_password` |
    | `DB_NAME` | `youruser_erp` |
    | `JWT_SECRET` | `CreateAStrongSecretKeyHere` |
    | `NODE_ENV` | `production` |

4.  Click **Save**.
5.  **Restart** the application (Button usually at the top/right).

---

## 🏁 Step 6: Initialize Database

We need to create the tables. Since we can't easily run commands like `npm run create-admin` in shared hosting terminals (sometimes SSH is restricted), we can use a temporary route or SSH if available.

### Option A: Via SSH (Recommended if available)
1.  Copy the **"Enter to the virtual environment"** command from the Node.js App page (it looks like `source /home/user/nodevenv/erp-app/18/bin/activate`).
2.  Paste it into the Terminal (in cPanel or via Putty).
3.  Run:
    ```bash
    cd erp-app
    node scripts/create_admin.js
    ```
4.  This creates tables and the admin user.

### Option B: Auto-Init (If SSH is difficult)
The app is configured to `sequelize.sync()` on startup (if using `server.js` logic usually), but `create_admin.js` usually inserts the data.
*   You might need to manually run the SQL or ask your developer to add a route that triggers data seeding.

---

## ✅ Step 7: Verify

1.  Visit your domain (e.g., `http://erp.yourdomain.com`).
2.  You should see the Login Page.
3.  Login with:
    *   **Email**: `admin@example.com`
    *   **Password**: `admin` (or whatever `create_admin.js` sets).
