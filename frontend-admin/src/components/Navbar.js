import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const token = localStorage.getItem("admin_token");

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  };

  return (
    <nav className="bg-green-600 text-white p-4 flex justify-between">
      <div className="font-bold text-xl">Admin Panel</div>
      <div>
        {token ? (
          <>
            <Link to="/admin/dashboard" className="mr-4">Dashboard</Link>
            <Link to="/admin/services" className="mr-4">Services</Link>
            <Link to="/admin/bookings" className="mr-4">Bookings</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/admin/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
