import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

const LoginRegister = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const endpoint = isLogin ? "/login" : "/register";

    setLoading(true);
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
        toast.success("Login successful!");
        onLogin();
      } else {
        // Automatically log in after successful registration
        const loginRes = await fetch(`http://localhost:4000/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || "Login after register failed");

        localStorage.setItem("token", loginData.token);
        localStorage.setItem("name", loginData.name);
        toast.success("Registered and logged in!");
        onLogin();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto mt-16 p-6 border rounded-2xl shadow-lg bg-white"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? "Login to your account" : "Create an account"}
      </h2>

      {!isLogin && (
        <input
          className="block w-full mb-3 p-3 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300"
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />
      )}
      <input
        className="block w-full mb-3 p-3 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300"
        name="email"
        placeholder="Email"
        onChange={handleChange}
      />
      <input
        className="block w-full mb-4 p-3 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300"
        name="password"
        type="password"
        placeholder="Password"
        onChange={handleChange}
      />

      <button
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
      </button>

      <p className="text-sm mt-5 text-center text-gray-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          className="text-blue-600 underline font-medium"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Register" : "Login"}
        </button>
      </p>

      <ToastContainer position="top-center" />
    </motion.div>
  );
};

export default LoginRegister;
