// src/components/ResetPasswordForm.js
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Password reset successfully.");
      } else {
        setMessage(data.error || "Error resetting password.");
      }
    } catch (err) {
      setMessage("Server error.");
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Reset Password</h2>
      <form onSubmit={handleReset} className="space-y-4">
        <input
          type="password"
          placeholder="New password"
          className="w-full p-2 border rounded"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Reset Password
        </button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
};

export default ResetPasswordForm;
