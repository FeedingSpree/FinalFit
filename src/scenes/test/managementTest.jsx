// src/components/ManagementTest.jsx
import React, { useEffect, useState } from "react";
import {
  addManagement,
  getManagements,
  updateManagement,
  deleteManagement,
} from "../../services/managementService.ts";
import { Timestamp } from "firebase/firestore";

const ManagementTest = () => {
  const [managements, setManagements] = useState([]);
  const [managementData, setManagementData] = useState({
    dress_code_id: "",
    dress_code: "",
    status: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    const fetchManagements = async () => {
      const data = await getManagements();
      setManagements(data);
    };
    fetchManagements();
  }, []);

  const toTimestamp = (datetime) => Timestamp.fromDate(new Date(datetime));

  const handleAddManagement = async () => {
    const formatted = {
      ...managementData,
      start_date: toTimestamp(managementData.start_date),
      end_date: toTimestamp(managementData.end_date),
    };
    await addManagement(formatted);
    const updated = await getManagements();
    setManagements(updated);
  };

  const handleUpdateManagement = async (id) => {
    const updatedManagement = {
      ...managementData,
      status: "Updated", // Example: change the status to 'Updated'
      start_date: toTimestamp(managementData.start_date),
      end_date: toTimestamp(managementData.end_date),
    };
    await updateManagement(id, updatedManagement);
    const updated = await getManagements();
    setManagements(updated);
  };

  const handleDeleteManagement = async (id) => {
    await deleteManagement(id);
    const updated = await getManagements();
    setManagements(updated);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setManagementData({
      ...managementData,
      [name]: value,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Management List</h2>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="dress_code_id"
          placeholder="Dress Code ID"
          value={managementData.dress_code_id}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="dress_code"
          placeholder="Dress Code"
          value={managementData.dress_code}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="status"
          placeholder="Status"
          value={managementData.status}
          onChange={handleInputChange}
        />
        <input
          type="datetime-local"
          name="start_date"
          value={managementData.start_date}
          onChange={handleInputChange}
        />
        <input
          type="datetime-local"
          name="end_date"
          value={managementData.end_date}
          onChange={handleInputChange}
        />
        <button onClick={handleAddManagement}>Add Management</button>
      </div>

      <ul>
        {managements.map((mgmt, i) => (
          <li key={i}>
            <strong>{mgmt.dress_code_id}</strong> — {mgmt.dress_code} —{" "}
            {mgmt.status}
            <br />
            Start: {mgmt.start_date instanceof Object && mgmt.start_date.toDate
  ? mgmt.start_date.toDate().toLocaleString()
  : new Date(mgmt.start_date).toLocaleString()}<br />
End: {mgmt.end_date instanceof Object && mgmt.end_date.toDate
  ? mgmt.end_date.toDate().toLocaleString()
  : new Date(mgmt.end_date).toLocaleString()}<br />

            <button onClick={() => handleUpdateManagement(mgmt.id)}>Update</button>
            <button onClick={() => handleDeleteManagement(mgmt.id)}>Delete</button>
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManagementTest;
