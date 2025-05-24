import React, { useState } from "react";

export default function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (isLogin) {
        // Save token to localStorage
        localStorage.setItem("token", data.token);
        onLogin(data.token);
      } else {
        alert("Registered successfully! Please log in.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded mt-6">
      <h2 className="text-xl font-bold mb-4">{isLogin ? "Login" : "Register"}</h2>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>
      </form>
      <button
        onClick={toggleMode}
        className="mt-4 text-blue-600 underline"
        type="button"
      >
        {isLogin ? "Need to register?" : "Already have an account? Login"}
      </button>
    </div>
  );
}
