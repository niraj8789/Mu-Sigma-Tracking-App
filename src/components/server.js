require('dotenv').config();
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron'); 
const app = express();
const PORT = 5000;

async function sendReminderEmail(email) {
  try {
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASSWORD
    //   }
    // });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      port: 465,
      host: "smtp.gmail.com"
  })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reminder: Add your daily tasks',
      text: 'Don\'t forget to add your daily tasks for today!'
    };

    await transporter.sendMail(mailOptions);
    console.log('Reminder email sent to:', email);
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
}

cron.schedule('51 11 * * *', async () => { 
  try {
    console.log('Checking for users without tasks...');
    const users = JSON.parse(fs.readFileSync('users.json'));

    const tasks = JSON.parse(localStorage.getItem('taskDescription'));
    for (const user of users) {
      const userTasks = tasks[user.id];
      if (!userTasks || userTasks.length === 0) {
        await sendReminderEmail(user.email);
      }
    }
  } catch (error) {
    console.error('Error checking tasks or sending reminder emails:', error);
  }
});


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.get('/', (req, res) => {
  res.send('Welcome to the server!');
});

app.post('/api/register', (req, res) => {
  try {
    const userData = req.body;
    const users = JSON.parse(fs.readFileSync('users.json'));
    users.push(userData);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync('users.json'));
  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ success: true, user });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});