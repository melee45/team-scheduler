import React, { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

const WeekAvailabilityPicker = () => {
  const [selectedSlots, setSelectedSlots] = useState({});
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start

  const toggleSlot = (day, hour) => {
    const key = `${day}_${hour}`;
    setSelectedSlots((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = () => {
    const selected = Object.entries(selectedSlots)
      .filter(([_, v]) => v)
      .map(([k]) => {
        const [day, hour] = k.split("_");
        return { day: Number(day), hour: Number(hour) };
      });
    console.log("Submitting availability:", selected);
    // Send to backend API here
  };

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
                  className={`border h-10 cursor-pointer ${
                    selected ? "bg-blue-500" : "hover:bg-blue-100"
                  }`}
                  onClick={() => toggleSlot(dayIdx, hour)}
                ></div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <button
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={handleSubmit}
      >
        Submit Availability
      </button>
    </div>
  );
};

export default WeekAvailabilityPicker;
