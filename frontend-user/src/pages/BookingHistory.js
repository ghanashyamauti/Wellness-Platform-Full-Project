import React, { useEffect, useState } from "react";
import axios from "axios";

function BookingHistory() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    axios.get("http://localhost:8000/user/bookings", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBookings(res.data));
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Service</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Time</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Payment</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td className="p-2 border">{b.service_id}</td>
              <td className="p-2 border">{b.booking_date}</td>
              <td className="p-2 border">{b.time_slot}</td>
              <td className="p-2 border">{b.status}</td>
              <td className="p-2 border">{b.payment_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BookingHistory;
