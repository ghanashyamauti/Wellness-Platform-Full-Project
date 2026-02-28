import React, { useEffect, useState } from "react";
import axios from "axios";
import ServiceCard from "../components/ServiceCard";

function Home() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/user/services")
      .then(res => setServices(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {services.map(service => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}

export default Home;
