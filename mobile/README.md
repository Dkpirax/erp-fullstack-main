# ERP Fullstack - Mobile App

A React Native mobile application built with Expo that mirrors all features of the ERP web frontend.

## 📱 Features

| Feature | Screen |
|---|---|
| 🏠 **Dashboard** | KPI stats, quick access tiles |
| 🏪 **POS (Point of Sale)** | Product grid, cart, checkout |
| 📋 **Sales History** | Expandable order list |
| 📦 **Inventory** | Product catalog with search & stock status |
| 🚚 **Suppliers** | Supply chain supplier management |
| 💳 **Finance** | Chart of accounts with balances |
| 🤝 **CRM** | Customer list with status |
| 📊 **Reports** | Today's & all-time analytics |
| 💬 **Chat** | Real-time messaging via Socket.IO |
| 👥 **User Management** | Admin-only user listing |
| 👤 **Profile** | User details & logout |

## 🚀 Getting Started

### 1. Configure API URL

Edit `src/lib/api.ts` and update:

```ts
export const API_BASE_URL = 'http://YOUR_SERVER_IP:3000';
```

> ⚠️ Use your **local machine's IP address** (not `localhost`) because the phone/emulator can't reach `localhost` of your PC. Find it with `ipconfig` (Windows).

### 2. Install dependencies

```bash
cd mobile
npm install
```

### 3. Start the app

```bash
# Start Expo dev server
npm start

# Or run directly on Android
npm run android

# Or run on iOS (Mac only)
npm run ios
```

### 4. Test on device

- Install **Expo Go** app on your phone
- Scan the QR code in the terminal / browser
- Make sure your phone and PC are on the same WiFi network

## 📁 Project Structure

```
mobile/
├── App.tsx                          # Root component
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx          # Authentication state
│   │   └── SocketContext.tsx        # Real-time socket connection
│   ├── lib/
│   │   └── api.ts                   # All API calls (axios)
│   ├── navigation/
│   │   └── RootNavigator.tsx        # All navigation (tabs + stacks)
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Home dashboard
│   │   ├── ReportsScreen.tsx        # Business reports
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── pos/
│   │   │   ├── POSScreen.tsx        # Point of Sale
│   │   │   └── SalesHistoryScreen.tsx
│   │   ├── supply_chain/
│   │   │   ├── InventoryScreen.tsx
│   │   │   └── SupplierScreen.tsx
│   │   ├── finance/
│   │   │   └── FinanceScreen.tsx
│   │   ├── crm/
│   │   │   └── CRMScreen.tsx
│   │   ├── chat/
│   │   │   └── ChatScreen.tsx       # Real-time chat
│   │   ├── admin/
│   │   │   └── UserManagementScreen.tsx
│   │   └── settings/
│   │       └── ProfileScreen.tsx
│   └── theme/
│       └── colors.ts                # Design system colors
```

## 🔐 Default Login

```
Username: admin
Password: admin
```

## 🛠 Tech Stack

- **Expo SDK 54** with New Architecture
- **React Navigation 7** (Bottom Tabs + Native Stack)
- **Axios** for REST API calls
- **Socket.IO Client** for real-time chat
- **AsyncStorage** for token persistence
- **TypeScript** throughout
