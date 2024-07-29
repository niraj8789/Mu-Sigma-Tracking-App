const express = require('express');
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('./db');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const app = express();
const port = 5000;
const cors = require('cors');
const { authorize } = require('./Middleware/auth');
app.use(cors());
app.use(express.json());
const crypto = require('crypto');
const { Parser } = require('json2csv');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const WebSocket=require('ws');
const http = require('http');

const tokens = {};
const otpStore = {};
const notifications = []; 

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set(); 

const addNotification = (message) => {
  const notification = { message, read: false, timestamp: new Date() };
  notifications.push(notification);

  
  clients.forEach((ws) => {
    ws.send(JSON.stringify(notification));
  });
};

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
  });
});


const markNotificationAsRead = (index) => {
  if (notifications[index]) {
      notifications[index].read = true;
  }
};

app.put('/api/notifications/:index/read', (req, res) => {
  const { index } = req.params;
  markNotificationAsRead(index);
  res.status(200).send('Notification marked as read');
});


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'niraj.sigma2@gmail.com',
    pass: 'vajc ogqi yvjk nlve'
  }
});

const sendDeletionEmail = async (email, name) => {
  console.log(`Attempting to send deletion email to: ${email}`);
  const mailOptions = {
    from: 'Daily Tracker Admin <niraj.sigma2@gmail.com>',
    to: email,
    subject: 'Account Deleted',
    text: `Dear ${name},\n\nYour account has been deleted from Daily Tracker.\n\nIf this was not done internally, please contact your Lead.\n\nBest regards,\nDaily Tracker Team`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Deletion email sent:', info.response);
  } catch (error) {
    console.error('Error sending deletion email:', error);
  }
};



const sendOtpEmail = (email, otp) => {
  const mailOptions = {
    from: 'Daily Tracker Admin <niraj.sigma2@gmail.com>',
    to: email,
    subject: 'Your OTP for Password Reset',
    text: `Your OTP for password reset is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

const generateOtp = () => {
  return crypto.randomBytes(3).toString('hex'); 
};

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(404).send('User not found');
    }

    const otp = generateOtp();
    otpStore[email] = otp;

    const mailOptions = {
      from: 'Daily Tracker Admin <niraj.sigma2@gmail.com>',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send('Error sending OTP');
      }
      res.status(200).send('OTP sent successfully');
    });
    
    // Add notification
    addNotification(`OTP sent to: ${email}`);
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).send('Error sending OTP');
  }
});

const defaultPassword = 'musigma-gdo@123';

const sendWelcomeEmail = (email, password) => {
  const mailOptions = {
    from: 'Daily Tracker Admin <niraj.sigma2@gmail.com>',
    to: email,
    subject: 'Your Account Details',
    text: `Welcome to Daily Tracker!\n\nYour login details are as follows:\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in for the first time.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Welcome email sent:', info.response);
    }
  });
};

