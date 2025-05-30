import React from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

const SchedulerGrid = ({ availability }) => {
  const isAvailable = (day, hour) =>
    availability.some((slot) => slot.day === day && slot.hour === hour);

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-8 border border-gray-300 text-sm">
        {/* Header Row */}
        <div className="bg-gray-100 p-2 border-r border-b"></div>
        {days.map((day, i) => (
          <div key={i} className="bg-gray-100 p-2 text-center border-b font-medium">
            {day}
          </div>
        ))}

        {/* Time Rows */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time Label */}
            <div className="border-t border-r px-2 py-1 text-right text-xs text-gray-500">
              {hour === 12 ? `12 PM` : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>

            {/* Day Cells */}
            {days.map((_, day) => (
              <div
                key={`${day}-${hour}`}
                className={`border-t border-r h-12 transition-colors duration-200 ${
                  isAvailable(day, hour)
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-100"
                }`}
              ></div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SchedulerGrid;
