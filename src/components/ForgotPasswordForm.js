// src/components/ForgotPasswordForm.js
import React, { useState } from "react";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMessage(data.message || "Check your email for a reset link.");
    } catch (err) {
      setMessage("Something went wrong. Try again.");
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Forgot Password</h2>
      <form onSubmit={handleRequestReset} className="space-y-4">
        <input
          type="email"
          placeholder="Your email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Send Reset Link
        </button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