app.post('/api/add-user', authorize(['Manager', 'Cluster Lead']), async (req, res) => {
  const { name, email, cluster, clusterLead, role } = req.body;
  if (!name || !email || !cluster || !clusterLead || !role) {
    return res.status(400).send('All fields are required');
  }
  try {
    const pool = await poolPromise;
    const checkUser = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    if (checkUser.recordset.length > 0) {
      return res.status(400).send({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('cluster', sql.NVarChar, cluster)
      .input('clusterLead', sql.NVarChar, clusterLead)
      .input('role', sql.NVarChar, role)
      .input('isDeleted', sql.Bit, 0)
      .query('INSERT INTO Users (name, email, password, cluster, clusterLead, role, isDeleted) VALUES (@name, @email, @password, @cluster, @clusterLead, @role, @isDeleted)');
    
    sendWelcomeEmail(email, defaultPassword);
    addNotification(`New user added: ${name} (${role})`);

    res.status(201).send('User added successfully');
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).send('Error adding user');
  }
});
app.put('/api/users/:email/toggle', authorize(['Manager', 'Cluster Lead']), async (req, res) => {
  const { email } = req.params;

  try {
    const pool = await poolPromise;
    console.log(`Toggling status for user: ${email}`);

    // Fetch user details including name and current status
    const userResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT name, IsDeleted FROM Users WHERE email = @email');

    if (userResult.recordset.length === 0) {
      console.error(`User not found for email: ${email}`);
      return res.status(404).send('User not found');
    }

    const { name, IsDeleted: currentStatus } = userResult.recordset[0];
    const newStatus = currentStatus === true ? false : true;

    // Update the user status
    await pool
      .request()
      .input('email', sql.NVarChar, email)
      .input('IsDeleted', sql.Bit, newStatus)
      .query('UPDATE Users SET IsDeleted = @IsDeleted WHERE email = @email');

    // Verify the update
    const verifyResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT IsDeleted FROM Users WHERE email = @email');

    if (verifyResult.recordset[0].IsDeleted === newStatus) {
      // Add notification
      addNotification(`User ${newStatus === true ? 'deactivated' : 'activated'}: ${email}`);

      // Send email if the user is deactivated
      if (newStatus === true) {
        sendDeletionEmail(email, name); // Send the email if user is deactivated
      }

      res.status(200).send(`User ${newStatus === true ? 'deactivated' : 'activated'} successfully`);
    } else {
      res.status(500).send('Failed to update user status in database');
    }
  } catch (err) {
    console.error('Error toggling user status:', err);
    res.status(500).send('Error toggling user status');
  }
});


app.post('/api/request-password-reset', async (req, res) => {
  const { email } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    if (result.recordset.length === 1) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
      otpStore[email] = otp; // Store OTP
      console.log(`OTP for ${email}: ${otp}`); // Debug log

      // Send OTP to user's email
      sendOtpEmail(email, otp);

      res.status(200).send('OTP sent to email');

      // Add notification
      addNotification(`Password reset requested for: ${email}`);
    } else {
      res.status(404).send('Email not found');
    }
  } catch (err) {
    console.error('Error requesting password reset:', err);
    res.status(500).send('Error requesting password reset');
  }
});

app.post('/api/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    if (otpStore[email] && otpStore[email] === otp) {
      const hashedPassword = await bcrypt.hash(newPassword, 10); 
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input('email', sql.VarChar, email)
        .input('newPassword', sql.NVarChar, hashedPassword) 
        .query('UPDATE Users SET password = @newPassword WHERE email = @email');
      delete otpStore[email];
      res.status(200).send('Password reset successful');

    
      addNotification(`Password reset for: ${user}`);
    } else {
      res.status(400).send('Invalid OTP');
    }
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).send('Error resetting password');
  }
});

app.post('/api/change-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log('Received request for change password:', { email, otp, newPassword });

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).send('All fields are required');
    }

    if (otpStore[email] !== otp) {
      console.error('Invalid OTP:', { email, otp, storedOtp: otpStore[email] });
      return res.status(400).send('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .query('UPDATE Users SET password = @password WHERE email = @email');

    if (result.rowsAffected[0] === 0) {
      console.error('No user found to update password for:', email);
      return res.status(404).send('User not found');
    }

    delete otpStore[email]; 

    res.status(200).send('Password changed successfully');

    
    addNotification(`Password changed for: ${user}`);
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).send('Error changing password');
  }
});


