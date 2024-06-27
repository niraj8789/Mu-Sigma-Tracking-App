const express = require('express');
const router = express.Router();
const { authorize } = require('daily-form-app\src\components\Middleware\auth.js'); // Adjust the path as necessary

// Example route using the authorize middleware
router.get('/protected-route', authorize(['admin', 'manager']), (req, res) => {
    // Only accessible to users with roles 'admin' or 'manager'
    res.json({ message: 'This route is protected and requires admin or manager role.' });
});

module.exports = router;
