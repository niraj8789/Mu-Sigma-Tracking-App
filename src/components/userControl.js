import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './UserControl.css';

function UserControl() {
  const { user } = useAuth(); // Get user from AuthContext
  const [users, setUsers] = useState([]);
  const [roles] = useState(['Team Member', 'Cluster Lead', 'Manager']); // Immutable roles
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false); // State to toggle the add user form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    cluster: '',
    clusterLead: '',
    role: 'Team Member'
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Get the token from localStorage
        const response = await axios.get('http://localhost:5000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      await axios.put(
        `http://localhost:5000/api/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Error updating role');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken'); // Get the token from localStorage
      await axios.post('http://localhost:5000/api/add-user', newUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers((prevUsers) => [...prevUsers, newUser]);
      setShowAddForm(false);
      setNewUser({
        name: '',
        email: '',
        cluster: '',
        clusterLead: '',
        role: 'Team Member',
      });
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Error adding user');
    }
  };

  const handleDelete = async (userEmail) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this user? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('authToken'); // Get the token from localStorage
      await axios.delete(`http://localhost:5000/api/users/${userEmail}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user.email !== userEmail));
      alert('User and associated tasks deleted successfully.');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user');
    }
  };

  return (
    <div className="user-control">
      <h1 className="user-control-heading">User Management</h1>
      {error && <div className="error">{error}</div>}
      {user.role === 'Manager' || user.role === 'Cluster Lead' ? (
        <>
          <button className="add-user-btn" onClick={() => setShowAddForm(!showAddForm)}>
            +
          </button>
          {showAddForm && (
            <form onSubmit={handleAddUser} className="add-user-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="text"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Cluster:</label>
                <input
                  type="text"
                  value={newUser.cluster}
                  onChange={(e) => setNewUser({ ...newUser, cluster: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Cluster Lead:</label>
                <input
                  type="text"
                  value={newUser.clusterLead}
                  onChange={(e) => setNewUser({ ...newUser, clusterLead: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-control"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <p>Note: The default password will be "musigma-gdo@123". An email will be sent to the user with the login details.</p>
              <button type="submit" className="btn-submit">
                Add User
              </button>
            </form>
          )}
        </>
      ) : null}
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
              <td>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(user.email)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserControl;
