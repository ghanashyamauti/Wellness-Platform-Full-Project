import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import ServicesManagement from "./pages/ServicesManagement";
import BookingsManagement from "./pages/BookingsManagement";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/services" element={<ServicesManagement />} />
          <Route path="/admin/bookings" element={<BookingsManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
