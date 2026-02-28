import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CreditCard } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

const UserBookings = ({ showMessage }) => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const res = await fetch(`${API_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setBookings(await res.json());
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
      {bookings.map(b => (
        <div key={b.id} className="bg-white p-4 rounded shadow mb-4">
          <h2 className="font-bold">{b.service.title}</h2>
          <div className="flex gap-4 text-gray-600">
            <span><Calendar className="inline" /> {b.booking_date}</span>
            <span><Clock className="inline" /> {b.time_slot}</span>
            <span><CreditCard className="inline" /> ₹{b.total_amount}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserBookings;
