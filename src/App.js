import { useState, useEffect } from "react";
import WeekAvailabilityPicker from "./WeekAvailabilityPicker";
import AvailabilitySummary from "./AvailabilitySummary";
import AggregatedView from "./AggregatedView";
import LoginRegister from "./LoginRegister";

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

  if (!isAuthenticated) {
    return <LoginRegister onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Welcome, {localStorage.getItem("name")}!</h1>
        <button
          onClick={handleLogout}
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

export default App;
