import React, { useEffect, useState } from "react";

const AvailabilitySummary = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/availability")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-2">All Submitted Availabilities</h3>
      <div className="space-y-2">
        {data.map(({ user, availability }) => (
          <div key={user} className="border p-2 rounded bg-gray-50">
            <strong>{user}:</strong>{" "}
            {availability.map((slot, i) => (
              <span key={i}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][slot.day]}{" "}
                {slot.hour}:00
                {i < availability.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailabilitySummary;
