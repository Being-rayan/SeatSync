import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicLayout from "../layouts/PublicLayout";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminJourneysPage from "../pages/AdminJourneysPage";
import AdminSwapMonitoringPage from "../pages/AdminSwapMonitoringPage";
import JourneyVerificationPage from "../pages/JourneyVerificationPage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import NotificationsPage from "../pages/NotificationsPage";
import NotFoundPage from "../pages/NotFoundPage";
import PassengerDashboardPage from "../pages/PassengerDashboardPage";
import RegisterPage from "../pages/RegisterPage";
import SwapRequestsPage from "../pages/SwapRequestsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["passenger"]} />}>
        <Route path="/verify" element={<JourneyVerificationPage />} />
        <Route path="/app/dashboard" element={<PassengerDashboardPage />} />
        <Route path="/app/swaps" element={<SwapRequestsPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["passenger", "admin"]} />}>
        <Route path="/app/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/journeys" element={<AdminJourneysPage />} />
        <Route path="/admin/swaps" element={<AdminSwapMonitoringPage />} />
      </Route>

      <Route path="/dashboard" element={<Navigate replace to="/app/dashboard" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
