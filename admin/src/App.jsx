import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/Layout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import Occupancy from "@/pages/Occupancy";
import RegisterEntry from "@/pages/RegisterEntry";
import Entries from "@/pages/Entries";
import Spaces from "@/pages/Spaces";
import Reviews from "@/pages/Reviews";
import Integrations from "@/pages/Integrations";
import Settings from "@/pages/Settings";
import Staff from "@/pages/Staff";
import History from "@/pages/History";
import Account from "@/pages/Account";

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute allowedRoles={["admin", "recepcion"]} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/solicitudes" element={<Bookings />} />
              <Route path="/ocupacion" element={<Occupancy />} />
              <Route path="/registro" element={<RegisterEntry />} />
              <Route path="/ingresos" element={<Entries />} />
              <Route path="/habitaciones" element={<Spaces />} />
              <Route path="/opiniones" element={<Reviews />} />
              <Route path="/integraciones" element={<Integrations />} />
              <Route path="/ajustes" element={<Settings />} />
              <Route path="/accesos" element={<Staff />} />
              <Route path="/historial" element={<History />} />
              <Route path="/cuenta" element={<Account />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
