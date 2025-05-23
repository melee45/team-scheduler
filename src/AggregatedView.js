import React, { useState, useEffect } from "react";

function AggregatedView() {
  const [aggregated, setAggregated] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // {day, hour}
  const [attendees, setAttendees] = useState([]); // This should come from your users/emails

  useEffect(() => {
    // Fetch aggregated availability from backend
    fetch("http://localhost:4000/availability/aggregate")
      .then((res) => res.json())
      .then((data) => setAggregated(data));
  }, []);

  async function sendInvites() {
    if (!selectedSlot) {
      alert("Please select a time slot first.");
      return;
    }

    if (attendees.length === 0) {
      alert("No attendees available.");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendees,
          day: selectedSlot.day,
          hour: selectedSlot.hour,
          meetingTitle: "Weekly Team Meeting",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Invitations sent!");
      } else {
        alert("Failed to send invites: " + data.error);
      }
    } catch (error) {
      alert("Error sending invites: " + error.message);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Aggregated Availability</h2>
      <ul>
        {aggregated.map(({ day, hour, count }, index) => (
          <li
            key={index}
            onClick={() => setSelectedSlot({ day, hour })}
            style={{
              cursor: "pointer",
              backgroundColor:
                selectedSlot?.day === day && selectedSlot?.hour === hour
                  ? "#3b82f6"
                  : "transparent",
              color:
                selectedSlot?.day === day && selectedSlot?.hour === hour
                  ? "white"
                  : "black",
              padding: "8px",
              marginBottom: "4px",
              borderRadius: "4px",
            }}
          >
            Day {day}, {hour}:00 — {count} people available
          </li>
        ))}
      </ul>

      <button
        onClick={sendInvites}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Send Invites
      </button>
    </div>
  );
}

export default AggregatedView;
