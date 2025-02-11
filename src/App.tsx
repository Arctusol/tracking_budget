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
import routes from "tempo-routes";

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
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/groups/:groupId" element={<GroupDashboard />} />
                    <Route path="/import" element={<ImportPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                  {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
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
