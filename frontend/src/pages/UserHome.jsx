// Placeholder for UserHome.jsx
import React from "react";
import { Heart } from "lucide-react";

const UserHome = ({ services, setSelectedService, setPage }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">
        Available Services
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1"
          >
            <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-6xl">
              {["🧘", "🥗", "🧠", "☎️", "🧘‍♀️", "💪"][service.id % 6]}
            </div>

            <div className="p-6">
              <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                {service.category}
              </span>

              <h3 className="text-2xl font-bold text-gray-800 mt-3 mb-2">
                {service.title}
              </h3>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {service.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-800">
                    {service.duration_minutes} min
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Expert</p>
                  <p className="font-semibold text-gray-800">
                    {service.expert_name || "Various"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-purple-600">
                  ₹{service.price}
                </span>

                <button
                  onClick={() => {
                    setSelectedService(service);
                    setPage("booking");
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserHome;
