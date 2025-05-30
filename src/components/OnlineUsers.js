// components/OnlineUsers.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function OnlineUsers({ token }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchOnlineStatus = async () => {
      try {
        const res = await axios.get("http://localhost:4000/users/online-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching online status:", err);
      }
    };

    fetchOnlineStatus();
    const interval = setInterval(fetchOnlineStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, maxWidth: 400 }}>
      <h3>Online Status</h3>
      <ul>
        {users.map((user) => (
          <li key={user.email} style={{ marginBottom: 8 }}>
            <strong>{user.name || user.email}</strong> —{" "}
            <span style={{ color: user.status === "online" ? "green" : "gray" }}>
              {user.status}
            </span>{" "}
            <small>({user.timeSinceLastActivity})</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OnlineUsers;
