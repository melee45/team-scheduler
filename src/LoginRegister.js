import React, { useState } from "react";

const LoginRegister = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const endpoint = isLogin ? "/login" : "/register";

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);
        onLogin(); // trigger view change
      } else {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          setIsLogin(true);
          setSuccess("");
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">{isLogin ? "Login" : "Register"}</h2>

      {!isLogin && (
        <input
          className="block w-full mb-2 p-2 border rounded"
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />
      )}
      <input
        className="block w-full mb-2 p-2 border rounded"
        name="email"
        placeholder="Email"
        onChange={handleChange}
      />
      <input
        className="block w-full mb-4 p-2 border rounded"
        name="password"
        type="password"
        placeholder="Password"
        onChange={handleChange}
      />

      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}

      <button
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
      </button>

      <p className="text-sm mt-4 text-center">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          className="text-blue-600 underline"
          onClick={() => {
            setError("");
            setSuccess("");
            setIsLogin(!isLogin);
          }}
        >
          {isLogin ? "Register" : "Login"}
        </button>
      </p>
    </div>
  );
};

export default LoginRegister;
