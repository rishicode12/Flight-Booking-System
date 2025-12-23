import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import FlightSearch from "./components/FlightSearch";
import BookingHistory from "./components/BookingHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UserProfilePage from "./pages/UserProfilePage";

function App() {
  const [currentPage, setCurrentPage] = useState("search");

  return (
    <Routes>
      {/* Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FlightSearch onNavigate={(page = 'bookings') => setCurrentPage(page)} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <BookingHistory onNavigate={(page = 'search') => setCurrentPage(page)} />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
