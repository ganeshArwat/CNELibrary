import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const apiUrl = "http://localhost:5000/users"; // json-server endpoint

  // Load users from JSON server
  const fetchUsers = () => {
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add new user
  const handleAddUser = () => {
    if (!name || !email) return;

    const newUser = { name, email };

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers([...users, data]);
        setName("");
        setEmail("");
      })
      .catch((err) => console.error(err));
  };

  // Delete user
  const handleDelete = (id) => {
    fetch(`${apiUrl}/${id}`, {
      method: "DELETE",
    })
      .then(() => {
        setUsers(users.filter((u) => u.id !== id));
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">User Management</h2>

      {/* Add User Form */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Name"
          className="flex-1 p-2 border rounded-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="flex-1 p-2 border rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="primary" onClick={handleAddUser}>
          Add
        </Button>
      </div>

      {/* Users Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{user.id}</td>
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2 flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(user.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
