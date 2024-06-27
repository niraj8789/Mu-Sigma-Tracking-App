const jwt = require('jsonwebtoken');

const authorize = (roles) => {
    return (req, res, next) => {
        const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access denied, no token provided' });
        }

        try {
            const decoded = jwt.verify(token, 'your_jwt_secret_key');
            req.user = decoded;

            console.log(`User role: ${req.user.role}`); // Debug log
            console.log(`Required roles: ${roles}`); // Debug log

            if (roles && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Access denied, insufficient permissions' });
            }

            next();
        } catch (err) {
            console.error('Authorization error:', err);
            res.status(401).json({ message: 'Invalid token' });
        }
    };
};

module.exports = { authorize };
