import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./components/dashboard/Dashboard";
import { GroupDashboard } from "./components/dashboard/GroupDashboard";
import { Layout } from "./components/layout/Layout";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SpeedInsights } from '@vercel/speed-insights/react';
import AuthPage from "./pages/auth";
import ImportPage from "./pages/import";
import GroupsPage from "./pages/groups";
import TransactionsPage from "./pages/transactions";
import ReceiptsPage from "./pages/receipts";
import ReceiptsDashboardPage from "./pages/receipts-dashboard";

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/receipts-dashboard" element={<ReceiptsDashboardPage />} />
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/groups/:slug" element={<GroupDashboard />} />
                    <Route path="/import" element={<ImportPage />} />
                    <Route path="/receipts" element={<ReceiptsPage />} />
                    <Route path="/receipts-dashboard" element={<ReceiptsDashboardPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <SpeedInsights />
    </AuthProvider>
  );
}

export default App;
