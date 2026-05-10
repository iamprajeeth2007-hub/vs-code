// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const  pool  = require('../config/database');

exports.registerStudent = async (req, res) => {
  try {
    const { srn: rawSrn, name, pin, phone, email } = req.body;
    const srn = rawSrn ? rawSrn.toUpperCase() : null;

    if (!srn || !pin) {
      return res.status(400).json({ error: 'SRN and PIN are required' });
    }

    const existing = await pool.query('SELECT * FROM students WHERE srn = $1', [srn]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Student already registered' });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const result = await pool.query(
      'INSERT INTO students (srn, name, pin_hash) VALUES ($1, $2, $3) RETURNING id, srn, name',
      [srn, name, pinHash]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, srn: user.srn, type: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        srn: user.srn,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { srn: rawSrn, pin } = req.body;
    const srn = rawSrn ? rawSrn.toUpperCase() : null;

    if (!srn || !pin) {
      return res.status(400).json({ error: 'SRN and PIN are required' });
    }

    const result = await pool.query('SELECT * FROM students WHERE srn = $1', [srn]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const student = result.rows[0];

    const validPin = await bcrypt.compare(pin, student.pin_hash);
    if (!validPin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student.id, srn: student.srn, type: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: student.id,
        srn: student.srn,
        name: student.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.loginVendor = async (req, res) => {
  try {
    const { vendorId, vendor_id: raw_id, password } = req.body;
    const vendor_id = vendorId || raw_id;

    if (!vendor_id || !password) {
      return res.status(400).json({ error: 'Vendor ID and password are required' });
    }

    const validVendors = {
      'grub_foods': 'grub123',
      'roll_me': 'roll123',
      'siddi_vinayaka': 'siddi123'
    };

    if (!validVendors[vendor_id] || validVendors[vendor_id] !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const result = await pool.query('SELECT * FROM vendors WHERE vendor_id = $1', [vendor_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = result.rows[0];

    const token = jwt.sign(
      { id: vendor.id, vendor_id: vendor.vendor_id, type: 'vendor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      vendor: {
        id: vendor.id,
        vendor_id: vendor.vendor_id,
        name: vendor.name,
        store_name: vendor.name // Frontend alias
      }
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};