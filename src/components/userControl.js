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
  const [editMode, setEditMode] = useState(null); // Track which user is being edited
  const [editClusterLead, setEditClusterLead] = useState(''); // Track the cluster lead being edited
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

  // Handle editing "Reports To" (Cluster Lead)
  const handleEditClusterLead = (userId, clusterLead) => {
    setEditMode(userId);
    setEditClusterLead(clusterLead);
  };

  // Handle saving the updated "Reports To"
  const handleSaveClusterLead = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:5000/api/users/${userId}/clusterLead`, { clusterLead: editClusterLead }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, clusterLead: editClusterLead } : user
        )
      );
      setEditMode(null);
      setEditClusterLead('');
    } catch (error) {
      console.error('Error updating cluster lead:', error);
      setError('Error updating cluster lead');
    }
  };

  return (
    <div className="user-control">
      <h2 className="user-control-heading">User Control Panel</h2>
      {user.role === 'Manager' && (
        <button className="add-user-btn" onClick={() => setShowAddForm(!showAddForm)}>
          Add User
        </button>
      )}
      {showAddForm && (
        <form className="add-user-form" onSubmit={handleAddUser}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cluster">Cluster</label>
            <input
              type="text"
              id="cluster"
              value={newUser.cluster}
              onChange={(e) => setNewUser({ ...newUser, cluster: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="clusterLead">Reports To</label>
            <input
              type="text"
              id="clusterLead"
              value={newUser.clusterLead}
              onChange={(e) => setNewUser({ ...newUser, clusterLead: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="form-control"
              required
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-submit">
            Add User
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Cluster</th>
            <th>Reports To</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={user.IsDeleted ? 'deactivated' : ''}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.cluster}</td>
              <td>
                {editMode === user.id ? (
                  <>
                    <input
                      type="text"
                      value={editClusterLead}
                      onChange={(e) => setEditClusterLead(e.target.value)}
                      className="edit-cluster-input"
                    />
                    <button className="save-btn" onClick={() => handleSaveClusterLead(user.id)}>
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    {user.clusterLead}
                    <span
                      className="edit-icon"
                      onClick={() => handleEditClusterLead(user.id, user.clusterLead)}
                    >
                      ✏️
                    </span>
                  </>
                )}
              </td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="form-control"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={!user.IsDeleted}
                    onChange={() => handleToggleStatus(user.email)}
                  />
                  <span className="toggle-switch-slider"></span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserControl;
