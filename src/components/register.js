// Registration route
app.post('/register', (req, res) => {
    const { username, password } = req.body;
  
    // Read existing data from JSON file
    let users = [];
    try {
      const usersData = fs.readFileSync('users.json');
      users = JSON.parse(usersData);
    } catch (error) {
      console.error("Error reading users file:", error);
    }
  
    // Check if user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
  
    // Add new user
    users.push({ username, password });
  
    // Write updated data back to JSON file
    fs.writeFileSync('users.json', JSON.stringify(users));
  
    res.status(200).json({ message: "Registration successful" });
  });
  
  // Login route
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Read user data from JSON file
    let users = [];
    try {
      const usersData = fs.readFileSync('users.json');
      users = JSON.parse(usersData);
    } catch (error) {
      console.error("Error reading users file:", error);
    }
  
    // Find user by username and password
    const user = users.find(user => user.username === username && user.password === password);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  
    res.status(200).json({ message: "Login successful" });
  });
  