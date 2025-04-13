// src/components/UserLogsTest.jsx
import React, { useEffect, useState } from "react";
import {
  addUserLog,
  getUserLogs,
  updateUserLog,
  deleteUserLog,
} from "../../services/userLogsService.ts";

const UserLogsTest = () => {
  const [logs, setLogs] = useState([]);
  const [logData, setLogData] = useState({
    log_id: "",
    action: "",
    timestamp: new Date().toISOString(),
    user_id: "",
  });

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getUserLogs();
      setLogs(data);
    };
    fetchLogs();
  }, []);

  const handleAddLog = async () => {
    const newLog = {
      ...logData,
      timestamp: new Date(logData.timestamp),
    };
    await addUserLog(newLog);
    const updated = await getUserLogs();
    setLogs(updated);
  };

  const handleUpdateLog = async (id) => {
    const updatedLog = {
      ...logData,
      action: "Updated",
      timestamp: new Date(logData.timestamp),
    };
    await updateUserLog(id, updatedLog);
    const updated = await getUserLogs();
    setLogs(updated);
  };

  const handleDeleteLog = async (id) => {
    await deleteUserLog(id);
    const updated = await getUserLogs();
    setLogs(updated);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLogData({
      ...logData,
      [name]: value,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>User Logs</h2>
      <div>
        <input
          type="text"
          name="log_id"
          placeholder="Log ID"
          value={logData.log_id}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="action"
          placeholder="Action"
          value={logData.action}
          onChange={handleInputChange}
        />
        <input
          type="datetime-local"
          name="timestamp"
          value={logData.timestamp.slice(0, 16)}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="user_id"
          placeholder="User ID"
          value={logData.user_id}
          onChange={handleInputChange}
        />
        <button onClick={handleAddLog}>Add Log</button>
      </div>

      <ul>
        {logs.map((log, i) => (
          <li key={i}>
            {log.log_id} — {log.action} | {log.user_id} @{" "}
            {new Date(log.timestamp.seconds * 1000).toLocaleString()}
            <button onClick={() => handleUpdateLog(log.id)}>Update</button>
            <button onClick={() => handleDeleteLog(log.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserLogsTest;
