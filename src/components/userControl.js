import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './UserControl.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

function UserControl() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roles] = useState(['Team Member', 'Cluster Lead', 'Manager']);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [editClusterLead, setEditClusterLead] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    cluster: '',
    clusterLead: '',
    role: 'Team Member'
  });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [activityLogs, setActivityLogs] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('You are not Authorized', error);
        setError('You are not Authorized');
        toast.error('You are not Authorized');
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    setFilteredUsers(
      users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

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
      toast.success('Role updated successfully');
      logActivity(`Role updated for user ${userId} to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Error updating role');
      toast.error('Error updating role');
    }
  };

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
      toast.success('User added successfully');
      logActivity(`User added: ${newUser.email}`);
    } catch (error) {
      if (error.response && error.response.data.message === 'Email already exists') {
        toast.error('User with this email already exists.');
      } else {
        console.error('Error adding user:', error);
        setError('Error adding user');
        toast.error('Error adding user');
      }
    }
  };

  const handleToggleStatus = async (userEmail, isDeleted) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:5000/api/users/${userEmail}/toggle`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const response = await axios.get('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
      const statusMessage = isDeleted ? 'User activated' : 'User Deactivated';
      toast.success(statusMessage);
      logActivity(`${statusMessage}: ${userEmail}`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Error toggling user status');
      toast.error('Error toggling user status');
    }
  };

  const handleEditClusterLead = (userId, clusterLead) => {
    setEditMode(userId);
    setEditClusterLead(clusterLead);
  };

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
      toast.success('Cluster lead updated successfully');
      logActivity(`Cluster lead updated for user ${userId} to ${editClusterLead}`);
    } catch (error) {
      console.error('Error updating cluster lead:', error);
      setError('Error updating cluster lead');
      toast.error('Error updating cluster lead');
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    setFilteredUsers((prevUsers) =>
      [...prevUsers].sort((a, b) => {
        if (a[key] < b[key]) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return direction === 'ascending' ? 1 : -1;
        }
        return 0;
      })
    );
  };

  const logActivity = (message) => {
    setActivityLogs((prevLogs) => [
      ...prevLogs,
      { timestamp: new Date().toISOString(), message }
    ]);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const formatDate = (date) => format(new Date(date), 'PPpp');

  return (
    <div className="user-control">
      <h2 className="user-control-heading">User Control Panel</h2>
      {user.role === 'Manager' && (
        <button className="add-user-btn" onClick={() => setShowAddForm(!showAddForm)}>
          Add User
        </button>
      )}
      <input
        type="text"
        placeholder="Search by name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />
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
            <th onClick={() => handleSort('name')}>
              Name {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('email')}>
              Email {sortConfig.key === 'email' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('cluster')}>
              Cluster {sortConfig.key === 'cluster' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th>Reports To</th>
            <th onClick={() => handleSort('role')}>
              Role {sortConfig.key === 'role' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
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
                    onChange={() => handleToggleStatus(user.email, user.IsDeleted)}
                  />
                  <span className="toggle-switch-slider"></span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ToastContainer />
    </div>
  );
}

export default UserControl;
