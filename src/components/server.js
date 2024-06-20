const express = require('express');
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('./db');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const app = express();
const port = 5000;
const cors = require('cors');
app.use(cors());
app.use(express.json());

// Email service configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'niraj.sigma2@gmail.com',
    pass: 'zlvt rqiy njlj szgp'
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Register a new user
app.post('/api/register', async (req, res) => {
  const { name, email, password, cluster, clusterLead } = req.body;
  if (!name || !email || !password || !cluster || !clusterLead) {
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
      .query('INSERT INTO Users (name, email, password, cluster, clusterLead) VALUES (@name, @email, @password, @cluster, @clusterLead)');
    res.status(201).send('User registered');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user');
  }
});

// Log in a user
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    if (result.recordset.length === 1) {
      const user = result.recordset[0];
      if (await bcrypt.compare(password, user.password)) {
        res.json({ user });
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
  const { name, date, cluster, resourceType, tasks } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('date', sql.Date, date)
      .input('cluster', sql.NVarChar, cluster)
      .input('resourceType', sql.NVarChar, resourceType)
      .query(`INSERT INTO Task (name, date, cluster, resourceType)
              OUTPUT INSERTED.id
              VALUES (@name, @date, @cluster, @resourceType)`);
    const taskId = result.recordset[0].id;
    for (const task of tasks) {
      await pool
        .request()
        .input('task_id', sql.Int, taskId)
        .input('incCr', sql.NVarChar, task.incCr)
        .input('product', sql.NVarChar, task.product)
        .input('taskType', sql.NVarChar, task.taskType)
        .input('taskDescription', sql.NVarChar, task.taskDescription)
        .input('actualHour', sql.Float, task.actualHour)
        .input('plannerHour', sql.Float, task.plannerHour)
        .query(`INSERT INTO Tasks (task_id, incCr, product, taskType, taskDescription, actualHour, plannerHour)
                VALUES (@task_id, @incCr, @product, @taskType, @taskDescription, @actualHour, @plannerHour)`);
    }
    res.status(201).send('Task created successfully');
  } catch (err) {
    console.error('Error submitting task:', err);
    res.status(500).send('Error submitting task');
  }
});

// Fetch all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`SELECT 
                t.id AS task_id, 
                t.name AS task_name, 
                t.date, 
                t.cluster, 
                t.resourceType,
                te.incCr,
                te.product,
                te.taskType,
                te.taskDescription,
                te.actualHour,
                te.plannerHour
              FROM Task t
              LEFT JOIN Tasks te ON t.id = te.task_id`);
    const tasks = {};
    result.recordset.forEach(row => {
      if (!tasks[row.task_id]) {
        tasks[row.task_id] = {
          id: row.task_id,
          name: row.task_name,
          date: row.date,
          cluster: row.cluster,
          resourceType: row.resourceType,
          tasks: []
        };
      }
      tasks[row.task_id].tasks.push({
        incCr: row.incCr,
        product: row.product,
        taskType: row.taskType,
        taskDescription: row.taskDescription,
        actualHour: row.actualHour,
        plannerHour: row.plannerHour
      });
    });
    const taskList = Object.values(tasks);
    res.json(taskList);
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
  let { id } = req.params;
  const { actualHour } = req.body;

  // Validate actualHour
  if (actualHour === undefined || isNaN(actualHour)) {
    return res.status(400).send('Invalid actual hour value');
  }

  // Convert id to number
  id = parseInt(id, 10);

  // Validate id
  if (isNaN(id)) {
    return res.status(400).send('Invalid task ID');
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('actualHour', sql.Float, actualHour)
      .query('UPDATE Tasks SET actualHour = @actualHour WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).send('Task not found');
    }
    return res.status(200).send('Task updated successfully');
  } catch (err) {
    console.error('Error updating task:', err);
    return res.status(500).send('Error updating task');
  }
});

// Fetch weekly statistics
app.get('/api/stats/weekly', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        t.name,
        SUM(ts.plannerHour) AS totalPlannerHour,
        SUM(ts.actualHour) AS totalActualHour
      FROM Task t
      JOIN Tasks ts ON t.id = ts.task_id
      WHERE t.date >= DATEADD(day, -7, GETDATE())
      GROUP BY t.name
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching weekly statistics:', err);
    res.status(500).send('Error fetching weekly statistics');
  }
});

// Fetch monthly statistics
app.get('/api/stats/monthly', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        t.name,
        SUM(ts.plannerHour) AS totalPlannerHour,
        SUM(ts.actualHour) AS totalActualHour
      FROM Task t
      JOIN Tasks ts ON t.id = ts.task_id
      WHERE MONTH(t.date) = MONTH(GETDATE()) AND YEAR(t.date) = YEAR(GETDATE())
      GROUP BY t.name
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching monthly statistics:', err);
    res.status(500).send('Error fetching monthly statistics');
  }
});

// Cron job to check for missing tasks and send alert emails
cron.schedule('55 16 * * *', async () => {  // Runs every day at 4:34 PM IST
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT u.email, u.name
      FROM Users u
      LEFT JOIN Task t ON u.id = t.id AND t.date = CAST(GETDATE() AS DATE)
      WHERE t.id IS NULL
    `);
    const missingTasksUsers = result.recordset;

    for (const user of missingTasksUsers) {
      // Email options
      const mailOptions = {
        from: 'Daily Tracker Admin <niraj.sigma2@gmail.com>',
        to: user.email,
        cc: 'itsniraj4@gmail.com',
        subject: 'Daily Task Reminder',
        text: `Hi ${user.name},\n\nYou have not submitted your Daily Task records. Please don't forget to fill it before 9 PM.\n\nThanks`
      };

      // Send email
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
