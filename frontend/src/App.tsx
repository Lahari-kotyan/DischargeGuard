import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DischargeProvider } from './context/DischargeContext';
import { Layout } from './components/Layout';
import { SignInPage } from './pages/SignInPage';
import { DashboardPage } from './pages/DashboardPage';
import { DischargePlanPage } from './pages/DischargePlanPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { UploadPage } from './pages/UploadPage';
import { ReviewVerifyPage } from './pages/ReviewVerifyPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <DischargeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<SignInPage />} />

            {/* Protected Application Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout title="Dashboard">
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/discharge-plan"
              element={
                <ProtectedRoute>
                  <Layout title="My Discharge Plan">
                    <DischargePlanPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/medications"
              element={
                <ProtectedRoute>
                  <Layout title="Medications">
                    <MedicationsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Layout title="Follow-Up Appointments">
                    <AppointmentsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Layout title="Upload Discharge Summary">
                    <UploadPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <Layout title="Review & Verify">
                    <ReviewVerifyPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <Layout title="My Documents">
                    <DocumentsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout title="Profile & Settings">
                    <ProfileSettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-All Redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DischargeProvider>
    </AuthProvider>
  );
}

export default App;
