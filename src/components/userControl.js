import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './UserControl.css';

function UserControl() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles] = useState(['Team Member', 'Cluster Lead', 'Manager']);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    cluster: '',
    clusterLead: '',
    role: 'Team Member'
  });

  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken');
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

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('authToken');
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

  // Handle user addition
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      await axios.post('http://localhost:5000/api/add-user', newUser, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers((prevUsers) => [...prevUsers, newUser]);
      setShowAddForm(false);
      setNewUser({
        name: '',
        email: '',
        cluster: '',
        clusterLead: '',
        role: 'Team Member'
      });
    } catch (error) {
      if (error.response && error.response.data.message === 'Email already exists') {
        alert('User with this email already exists.');
      } else {
        console.error('Error adding user:', error);
        setError('Error adding user');
      }
    }
  };

  // Handle user activation/deactivation
  const handleToggleStatus = async (userEmail) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:5000/api/users/${userEmail}/toggle`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Fetch users again to reflect the updated status
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Error toggling user status');
    }
  };
  

  return (
    <div className="user-control">
      <h1 className="user-control-heading">User Management</h1>
      {error && <div className="error">{error}</div>}
      {user.role === 'Manager' || user.role === 'Cluster Lead' ? (
        <button className="add-user-btn" onClick={() => setShowAddForm(!showAddForm)}>
          +
        </button>
      ) : null}
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
          {error && <div className="error">{error}</div>}
        </form>
      )}
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Cluster</th>
            <th>Role</th>
            <th>Change Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={user.IsDeleted ? 'deactivated' : ''}>
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
              <td>{user.IsDeleted ? 'Deactivated' : 'Active'}</td>
              <td>
                <button
                  className="toggle-status-button"
                  onClick={() => handleToggleStatus(user.email)}
                >
                  {user.IsDeleted ? 'Activate' : 'Deactivate'}
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
