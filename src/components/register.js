// import { readFileSync } from "fs";

// app.post('/register', (req, res) => {
//     const { username, password } = req.body;

//     let users = [];
//     try {
//       const usersData = fs.readFileSync('users.json');
//       users = JSON.parse(usersData);
//     } catch (error) {
//       console.error("Error reading users file:", error);
//     }
  
//     const existingUser = users.find(user => user.username === username);
//     if (existingUser) {
//       return res.status(400).json({ message: "Username already exists" });
//     }
    
  
//  app.post('/api/register',(req,res)=>{
//   const {username,password}=req.body;

//   var users=[['itsniraj4@gmailcom','Niraj@8789']];
  
//  })

//     users.push({ username, password });
  
//     fs.writeFileSync('users.json', JSON.stringify(users));
  
//     res.status(200).json({ message: "Registration successful" });
//   });
  
//   app.post('/login', (req, res) => {
//     const { username, password } = req.body;
  
//     let users = [];
//     try {
//       const usersData = fs.readFileSync('users.json');
//       users = JSON.parse(usersData);
//     } catch (error) {
//       console.error("Error reading users file:", error);
//     }
  
//     const user = users.find(user => user.username === username && user.password === password);
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }
  
//     res.status(200).json({ message: "Login successful" });
//   });
   
  
  