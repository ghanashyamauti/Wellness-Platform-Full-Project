import React, { useEffect, useState } from "react";
import axios from "axios";
import ServiceForm from "../components/ServiceForm";

function ServicesManagement() {
  const [services, setServices] = useState([]);
  const token = localStorage.getItem("admin_token");

  const fetchServices = () => {
    axios.get("http://localhost:8000/user/services")
      .then(res => setServices(res.data));
  };

  useEffect(() => { fetchServices(); }, []);

  const handleCreate = (data) => {
    axios.post("http://localhost:8000/admin/services", data, { headers: { Authorization: `Bearer ${token}` } })
      .then(()=>fetchServices());
  };

  const handleDeactivate = (id) => {
    axios.delete(`http://localhost:8000/admin/services/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(()=>fetchServices());
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Services Management</h2>
      <ServiceForm onSubmit={handleCreate} />
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(s => (
          <div key={s.id} className="border p-2 rounded">
            <h3 className="font-bold">{s.name}</h3>
            <p>{s.category}</p>
            <p>{s.description}</p>
            <p>Price: ${s.price}</p>
            <p>Status: {s.is_active ? "Active" : "Inactive"}</p>
            <button onClick={()=>handleDeactivate(s.id)} className="bg-red-600 text-white p-1 rounded mt-2">Deactivate</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServicesManagement;
