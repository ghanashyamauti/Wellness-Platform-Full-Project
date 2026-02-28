import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    axios.get("http://localhost:8000/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data));
    axios.get("http://localhost:8000/admin/bookings", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBookings(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-bold text-lg">Total Users</h3>
          <p className="text-3xl">{users.length}</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-bold text-lg">Total Bookings</h3>
          <p className="text-3xl">{bookings.length}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
