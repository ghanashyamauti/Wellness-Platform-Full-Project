import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ServiceDetails() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const timeSlots = ["09:00 AM – 10:00 AM","10:00 AM – 11:00 AM","11:00 AM – 12:00 PM","01:00 PM – 02:00 PM","02:00 PM – 03:00 PM","03:00 PM – 04:00 PM","04:00 PM – 05:00 PM","05:00 PM – 06:00 PM"];

  useEffect(() => {
    axios.get("http://localhost:8000/user/services")
      .then(res => {
        const found = res.data.find(s => s.id === parseInt(id));
        setService(found);
      });
  }, [id]);

  const handleBooking = async () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("Please login first"); return; }
    try {
      const res = await axios.post(
        "http://localhost:8000/user/bookings",
        { service_id: id, booking_date: date, time_slot: timeSlot },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Booking ${res.data.status} | Payment: ${res.data.payment_status}`);
    } catch (err) {
      alert(err.response.data.detail);
    }
  };

  if (!service) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto border p-4 rounded">
      <img src={service.image_url} alt={service.name} className="w-full h-64 object-cover mb-2" />
      <h2 className="font-bold text-2xl">{service.name}</h2>
      <p>{service.description}</p>
      <p className="font-semibold mt-2">Price: ${service.price}</p>

      <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-2 rounded mt-2 w-full"/>
      <select value={timeSlot} onChange={e=>setTimeSlot(e.target.value)} className="border p-2 rounded mt-2 w-full">
        <option value="">Select Time Slot</option>
        {timeSlots.map(ts => <option key={ts} value={ts}>{ts}</option>)}
      </select>

      <button onClick={handleBooking} className="bg-blue-600 text-white p-2 rounded mt-2 w-full">Book Now</button>
    </div>
  );
}

export default ServiceDetails;
