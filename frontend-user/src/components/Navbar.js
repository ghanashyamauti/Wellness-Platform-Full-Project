import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between">
      <div className="font-bold text-xl">
        <Link to="/">Wellness Platform</Link>
      </div>
      <div>
        {token ? (
          <>
            <Link to="/bookings" className="mr-4">Bookings</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login/Register</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
