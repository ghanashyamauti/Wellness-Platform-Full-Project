import React, { useState } from "react";
import axios from "axios";

function LoginRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post("http://localhost:8000/auth/register", { name, email, password });
        alert("Registered successfully, please login!");
        setIsRegister(false);
      } else {
        const res = await axios.post("http://localhost:8000/auth/login", { email, password });
        localStorage.setItem("token", res.data.access_token);
        window.location.href = "/";
      }
    } catch (err) {
      alert(err.response.data.detail);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded mt-8">
      <h2 className="text-2xl font-bold mb-4">{isRegister ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {isRegister && (
          <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded" required/>
        )}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 rounded" required/>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 rounded" required/>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">{isRegister ? "Register" : "Login"}</button>
      </form>
      <p className="mt-2 text-sm text-blue-600 cursor-pointer" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
      </p>
    </div>
  );
}

export default LoginRegister;
