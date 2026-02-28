import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ServiceDetails from "./pages/ServiceDetails";
import BookingHistory from "./pages/BookingHistory";
import LoginRegister from "./pages/LoginRegister";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/service/:id" element={<ServiceDetails />} />
          <Route path="/bookings" element={<BookingHistory />} />
          <Route path="/login" element={<LoginRegister />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
