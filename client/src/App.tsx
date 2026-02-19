import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { FinanceDashboard } from "./pages/finance/FinanceDashboard";
import { ChartOfAccounts } from "./pages/finance/ChartOfAccounts";
import { GeneralLedger } from "./pages/finance/GeneralLedger";
import { AccountsPayable } from "./pages/finance/AccountsPayable";
import { AccountsReceivable } from "./pages/finance/AccountsReceivable";

// ... (existing imports)

<Route path="finance">
  <Route index element={<FinanceDashboard />} />
  <Route path="accounts" element={<ChartOfAccounts />} />
  <Route path="ledger" element={<GeneralLedger />} />
  <Route path="payable" element={<AccountsPayable />} />
  <Route path="receivable" element={<AccountsReceivable />} />
</Route>
import { SupplyChainDashboard } from "./pages/supply_chain/SupplyChainDashboard";
import { InventoryList } from "./pages/supply_chain/InventoryList";
import { SupplierList } from "./pages/supply_chain/SupplierList";
import { HRDashboard } from "./pages/hr/HRDashboard";
import { EmployeeList } from "./pages/hr/EmployeeList";
import { PayrollProcessing } from "./pages/hr/PayrollProcessing";
import { CRMDashboard } from "./pages/crm/CRMDashboard";
import { CustomerList } from "./pages/crm/CustomerList";
import { SalesPipeline } from "./pages/crm/SalesPipeline";
import { ManufacturingDashboard } from "./pages/manufacturing/ManufacturingDashboard";
import { WorkOrderList } from "./pages/manufacturing/WorkOrderList";
import { BOMList } from "./pages/manufacturing/BOMList";
import { POSInterface } from "./pages/pos/POSInterface";
import { SalesHistory } from "./pages/pos/SalesHistory";
import { SessionManagement } from "./pages/pos/SessionManagement";
import { LoyaltyAndCoupons } from "./pages/pos/LoyaltyAndCoupons";
import { ReceiptPage } from "./pages/pos/ReceiptPage";
import { DarazDashboard } from "./pages/daraz/DarazDashboard";
import { DarazProducts } from "./pages/daraz/DarazProducts";
import { DarazOrders } from "./pages/daraz/DarazOrders";
import { DarazSettings } from "./pages/daraz/DarazSettings";
import { SocialMediaDashboard } from "./pages/social_media/SocialMediaDashboard";
import { Campaigns } from "./pages/social_media/Campaigns";
import { UnifiedInbox } from "./pages/social_media/UnifiedInbox";
import { SocialMediaSettings } from "./pages/social_media/SocialMediaSettings";
import { WooCommerceDashboard } from "./pages/woocommerce/WooCommerceDashboard";
import { WooCommerceProducts } from "./pages/woocommerce/WooCommerceProducts";
import { WooCommerceProductView } from "./pages/woocommerce/WooCommerceProductView";
import { WooCommerceProductEdit } from "./pages/woocommerce/WooCommerceProductEdit";
import { WooCommerceProductAdd } from "./pages/woocommerce/WooCommerceProductAdd";
import { WooCommerceOrders } from "./pages/woocommerce/WooCommerceOrders";
import { WooCommerceCustomers } from "./pages/woocommerce/WooCommerceCustomers";
import { WooCommerceSettings } from "./pages/woocommerce/WooCommerceSettings";
import { LoginPage } from "./pages/auth/LoginPage";
import { ProfilePage } from "./pages/settings/ProfilePage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { UserManagement } from "./pages/admin/UserManagement";
import { OrganizationSettings } from "./pages/admin/OrganizationSettings";
import { PrivilegeManagement } from "./pages/admin/PrivilegeManagement";
import { ReportsPage } from "./pages/ReportsPage";
import { PaymentReports } from "./pages/reports/PaymentReports";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin/users" element={<UserManagement />} />
              <Route path="admin/organization" element={<OrganizationSettings />} />
              <Route path="admin/privileges" element={<PrivilegeManagement />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/payments" element={<PaymentReports />} />

              <Route path="finance">
                <Route index element={<FinanceDashboard />} />
                <Route path="accounts" element={<ChartOfAccounts />} />
                <Route path="ledger" element={<GeneralLedger />} />
                <Route path="payable" element={<AccountsPayable />} />
                <Route path="receivable" element={<AccountsReceivable />} />
              </Route>
              <Route path="supply-chain">
                <Route index element={<SupplyChainDashboard />} />
                <Route path="inventory" element={<InventoryList />} />
                <Route path="suppliers" element={<SupplierList />} />
              </Route>
              <Route path="hr">
                <Route index element={<HRDashboard />} />
                <Route path="employees" element={<EmployeeList />} />
                <Route path="payroll" element={<PayrollProcessing />} />
              </Route>
              <Route path="crm">
                <Route index element={<CRMDashboard />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="pipeline" element={<SalesPipeline />} />
              </Route>
              <Route path="manufacturing">
                <Route index element={<ManufacturingDashboard />} />
                <Route path="work-orders" element={<WorkOrderList />} />
                <Route path="boms" element={<BOMList />} />
              </Route>
              <Route path="pos">
                <Route index element={<POSInterface />} />
                <Route path="history" element={<SalesHistory />} />
                <Route path="session" element={<SessionManagement />} />
                <Route path="loyalty-coupons" element={<LoyaltyAndCoupons />} />
                <Route path="receipt/:id" element={<ReceiptPage />} />
              </Route>
              <Route path="daraz">
                <Route index element={<DarazDashboard />} />
                <Route path="products" element={<DarazProducts />} />
                <Route path="orders" element={<DarazOrders />} />
                <Route path="settings" element={<DarazSettings />} />
              </Route>
              <Route path="social-media">
                <Route index element={<SocialMediaDashboard />} />
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="inbox" element={<UnifiedInbox />} />
                <Route path="settings" element={<SocialMediaSettings />} />
              </Route>
              <Route path="woocommerce">
                <Route index element={<WooCommerceDashboard />} />
                <Route path="products" element={<WooCommerceProducts />} />
                <Route path="products/add" element={<WooCommerceProductAdd />} />
                <Route path="products/:id" element={<WooCommerceProductView />} />
                <Route path="products/:id/edit" element={<WooCommerceProductEdit />} />
                <Route path="orders" element={<WooCommerceOrders />} />
                <Route path="customers" element={<WooCommerceCustomers />} />
                <Route path="settings" element={<WooCommerceSettings />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