app.post('/api/register', async (req, res) => {
  const { name, email, password, cluster, clusterLead, role } = req.body;
  if (!name || !email || !password || !cluster || !clusterLead || !role) {
    return res.status(400).send('All fields are required');
  }
  try {
    const pool = await poolPromise;
    const checkUser = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    if (checkUser.recordset.length > 0) {
      return res.status(400).send('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('cluster', sql.NVarChar, cluster)
      .input('clusterLead', sql.NVarChar, clusterLead)
      .input('role', sql.NVarChar, role)
      .query('INSERT INTO Users (name, email, password, cluster, clusterLead, role) VALUES (@name, @email, @password, @cluster, @clusterLead, @role)');
    
    addNotification(`User registered: ${name} (${role})`);

    console.log(`User registered with role: ${role}`);
    res.status(201).send('User registered');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user');
  }
});


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email AND IsDeleted = 0');
    if (result.recordset.length === 1) {
      const user = result.recordset[0];
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email, cluster: user.cluster, role: user.role },
          'your_jwt_secret_key',
          { expiresIn: '1h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, cluster: user.cluster, role: user.role } });
      } else {
        res.status(401).json({ error: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send('Error logging in');
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  const { name, date, cluster, resourceType, tasks, assignedTo } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('date', sql.Date, date)
      .input('cluster', sql.NVarChar, cluster)
      .input('resourceType', sql.NVarChar, resourceType)
      .input('assignedTo', sql.NVarChar, assignedTo) 
      .query(`INSERT INTO Task (name, date, cluster, resourceType, assignedTo) OUTPUT INSERTED.id VALUES (@name, @date, @cluster, @resourceType, @assignedTo)`);
    
    const taskId = result.recordset[0].id;
    for (const task of tasks) {
      await pool
        .request()
        .input('task_id', sql.Int, taskId)
        .input('incCr', sql.NVarChar, task.incCr)
        .input('product', sql.NVarChar, task.product)
        .input('taskType', sql.NVarChar, task.taskType)
        .input('taskDescription', sql.NVarChar, task.taskDescription)
        .input('plannerHour', sql.Float, task.plannerHour)
        .query(`INSERT INTO Tasks (task_id, incCr, product, taskType, taskDescription, plannerHour) VALUES (@task_id, @incCr, @product, @taskType, @taskDescription, @plannerHour)`);
    }
    
    
    addNotification(`Task created: ${name}`);

    res.status(201).send('Task created successfully');
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).send('Error creating task');
  }
});

app.get('/api/export-tasks', authorize(['Team Member', 'Cluster Lead', 'Manager']), async (req, res) => {
  try {
    const { email, role, cluster } = req.user;
    console.log('Exporting tasks for user:', email, 'with role:', role, 'in cluster:', cluster);

    const pool = await poolPromise;

    let query = `
      SELECT 
        t.id AS task_id, 
        t.name AS task_name, 
        t.date, 
        t.cluster, 
        t.resourceType, 
        t.assignedTo,
        ts.incCr, 
        ts.product, 
        ts.taskType, 
        ts.taskDescription, 
        ts.plannerHour, 
        ts.actualHour
      FROM Task t
      JOIN Tasks ts ON t.id = ts.task_id
    `;

    if (role === 'Team Member') {
      query += ` WHERE t.assignedTo = @userEmail`;
    } else if (role === 'Cluster Lead') {
      query += ` WHERE t.cluster = @userCluster`;
    }

    const result = await pool
      .request()
      .input('userEmail', sql.NVarChar, email)
      .input('userCluster', sql.NVarChar, cluster)
      .query(query);

    const tasks = result.recordset;

    
    tasks.forEach(task => {
      task.date = moment(task.date).format('YYYY-MM-DD');
    });

    const fields = ['task_id', 'task_name', 'date', 'cluster', 'resourceType', 'assignedTo', 'incCr', 'product', 'taskType', 'taskDescription', 'plannerHour', 'actualHour'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(tasks);

    res.header('Content-Type', 'text/csv');
    res.attachment('tasks.csv');
    res.send(csv);
    
    
    addNotification(`Tasks exported as CSV by ${email}`);
  } catch (err) {
    console.error('Error exporting tasks as CSV:', err);
    res.status(500).send('Error exporting tasks');
  }
});

// Fetch all tasks
// Fetch all tasks
app.get('/api/tasks', authorize(['Manager', 'Cluster Lead', 'Team Member']), async (req, res) => {
  try {
    const { role, cluster, email } = req.user;
    const pool = await poolPromise;

    let query = `
      SELECT 
        t.id AS task_id, 
        t.name AS task_name, 
        t.date, 
        t.cluster, 
        t.resourceType,
        t.assignedTo,
        SUM(ts.plannerHour) AS totalPlannerHour
      FROM Task t
      JOIN Tasks ts ON t.id = ts.task_id
      JOIN Users u ON u.email = t.assignedTo
      WHERE u.IsDeleted = 0
      GROUP BY t.id, t.name, t.date, t.cluster, t.resourceType, t.assignedTo
    `;

    if (role === 'Team Member') {
      query += ` HAVING t.assignedTo = @userEmail`;
    } else if (role === 'Cluster Lead') {
      query += ` HAVING t.cluster = @userCluster`;
    }

    const result = await pool
      .request()
      .input('userEmail', sql.NVarChar, email)
      .input('userCluster', sql.NVarChar, cluster)
      .query(query);

    const tasks = result.recordset.map(row => ({
      id: row.task_id,
      name: row.task_name,
      date: row.date,
      cluster: row.cluster,
      resourceType: row.resourceType,
      assignedTo: row.assignedTo,
      totalPlannerHour: row.totalPlannerHour
    }));

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).send('Error fetching tasks');
  }
});

// Fetch a single task by ID
app.get('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const taskResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Task WHERE id = @id');
    const taskEntriesResult = await pool
      .request()
      .input('task_id', sql.Int, id)
      .query('SELECT * FROM Tasks WHERE task_id = @task_id');
    if (taskResult.recordset.length > 0) {
      const task = taskResult.recordset[0];
      task.entries = taskEntriesResult.recordset;
      res.json(task);
      
    
      // addNotification(`Task details fetched for task ID: ${id}`);
    } else {
      res.status(404).send('Task not found');
    }
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).send('Error fetching task');
  }
});

