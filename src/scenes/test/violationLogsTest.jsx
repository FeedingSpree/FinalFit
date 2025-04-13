// src/components/ViolationLogsTest.jsx
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  addViolationLog,
  getViolationLogs,
  updateViolationLog,
  deleteViolationLog,
} from "../../services/violationLogsService.ts";

const ViolationLogsTest = () => {
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({
    violation_id: "",
    violation: "",
    building_number: "",
    floor_number: "",
    camera_number: "",
    gender: "",
    dress_code_id: "",
    timestamp: new Date(),
  });

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getViolationLogs();
      setLogs(data);
    };
    fetchLogs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleAdd = async () => {
    await addViolationLog(formData);
    const updated = await getViolationLogs();
    setLogs(updated);
  };

  const handleUpdate = async (id) => {
    const updated = { ...formData, violation: "Updated Violation" };
    await updateViolationLog(id, updated);
    const refreshed = await getViolationLogs();
    setLogs(refreshed);
  };

  const handleDelete = async (id) => {
    await deleteViolationLog(id);
    const refreshed = await getViolationLogs();
    setLogs(refreshed);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Violation Logs CRUD Test</h2>

      <input
        name="violation_id"
        placeholder="Violation ID"
        value={formData.violation_id}
        onChange={handleInputChange}
      />
      <input
        name="violation"
        placeholder="Violation"
        value={formData.violation}
        onChange={handleInputChange}
      />
      <input
        name="building_number"
        placeholder="Building Number"
        value={formData.building_number}
        onChange={handleInputChange}
      />
      <input
        name="floor_number"
        placeholder="Floor Number"
        value={formData.floor_number}
        onChange={handleInputChange}
      />
      <input
        name="camera_number"
        placeholder="Camera Number"
        value={formData.camera_number}
        onChange={handleInputChange}
      />
      <input
        name="gender"
        placeholder="Gender"
        value={formData.gender}
        onChange={handleInputChange}
      />
      <input
        name="dress_code_id"
        placeholder="Dress Code ID"
        value={formData.dress_code_id}
        onChange={handleInputChange}
      />

      <div>
        <label>Timestamp:</label>
        <DatePicker
          selected={formData.timestamp}
          onChange={(date) => handleDateChange("timestamp", date)}
          dateFormat="yyyy-MM-dd HH:mm"
          showTimeSelect
        />
      </div>

      <button onClick={handleAdd}>Add Log</button>

      <ul>
        {logs.map((log) => (
          <li key={log.id}>
            {log.violation_id} - {log.violation} - {log.gender} —{" "}
            {new Date(log.timestamp?.seconds * 1000).toLocaleString()}
            <button onClick={() => handleUpdate(log.id)}>Update</button>
            <button onClick={() => handleDelete(log.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViolationLogsTest;
