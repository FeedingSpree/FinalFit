// src/components/SohasTest.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addSohas, getSohas, updateSohas, deleteSohas } from "../../services/sohasService.ts";

const SohasTest = () => {
  const [sohas, setSohas] = useState([]);
  const [sohasData, setSohasData] = useState({
    sohas_id: "",
    first_name: "",
    last_name: "",
    user_id: "",
    birthdate: new Date(),
    date_started: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      const data = await getSohas();
      setSohas(data);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSohasData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setSohasData((prev) => ({ ...prev, [name]: date }));
  };

  const handleAdd = async () => {
    await addSohas(sohasData);
    const updated = await getSohas();
    setSohas(updated);
  };

  const handleUpdate = async (id) => {
    await updateSohas(id, sohasData);
    const refreshed = await getSohas();
    setSohas(refreshed);
  };

  const handleDelete = async (id) => {
    await deleteSohas(id);
    const refreshed = await getSohas();
    setSohas(refreshed);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>SOHAS CRUD Test</h2>
      <input name="sohas_id" placeholder="SOHAS ID" value={sohasData.sohas_id} onChange={handleChange} />
      <input name="first_name" placeholder="First Name" value={sohasData.first_name} onChange={handleChange} />
      <input name="last_name" placeholder="Last Name" value={sohasData.last_name} onChange={handleChange} />
      <input name="user_id" placeholder="User ID" value={sohasData.user_id} onChange={handleChange} />

      <div>
        <label>Birthdate:</label>
        <DatePicker
          selected={sohasData.birthdate}
          onChange={(date) => handleDateChange("birthdate", date)}
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <div>
        <label>Date Started:</label>
        <DatePicker
          selected={sohasData.date_started}
          onChange={(date) => handleDateChange("date_started", date)}
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <button onClick={handleAdd}>Add SOHAS</button>

      <ul>
        {sohas.map((s) => (
          <li key={s.id}>
            {s.first_name} {s.last_name} — {s.sohas_id}
            <button onClick={() => handleUpdate(s.id)}>Update</button>
            <button onClick={() => handleDelete(s.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SohasTest;
