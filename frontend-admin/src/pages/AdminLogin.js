import React, { useState } from "react";
import axios from "axios";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/auth/login", { email, password });
      const token = res.data.access_token;
      // Only allow admin
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") {
        alert("Not an admin account");
        return;
      }
      localStorage.setItem("admin_token", token);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      alert(err.response.data.detail);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded mt-8">
      <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-2">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 rounded" required/>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 rounded" required/>
        <button type="submit" className="bg-green-600 text-white p-2 rounded">Login</button>
      </form>
    </div>
  );
}

export default AdminLogin;
