// src/components/OsaTest.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addOsa, getOsas, updateOsa, deleteOsa } from "../../services/osaService.ts";

const OsaTest = () => {
  const [osas, setOsas] = useState([]);
  const [osaData, setOsaData] = useState({
    osa_id: "",
    first_name: "",
    last_name: "",
    mother_maiden: "",
    user_id: "",
    birthdate: new Date(),
    date_started: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      const data = await getOsas(); 
      setOsas(data);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOsaData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setOsaData((prev) => ({ ...prev, [name]: date }));
  };

  const handleAdd = async () => {
    await addOsa(osaData);
    const updated = await getOsas();
    setOsas(updated);
  };

  const handleUpdate = async (id) => {
    await updateOsa(id, osaData);
    const refreshed = await getOsas();
    setOsas(refreshed);
  };

  const handleDelete = async (id) => {
    await deleteOsa(id);
    const refreshed = await getOsas();
    setOsas(refreshed);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>OSA CRUD Test (with Date Pickers)</h2>
      <input name="osa_id" placeholder="OSA ID" value={osaData.osa_id} onChange={handleChange} />
      <input name="first_name" placeholder="First Name" value={osaData.first_name} onChange={handleChange} />
      <input name="last_name" placeholder="Last Name" value={osaData.last_name} onChange={handleChange} />
      <input name="mother_maiden" placeholder="Mother's Maiden Name" value={osaData.mother_maiden} onChange={handleChange} />
      <input name="user_id" placeholder="User ID" value={osaData.user_id} onChange={handleChange} />

      <div>
        <label>Birthdate:</label>
        <DatePicker
          selected={osaData.birthdate}
          onChange={(date) => handleDateChange("birthdate", date)}
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <div>
        <label>Date Started:</label>
        <DatePicker
          selected={osaData.date_started}
          onChange={(date) => handleDateChange("date_started", date)}
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <button onClick={handleAdd}>Add OSA</button>

      <ul>
        {osas.map((osa) => (
          <li key={osa.id}>
            {osa.first_name} {osa.last_name} - {osa.osa_id}
            <button onClick={() => handleUpdate(osa.id)}>Update</button>
            <button onClick={() => handleDelete(osa.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OsaTest;
