const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid'); // Import uuid
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Register User
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Registration request body:', req.body); // New logging

  try {
    // Check if user already exists
    const [userExists] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (userExists.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate a UUID for the new user
    const userId = uuidv4();
    console.log('Generated userId:', userId); // Debugging line

    // Save user to database
    const insertQuery = 'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)';
    const insertValues = [userId, username, email, password_hash];
    console.log('Insert Query:', insertQuery); // Debugging line
    console.log('Insert Values:', insertValues); // Debugging line
    await pool.query(insertQuery, insertValues);

    // Get the inserted user (using the generated ID)
    const [newUser] = await pool.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );

    // Generate JWT
    const token = jwt.sign({ id: newUser[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        credits: newUser[0].credits, // Include credits in registration response
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        credits: user[0].credits, // Include credits in login response
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('Error: User ID not found in token payload for profile request.');
      return res.status(400).json({ message: 'User ID not available in token.' });
    }
    console.log('Fetching profile for user ID:', req.user.id);
    const [user] = await pool.query(
      'SELECT id, username, email, credits FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      console.warn('Profile not found for user ID:', req.user.id); // Added logging
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        credits: user[0].credits, // Include credits in profile response
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message }); // Include error message
  }
});

// Update User Credits
router.post('/update-credits', authenticateToken, async (req, res) => {
  const { creditsToAdd } = req.body;

  if (typeof creditsToAdd !== 'number' || creditsToAdd <= 0) {
    return res.status(400).json({ message: 'Invalid credits amount' });
  }

  try {
    await pool.query(
      'UPDATE users SET credits = credits + ? WHERE id = ?',
      [creditsToAdd, req.user.id]
    );

    const [updatedUser] = await pool.query(
      'SELECT id, username, email, credits FROM users WHERE id = ?',
      [req.user.id]
    );

    res.status(200).json({
      message: 'Credits updated successfully',
      user: {
        id: updatedUser[0].id,
        username: updatedUser[0].username,
        email: updatedUser[0].email,
        credits: updatedUser[0].credits,
      },
    });
  } catch (error) {
    console.error('Update credits error:', error);
    res.status(500).json({ message: 'Server error updating credits' });
  }
});

// Logout User (token will be invalidated on client side)
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// Refresh Token (optional endpoint for future use)
// Get User Subscription Details
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const [subscriptions] = await pool.query(
      `SELECT s.id, s.status, s.start_date, s.end_date, s.auto_renew,
              p.id as plan_id, p.name as plan_name, p.description as plan_description, p.price, p.currency, p.interval
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ?`,
      [req.user.id]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No active subscriptions found' });
    }

    const subscription = subscriptions[0];

    // Fetch features for the subscribed plan
    const [features] = await pool.query(
      `SELECT f.name, f.description
       FROM plan_features pf
       JOIN features f ON pf.feature_id = f.id
       WHERE pf.plan_id = ?`,
      [subscription.plan_id]
    );

    res.status(200).json({
      subscription: {
        ...subscription,
        features: features,
      },
    });

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No active subscriptions found' });
    }

    res.status(200).json({
      subscription: subscriptions[0], // Assuming one active subscription per user for simplicity
    });
  } catch (error) {
    console.error('Subscription details error:', error);
    res.status(500).json({ message: 'Server error retrieving subscription details' });
  }
});

router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const [user] = await pool.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new token
    const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Token refreshed successfully',
      token,
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error refreshing token' });
  }
});

module.exports = router;
