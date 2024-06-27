import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './UserControl.css';

function UserControl() {
  const { user } = useAuth(); // Get user from AuthContext
  const [users, setUsers] = useState([]);
  const [roles] = useState(['Team Member', 'Cluster Lead', 'Manager']); // Immutable roles
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Get the token from localStorage
        const response = await axios.get('http://localhost:5000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('You are not Authorized', error);
        setError('You are not Authorized');
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('authToken'); // Get the token from localStorage
      await axios.put(`http://localhost:5000/api/users/${userId}/role`, { role: newRole }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Error updating role');
    }
  };

  return (
    <div className="user-control">
      <h1 className="user-control-heading">User Management</h1>
      {error && <div className="error">{error}</div>}
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Cluster</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.cluster}</td>
              <td>{user.role}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserControl;
