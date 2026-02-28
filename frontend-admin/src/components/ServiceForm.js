import React, { useState } from "react";

function ServiceForm({ onSubmit, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [duration, setDuration] = useState(initialData?.duration || 60);
  const [price, setPrice] = useState(initialData?.price || 500);
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "static/service-images/placeholder.png");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, category, description, duration, price, image_url: imageUrl, is_active: true });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border p-4 rounded">
      <input type="text" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="border p-2 rounded" required/>
      <input type="text" placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} className="border p-2 rounded" required/>
      <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className="border p-2 rounded"/>
      <input type="number" placeholder="Duration (min)" value={duration} onChange={e=>setDuration(e.target.value)} className="border p-2 rounded"/>
      <input type="number" placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} className="border p-2 rounded"/>
      <button type="submit" className="bg-green-600 text-white p-2 rounded">Save</button>
    </form>
  );
}

export default ServiceForm;
