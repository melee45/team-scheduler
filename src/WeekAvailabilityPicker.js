import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

const WeekAvailabilityPicker = () => {
  const [selectedSlots, setSelectedSlots] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");

  // Load previous availability
  useEffect(() => {
    if (!token || !name) return;

    const loadAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:4000/availability", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data = await response.json();
        const userAvailability = data.find((entry) => entry.user === name);

        if (userAvailability) {
          const loadedSlots = {};
          userAvailability.availability.forEach(({ day, hour }) => {
            loadedSlots[`${day}_${hour}`] = true;
          });
          setSelectedSlots(loadedSlots);
          setHasChanges(false);
        }
      } catch (err) {
        console.error("Failed to load availability", err);
        setError("Could not load availability");
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [token, name]);

  const toggleSlot = (day, hour) => {
    const key = `${day}_${hour}`;
    setSelectedSlots((prev) => {
      const newValue = !prev[key];
      if (newValue === prev[key]) return prev; // no change
      const updated = { ...prev, [key]: newValue };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSubmit = async () => {
    const selected = Object.entries(selectedSlots)
      .filter(([_, v]) => v)
      .map(([k]) => {
        const [day, hour] = k.split("_");
        return { day: Number(day), hour: Number(hour) };
      });

    try {
      const response = await fetch("http://localhost:4000/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user: name, availability: selected }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Availability saved successfully!");
        setHasChanges(false);
      } else {
        alert("Failed to save availability: " + data.error);
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("There was an error submitting your availability.");
    }
  };

  if (!token || !name) {
    return <p>Please log in to manage your availability.</p>;
  }

  if (loading) {
    return <p>Loading availability...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select Your Availability</h2>
      <div className="grid grid-cols-8 gap-2">
        <div></div>
        {[...Array(7)].map((_, dayIdx) => (
          <div key={dayIdx} className="text-center font-semibold">
            {format(addDays(weekStart, dayIdx), "EEE dd")}
          </div>
        ))}

        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="text-right pr-2">{hour}:00</div>
            {[...Array(7)].map((_, dayIdx) => {
              const key = `${dayIdx}_${hour}`;
              const selected = selectedSlots[key];
              return (
                <div
                  key={key}
                  className={`border h-10 cursor-pointer transition-colors ${
                    selected ? "bg-blue-500" : "hover:bg-blue-100"
                  }`}
                  onClick={() => toggleSlot(dayIdx, hour)}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {hasChanges && (
        <button
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={handleSubmit}
        >
          Submit Availability
        </button>
      )}
    </div>
  );
};

export default WeekAvailabilityPicker;
