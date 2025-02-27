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
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Routes protégées */}
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Dashboard principal */}
                    <Route path="/" element={<Dashboard />} />
                    
                    {/* Gestion des transactions */}
                    <Route path="/transactions" element={<TransactionsPage />} />
                    
                    {/* Gestion des groupes */}
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/groups/:slug" element={<GroupDashboard />} />
                    
                    {/* Import de données */}
                    <Route path="/import" element={<ImportPage />} />
                    
                    {/* Gestion des tickets de caisse */}
                    <Route path="/receipts" element={<ReceiptsPage />} />
                    <Route path="/receipts-dashboard" element={<ReceiptsDashboardPage />} />
                    
                    {/* Redirection par défaut */}
                    <Route path="*" element={<Navigate to="/app" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirection par défaut pour les routes inconnues */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <SpeedInsights />
    </AuthProvider>
  );
}

export default App;
