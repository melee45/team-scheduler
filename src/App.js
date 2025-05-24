import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import WeekAvailabilityPicker from "./WeekAvailabilityPicker";
import AvailabilitySummary from "./AvailabilitySummary";
import AggregatedView from "./AggregatedView";
import LoginRegister from "./LoginRegister";

function Dashboard({ onLogout }) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Welcome, {localStorage.getItem("name")}!</h1>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <WeekAvailabilityPicker />
      <AvailabilitySummary />
      <AggregatedView />
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <Route path="*" element={<LoginRegister onLogin={() => setIsAuthenticated(true)} />} />
        ) : (
          <>
            <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
            {/* You can add more protected routes here if needed */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
