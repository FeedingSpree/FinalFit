// src/components/UserTest.jsx
import React, { useEffect, useState } from "react";
import { addUser, getUsers, updateUser, deleteUser } from "../../services/userService.ts";

const UserTest = () => {
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    loa: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    await addUser(userData);
    const updated = await getUsers();
    setUsers(updated);
  }; 

  const handleUpdateUser = async (id) => {
    const updatedUser = { ...userData, first_name: "Updated" }; // Just an example, modify as needed
    await updateUser(id, updatedUser);
    const updated = await getUsers();
    setUsers(updated);
  };

  const handleDeleteUser = async (id) => {
    await deleteUser(id);
    const updated = await getUsers();
    setUsers(updated);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>User List</h2>
      <div>
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={userData.first_name}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={userData.last_name}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={userData.username}
          onChange={handleInputChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={userData.password}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="loa"
          placeholder="LOA"
          value={userData.loa}
          onChange={handleInputChange}
        />
        <button onClick={handleAddUser}>Add Sample User</button>
      </div>

      <ul>
        {users.map((user, i) => (
          <li key={i}>
            {user.first_name} {user.last_name} — {user.username}{" "}
            <button onClick={() => handleUpdateUser(user.id)}>Update</button>
            <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserTest;
