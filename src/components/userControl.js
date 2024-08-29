import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion'; // Import Framer Motion for animations
import './UserControl.css';

function UserControl() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roles] = useState(['Team Member', 'Cluster Lead', 'Manager']);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    cluster: '',
    clusterLead: '',
    role: 'Team Member',
  });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [editMode, setEditMode] = useState(null);
  const [editClusterLead, setEditClusterLead] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('You are not Authorized', error);
  
        // Check if the error is due to authorization
        if (!toast.isActive('auth-error')) {
          setError('You are not Authorized');
          toast.error('You are not Authorized', { toastId: 'auth-error' });
        }
      }
    };
  
    fetchUsers();
  }, []);
  

  useEffect(() => {
    setFilteredUsers(
      users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
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
      toast.success('User added successfully');
    } catch (error) {
      if (
        error.response &&
        error.response.data.message === 'Email already exists'
      ) {
        toast.error('User with this email already exists.');
      } else {
        console.error('Error adding user:', error);
        setError('Error adding user');
        toast.error('Error adding user');
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `http://localhost:5000/api/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Error updating role');
      toast.error('Error updating role');
    }
  };

  const handleToggleStatus = async (userEmail, isDeleted) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `http://localhost:5000/api/users/${userEmail}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const response = await axios.get('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setUsers(response.data);
      const statusMessage = isDeleted ? 'User activated' : 'User Deactivated';
      toast.success(statusMessage);
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
      await axios.put(
        `http://localhost:5000/api/users/${userId}/clusterLead`,
        { clusterLead: editClusterLead },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, clusterLead: editClusterLead } : user
        )
      );
      setEditMode(null);
      setEditClusterLead('');
      toast.success('Cluster lead updated successfully');
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 50,
        delayChildren: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="user-control"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="user-control-heading">User Control Panel</h2>
      {user.role === 'Manager' && (
        <motion.button
          className="add-user-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
        >
          Add User
        </motion.button>
      )}
      <input
        type="text"
        placeholder="Search by name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />
      {showAddForm && (
        <motion.div
          className="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="modal-content"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="close-btn" onClick={() => setShowAddForm(false)}>
              &times;
            </span>
            <h2>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cluster">Cluster</label>
                <input
                  type="text"
                  id="cluster"
                  value={newUser.cluster}
                  onChange={(e) =>
                    setNewUser({ ...newUser, cluster: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="clusterLead">Reports To</label>
                <input
                  type="text"
                  id="clusterLead"
                  value={newUser.clusterLead}
                  onChange={(e) =>
                    setNewUser({ ...newUser, clusterLead: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
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
          </motion.div>
        </motion.div>
      )}
      {error && <p className="error">{error}</p>}
      <motion.table 
        className="user-table" 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>
              Name{' '}
              {sortConfig.key === 'name' &&
                (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('email')}>
              Email{' '}
              {sortConfig.key === 'email' &&
                (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('cluster')}>
              Cluster{' '}
              {sortConfig.key === 'cluster' &&
                (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th>Reports To</th>
            <th onClick={() => handleSort('role')}>
              Role{' '}
              {sortConfig.key === 'role' &&
                (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <motion.tbody>
          {filteredUsers.map((user) => (
            <motion.tr 
              key={user.id} 
              className={user.IsDeleted ? 'deactivated' : ''} 
              variants={itemVariants}
            >
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
                    <button
                      className="save-btn"
                      onClick={() => handleSaveClusterLead(user.id)}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    {user.clusterLead}
                    <span
                      className="edit-icon"
                      onClick={() =>
                        handleEditClusterLead(user.id, user.clusterLead)
                      }
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
            </motion.tr>
          ))}
        </motion.tbody>
      </motion.table>
      <ToastContainer />
    </motion.div>
  );
}

export default UserControl;
