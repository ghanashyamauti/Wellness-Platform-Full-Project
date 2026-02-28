import React from "react";
import { Link } from "react-router-dom";

function ServiceCard({ service }) {
  return (
    <div className="border p-4 rounded shadow hover:shadow-lg">
      <img src={service.image_url} alt={service.name} className="w-full h-40 object-cover mb-2" />
      <h2 className="font-bold text-lg">{service.name}</h2>
      <p className="text-gray-700">{service.description}</p>
      <p className="text-gray-900 font-semibold">Price: ${service.price}</p>
      <Link to={`/service/${service.id}`} className="text-blue-600 hover:underline mt-2 block">Book Now</Link>
    </div>
  );
}

export default ServiceCard;