// Update a task's actual hours
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { actualHour, completed } = req.body;

  if (actualHour === undefined || isNaN(actualHour)) {
      return res.status(400).send('Invalid actual hour value');
  }

  try {
      const pool = await poolPromise;
      const result = await pool
          .request()
          .input('id', sql.Int, id)
          .input('actualHour', sql.Float, actualHour)
          .input('completed', sql.Bit, completed)
          .query('UPDATE Tasks SET actualHour = @actualHour, completed = @completed WHERE id = @id');

      if (result.rowsAffected[0] === 0) {
          return res.status(404).send('Task not found');
      }

      addNotification(`Actual hours and completion status updated for task ID: ${id}`);

      return res.status(200).send('Task updated successfully');
  } catch (err) {
      console.error('Error updating task:', err);
      return res.status(500).send('Error updating task');
  }
});

// Fetch weekly statistics with filters
app.get('/api/stats/weekly', async (req, res) => {
  const { startDate, endDate, task, sortBy } = req.query;
  try {
    const pool = await poolPromise;

    let query = `
      SELECT
        t.name,
        SUM(ts.plannerHour) AS totalPlannerHour,
        SUM(ts.actualHour) AS totalActualHour
      FROM Task t
      JOIN Tasks ts ON t.id = ts.task_id
      JOIN Users u ON t.assignedTo = u.email
      WHERE u.IsDeleted = 0
    `;

    if (startDate && endDate) {
      query += ` AND t.date BETWEEN @startDate AND @endDate`;
    }

    if (task && task !== 'All') {
      const tasks = task.split(',').map(t => `'${t}'`).join(',');
      query += ` AND ts.taskType IN (${tasks})`;
    }

    query += ` GROUP BY t.name`;

    if (sortBy) {
      if (sortBy === 'planned') {
        query += ` ORDER BY SUM(ts.plannerHour) DESC`;
      } else if (sortBy === 'actual') {
        query += ` ORDER BY SUM(ts.actualHour) DESC`;
      } else if (sortBy === 'name') {
        query += ` ORDER BY t.name`;
      }
    }

    const result = await pool
      .request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(query);

    res.json(result.recordset);

    // addNotification(`Weekly stats fetched for ${startDate} to ${endDate}`);
  } catch (err) {
    console.error('Error fetching weekly statistics:', err);
    res.status(500).send('Error fetching weekly statistics');
  }
});

// Fetch monthly statistics with filters
app.get('/api/stats/monthly', async (req, res) => {
  const { startDate, endDate, role, task } = req.query;
  try {
    const pool = await poolPromise;

    let query = `
      SELECT
        t.name,
        SUM(ts.plannerHour) AS totalPlannerHour,
        SUM(ts.actualHour) AS totalActualHour,
        u.role
      FROM Task t
      JOIN Tasks ts ON t.id = ts.task_id
      JOIN Users u ON u.email = t.assignedTo
      WHERE 1 = 1
    `;

    if (startDate && endDate) {
      query += ` AND t.date BETWEEN @startDate AND @endDate`;
    }

    if (role && role !== 'All') {
      query += ` AND u.role = @role`;
    }

    if (task && task !== 'All') {
      query += ` AND ts.taskType = @task`;
    }

    query += ` GROUP BY t.name, u.role`;

    const result = await pool
      .request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .input('role', sql.NVarChar, role)
      .input('task', sql.NVarChar, task)
      .query(query);

    res.json(result.recordset);
    
    
    // addNotification(`Monthly stats fetched for ${startDate} to ${endDate}`);
  } catch (err) {
    console.error('Error fetching monthly statistics:', err);
    res.status(500).send('Error fetching monthly statistics');
  }
});

