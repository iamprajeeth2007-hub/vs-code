const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateStudent = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    console.log('✅ Token verified for student:', decoded.srn);

    // Get student from database
    const result = await pool.query(
      'SELECT id, srn, name FROM students WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      console.log('❌ Student not found');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach student to request
    req.student = result.rows[0];
    next();

  } catch (error) {
    console.error('❌ Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = authenticateStudent;