app.get('/api/stats/clusters', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        t.cluster,
        SUM(ts.plannerHour) AS totalPlannerHour
      FROM Task t
      JOIN Tasks ts ON t.id = ts.task_id
      JOIN Users u ON t.assignedTo = u.email
      WHERE u.IsDeleted = 0
      GROUP BY t.cluster
      ORDER BY totalPlannerHour DESC
    `);
    res.json(result.recordset);

    // addNotification(`Cluster utilization stats fetched`);
  } catch (err) {
    console.error('Error fetching cluster utilization:', err);
    res.status(500).send('Error fetching cluster utilization');
  }
});

// Cron job to check for missing tasks and send alert emails
cron.schedule('0 14 * * 1-5', async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT u.email, u.name, u.cluster,
             (SELECT TOP 1 email FROM Users WHERE role = 'Manager') AS managerEmail,
             (SELECT TOP 1 email FROM Users WHERE role = 'Cluster Lead' AND cluster = u.cluster) AS clusterLeadEmail
      FROM Users u
      LEFT JOIN Task t ON u.email = t.assignedTo AND CAST(t.date AS DATE) = CAST(GETDATE() AS DATE)
      WHERE t.id IS NULL AND u.role = 'Team Member' AND u.IsDeleted = 0
    `);
    const missingTasksUsers = result.recordset;

    for (const user of missingTasksUsers) {
      const mailOptions = {
        from: 'Daily Tracker Admin <niraj.sigma2@gmail.com>',
        to: user.email,
        cc: [user.managerEmail, user.clusterLeadEmail].filter(Boolean).join(', '),
        subject: 'Daily Task Reminder',
        text: `Hi ${user.name},\n\nYou have not submitted your Daily Task records. Please don't forget to fill it before 6 PM.\n\nThanks`
      };

      await transporter.sendMail(mailOptions);
      console.log(`Reminder email sent to: ${user.email}`);
    }

    if (missingTasksUsers.length === 0) {
      console.log('All users have submitted their tasks for today.');
    }
  } catch (err) {
    console.error('Error checking for missing tasks:', err);
  }
});



app.get('/api/users/:email', authorize(['Manager', 'Cluster Lead']), async (req, res) => {
  const { email } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id, name, email, cluster, role FROM Users WHERE email = @email AND IsDeleted = 0');
    if (result.recordset.length === 0) {
      return res.status(404).send('User not found');
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).send('Error fetching user');
  }
});
// New endpoint to fetch all users
app.get('/api/users', authorize(['Manager']), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query('SELECT id, name, email, cluster,clusterLead,role, IsDeleted FROM Users');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Error fetching users');
  }
});

// Update Cluster Lead
app.put('/api/users/:id/clusterLead', authorize(['Manager', 'Cluster Lead']), async (req, res) => {
  const { id } = req.params;
  const { clusterLead } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('clusterLead', sql.NVarChar, clusterLead)
      .query('UPDATE Users SET clusterLead = @clusterLead WHERE id = @id');
      
    res.send('Cluster lead updated successfully');

    addNotification(`Cluster lead updated for user ID: ${id}`);
  } catch (err) {
    console.error('Error updating cluster lead:', err);
    res.status(500).send('Error updating cluster lead');
  }
});




app.put('/api/users/:id/role', authorize(['Manager']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('role', sql.NVarChar, role)
      .query('UPDATE Users SET role = @role WHERE id = @id');
    res.send('User role updated successfully');

   
    addNotification(`User role updated for user ID: ${id}`);
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).send('Error updating role');
  }
});

// Fetch tasks by cluster
app.get('/api/stats/tasks', async (req, res) => {
  const { cluster } = req.query;
  try {
    const pool = await poolPromise;

    const query = `
      SELECT
        ts.taskType,
        SUM(ts.plannerHour) AS totalPlannerHour
      FROM Task t
      JOIN Tasks ts ON t.id = ts.task_id
      WHERE t.cluster = @cluster
      GROUP BY ts.taskType
      ORDER BY totalPlannerHour DESC
    `;

    const result = await pool
      .request()
      .input('cluster', sql.NVarChar, cluster)
      .query(query);

    res.json(result.recordset);
    
   
    // addNotification(`Tasks fetched by cluster: ${cluster}`);
  } catch (err) {
    console.error('Error fetching tasks by cluster:', err);
    res.status(500).send('Error fetching tasks by cluster');
  }
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
