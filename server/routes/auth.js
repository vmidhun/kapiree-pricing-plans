const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid'); // Import uuid
const { authenticateToken, authorize } = require('../middleware/auth'); // Import authorize

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

    // Get default role_id for new users (e.g., 'recruiter')
    const [defaultRole] = await pool.query('SELECT id FROM roles WHERE name = ?', ['Recruiter']);
    const defaultRoleId = defaultRole.length > 0 ? defaultRole[0].id : null;

    // Save user to database with default role
    const insertQuery = 'INSERT INTO users (id, username, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)';
    const insertValues = [userId, username, email, password_hash, defaultRoleId];
    console.log('Insert Query:', insertQuery); // Debugging line
    console.log('Insert Values:', insertValues); // Debugging line
    await pool.query(insertQuery, insertValues);

    // Get the inserted user with their role
    const [newUserRows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.credits, r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );
    const newUser = newUserRows[0];

    // Fetch permissions for the new user's role
    const [permissionsRows] = await pool.query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [newUser.role_id]
    );
    const permissions = permissionsRows.map((row) => row.name);

    // Generate JWT with user ID, role, and permissions
    const token = jwt.sign({ id: newUser.id, role: newUser.role_name, permissions }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        credits: newUser.credits,
        role: newUser.role_name,
        permissions,
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
    // Check if user exists and get their role
    const [userRows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.credits, r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = userRows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Fetch permissions for the user's role
    const [permissionsRows] = await pool.query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );
    const permissions = permissionsRows.map((row) => row.name);

    // Generate JWT with user ID, role, and permissions
    const token = jwt.sign({ id: user.id, role: user.role_name, permissions }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        credits: user.credits,
        role: user.role_name,
        permissions,
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
    const [userRows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.credits, r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (userRows.length === 0) {
      console.warn('Profile not found for user ID:', req.user.id); // Added logging
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userRows[0];

    // Fetch permissions for the user's role
    const [permissionsRows] = await pool.query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );
    const permissions = permissionsRows.map((row) => row.name);

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        credits: user.credits,
        role: user.role_name,
        permissions,
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
    const userId = req.user.id;

    // 1. Fetch user's current subscription
    const [subscriptions] = await pool.query(
      `SELECT s.id, s.status, s.start_date, s.end_date, s.auto_renew,
              p.id as plan_id, p.name as plan_name, p.description as plan_description, p.price, p.currency, p.interval
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ? AND s.status = 'active'
       ORDER BY s.start_date DESC LIMIT 1`, // Get the most recent active subscription
      [userId]
    );

    let currentSubscription = null;
    let planFeatures = [];
    if (subscriptions.length > 0) {
      currentSubscription = subscriptions[0];
      // Fetch features for the subscribed plan
      const [features] = await pool.query(
        `SELECT f.name, f.description
         FROM plan_features pf
         JOIN features f ON pf.feature_id = f.id
         WHERE pf.plan_id = ?`,
        [currentSubscription.plan_id]
      );
      planFeatures = features;
    }

    // 2. Fetch user's credit balance
    const [userCredits] = await pool.query(
      'SELECT credits FROM users WHERE id = ?',
      [userId]
    );
    const creditBalance = userCredits.length > 0 ? userCredits[0].credits : 0;

    // 3. Fetch user's active credit packs
    const [creditPacks] = await pool.query(
      `SELECT ucp.id, cpd.name, ucp.credits_remaining, cpd.credits_amount as total_credits, ucp.expiration_date
       FROM user_credit_packs ucp
       JOIN credit_packs_definition cpd ON ucp.credit_pack_def_id = cpd.id
       WHERE ucp.user_id = ? AND (ucp.expiration_date IS NULL OR ucp.expiration_date > NOW()) AND ucp.credits_remaining > 0`,
      [userId]
    );

    // 4. Fetch user's active add-ons
    const [addOns] = await pool.query(
      `SELECT uao.id, aod.name, aod.description
       FROM user_add_ons uao
       JOIN add_ons_definition aod ON uao.add_on_def_id = aod.id
       WHERE uao.user_id = ? AND uao.status = 'active' AND (uao.end_date IS NULL OR uao.end_date > NOW())`,
      [userId]
    );

    // 5. Fetch user's transaction history
    const [transactionHistory] = await pool.query(
      `SELECT id, transaction_date as date, item_name, transaction_type, amount_paid, currency, status, invoice_url
       FROM transactions
       WHERE user_id = ?
       ORDER BY transaction_date DESC`,
      [userId]
    );

    if (!currentSubscription && creditPacks.length === 0 && addOns.length === 0 && transactionHistory.length === 0) {
      return res.status(404).json({ message: 'No subscription, credit packs, add-ons, or transaction history found' });
    }

    res.status(200).json({
      subscription: currentSubscription ? {
        ...currentSubscription,
        features: planFeatures,
        credit_balance: creditBalance,
        credit_packs: creditPacks,
        add_ons: addOns,
        transaction_history: transactionHistory,
      } : {
        credit_balance: creditBalance,
        credit_packs: creditPacks,
        add_ons: addOns,
        transaction_history: transactionHistory,
      },
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

// Renew Subscription
router.post('/subscription/renew', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the current active subscription
    const [subscriptions] = await pool.query(
      `SELECT id, plan_id, end_date, \`interval\`
       FROM subscriptions
       WHERE user_id = ? AND status = 'active'
       ORDER BY start_date DESC LIMIT 1`,
      [userId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No active subscription to renew.' });
    }

    const currentSubscription = subscriptions[0];
    const newEndDate = new Date(currentSubscription.end_date);

    // Calculate new end date based on interval
    if (currentSubscription.interval === 'month') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (currentSubscription.interval === 'year') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    } else {
      return res.status(400).json({ message: 'Unsupported subscription interval for renewal.' });
    }

    // Update the subscription end date and set auto_renew to true
    await pool.query(
      `UPDATE subscriptions
       SET end_date = ?, auto_renew = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newEndDate, currentSubscription.id]
    );

    // Fetch plan details for transaction record
    const [planDetails] = await pool.query('SELECT name, price, currency FROM plans WHERE id = ?', [currentSubscription.plan_id]);
    if (planDetails.length === 0) {
      console.error('Plan details not found for renewal transaction:', currentSubscription.plan_id);
      return res.status(500).json({ message: 'Failed to record renewal transaction: Plan details missing.' });
    }
    const plan = planDetails[0];

    // Record the renewal transaction
    const transactionId = uuidv4();
    await pool.query(
      `INSERT INTO transactions (id, user_id, item_type, item_id, item_name, transaction_type, amount_paid, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, userId, 'subscription', currentSubscription.id, plan.name, 'Renewal', plan.price, plan.currency, 'Completed']
    );

    res.status(200).json({ message: 'Subscription renewed successfully.', newEndDate: newEndDate.toISOString() });
  } catch (error) {
    console.error('Subscription renewal error:', error);
    res.status(500).json({ message: 'Server error during subscription renewal' });
  }
});

// Cancel Subscription
router.post('/subscription/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the current active subscription
    const [subscriptions] = await pool.query(
      `SELECT id, plan_id, end_date
       FROM subscriptions
       WHERE user_id = ? AND status = 'active'
       ORDER BY start_date DESC LIMIT 1`,
      [userId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No active subscription to cancel.' });
    }

    const currentSubscription = subscriptions[0];

    // Update subscription status to 'cancelled' and set auto_renew to FALSE
    await pool.query(
      `UPDATE subscriptions
       SET status = 'cancelled', auto_renew = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [currentSubscription.id]
    );

    // Fetch plan details for transaction record
    const [planDetails] = await pool.query('SELECT name, price, currency FROM plans WHERE id = ?', [currentSubscription.plan_id]);
    if (planDetails.length === 0) {
      console.error('Plan details not found for cancellation transaction:', currentSubscription.plan_id);
      return res.status(500).json({ message: 'Failed to record cancellation transaction: Plan details missing.' });
    }
    const plan = planDetails[0];

    // Record the cancellation transaction
    const transactionId = uuidv4();
    await pool.query(
      `INSERT INTO transactions (id, user_id, item_type, item_id, item_name, transaction_type, amount_paid, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, userId, 'subscription', currentSubscription.id, plan.name, 'Cancellation', 0.00, plan.currency, 'Completed'] // Amount paid is 0 for cancellation
    );

    res.status(200).json({ message: 'Subscription cancelled successfully.', endDate: currentSubscription.end_date });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ message: 'Server error during subscription cancellation' });
  }
});

// Purchase Credit Pack
router.post('/credit-packs/purchase', authenticateToken, async (req, res) => {
  const { creditPackDefId } = req.body;
  const userId = req.user.id;

  if (!creditPackDefId) {
    return res.status(400).json({ message: 'Credit pack definition ID is required.' });
  }

  try {
    const [creditPackDef] = await pool.query(
      'SELECT * FROM credit_packs_definition WHERE id = ?',
      [creditPackDefId]
    );

    if (creditPackDef.length === 0) {
      return res.status(404).json({ message: 'Credit pack not found.' });
    }

    const pack = creditPackDef[0];
    const userCreditPackId = uuidv4();
    let expirationDate = null;
    if (pack.validity_days) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + pack.validity_days);
    }

    await pool.query(
      `INSERT INTO user_credit_packs (id, user_id, credit_pack_def_id, credits_remaining, expiration_date)
       VALUES (?, ?, ?, ?, ?)`,
      [userCreditPackId, userId, creditPackDefId, pack.credits_amount, expirationDate]
    );

    // Update user's total credits
    await pool.query(
      'UPDATE users SET credits = credits + ? WHERE id = ?',
      [pack.credits_amount, userId]
    );

    // Record the transaction
    const transactionId = uuidv4();
    await pool.query(
      `INSERT INTO transactions (id, user_id, item_type, item_id, item_name, transaction_type, amount_paid, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, userId, 'credit_pack', userCreditPackId, pack.name, 'Purchase', pack.price, pack.currency, 'Completed']
    );

    res.status(201).json({ message: 'Credit pack purchased successfully.' });
  } catch (error) {
    console.error('Credit pack purchase error:', error);
    res.status(500).json({ message: 'Server error during credit pack purchase' });
  }
});

// Purchase Add-on
router.post('/add-ons/purchase', authenticateToken, async (req, res) => {
  const { addOnDefId } = req.body;
  const userId = req.user.id;

  if (!addOnDefId) {
    return res.status(400).json({ message: 'Add-on definition ID is required.' });
  }

  try {
    const [addOnDef] = await pool.query(
      'SELECT * FROM add_ons_definition WHERE id = ?',
      [addOnDefId]
    );

    if (addOnDef.length === 0) {
      return res.status(404).json({ message: 'Add-on not found.' });
    }

    const addOn = addOnDef[0];
    const userAddOnId = uuidv4();
    let endDate = null;

    // If add-on has an interval, calculate end date (e.g., 1 month from now)
    if (addOn.interval === 'month') {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (addOn.interval === 'year') {
      endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    // For one-time add-ons or perpetual, endDate remains NULL

    await pool.query(
      `INSERT INTO user_add_ons (id, user_id, add_on_def_id, purchase_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userAddOnId, userId, addOnDefId, new Date(), endDate, 'active']
    );

    // Record the transaction
    const transactionId = uuidv4();
    await pool.query(
      `INSERT INTO transactions (id, user_id, item_type, item_id, item_name, transaction_type, amount_paid, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, userId, 'add_on', userAddOnId, addOn.name, 'Purchase', addOn.price, addOn.currency, 'Completed']
    );

    res.status(201).json({ message: 'Add-on purchased successfully.' });
  } catch (error) {
    console.error('Add-on purchase error:', error);
    res.status(500).json({ message: 'Server error during add-on purchase' });
  }
});

// Get Credit Pack Definitions
router.get('/credit-packs/definitions', authenticateToken, async (req, res) => {
  try {
    const [creditPacks] = await pool.query('SELECT id, name, description, credits_amount, price, currency, validity_days FROM credit_packs_definition');
    res.status(200).json({ creditPacks });
  } catch (error) {
    console.error('Error fetching credit pack definitions:', error);
    res.status(500).json({ message: 'Server error retrieving credit pack definitions' });
  }
});

// Get Add-on Definitions
router.get('/add-ons/definitions', authenticateToken, async (req, res) => {
  try {
    const [addOns] = await pool.query('SELECT id, name, description, price, currency, `interval` FROM add_ons_definition');
    res.status(200).json({ addOns });
  } catch (error) {
    console.error('Error fetching add-on definitions:', error);
    res.status(500).json({ message: 'Server error retrieving add-on definitions' });
  }
});

// Get Plans
router.get('/plans', authenticateToken, async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT id, name, description, price, currency, `interval` FROM plans');
    res.status(200).json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Server error retrieving plans' });
  }
});

// Get all roles
router.get('/roles', authenticateToken, async (req, res) => {
  // This endpoint should ideally be restricted to users with 'perm_users:manage' or 'perm_tenants:manage'
  // For now, we'll allow authenticated users to fetch roles, but proper authorization will be added in middleware.
  try {
    const [roles] = await pool.query('SELECT id, name, description FROM roles');
    res.status(200).json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Server error retrieving roles' });
  }
});

// Get all permissions
router.get('/permissions', authenticateToken, async (req, res) => {
  // This endpoint should also be restricted.
  try {
    const [permissions] = await pool.query('SELECT id, name, description FROM permissions');
    res.status(200).json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Server error retrieving permissions' });
  }
});

// Assign a role to a user (Admin-only)
router.post('/users/:userId/assign-role', authenticateToken, authorize(['Manage Users']), async (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  // Basic validation
  if (!roleId) {
    return res.status(400).json({ message: 'Role ID is required.' });
  }

  try {
    // Verify role exists
    const [roleExists] = await pool.query('SELECT id FROM roles WHERE id = ?', [roleId]);
    if (roleExists.length === 0) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    // Verify user exists
    const [userExists] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Assign role to user
    await pool.query(
      'UPDATE users SET role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [roleId, userId]
    );

    res.status(200).json({ message: `Role ${roleId} assigned to user ${userId} successfully.` });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ message: 'Server error assigning role' });
  }
});

// Get all users (Admin-only)
router.get('/users', authenticateToken, authorize(['Manage Users']), async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.credits, r.name as role_name, r.id as role_id, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

// Get a single user by ID (Admin-only)
router.get('/users/:userId', authenticateToken, authorize(['Manage Users']), async (req, res) => {
  const { userId } = req.params;
  try {
    const [userRows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.credits, r.name as role_name, r.id as role_id, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ user: userRows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error retrieving user' });
  }
});

// Update a user's details (Admin-only)
router.put('/users/:userId', authenticateToken, authorize(['Manage Users']), async (req, res) => {
  const { userId } = req.params;
  const { username, email, roleId } = req.body; // Allow updating username, email, and role

  if (!username || !email || !roleId) {
    return res.status(400).json({ message: 'Username, email, and roleId are required.' });
  }

  try {
    // Verify role exists
    const [roleExists] = await pool.query('SELECT id FROM roles WHERE id = ?', [roleId]);
    if (roleExists.length === 0) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    await pool.query(
      'UPDATE users SET username = ?, email = ?, role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, email, roleId, userId]
    );

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// Delete a user (Admin-only)
router.delete('/users/:userId', authenticateToken, authorize(['Manage Users']), async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// Get permissions for a specific role
router.get('/roles/:roleId/permissions', authenticateToken, authorize(['Manage Roles']), async (req, res) => {
  const { roleId } = req.params;
  try {
    const [permissions] = await pool.query(
      `SELECT p.id, p.name, p.description
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );
    res.status(200).json({ permissions });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ message: 'Server error retrieving role permissions' });
  }
});

// Create a new role
router.post('/roles', authenticateToken, authorize(['Manage Roles']), async (req, res) => {
  const { name, description, permissionIds } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: 'Role name and description are required.' });
  }

  const roleId = uuidv4();
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO roles (id, name, description) VALUES (?, ?, ?)',
      [roleId, name, description]
    );

    if (permissionIds && permissionIds.length > 0) {
      const permissionValues = permissionIds.map((permId) => [roleId, permId]);
      await connection.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
        [permissionValues]
      );
    }

    await connection.commit();

    const [newRoleRows] = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = ?`,
      [roleId]
    );
    const newRole = newRoleRows[0];

    res.status(201).json({ message: 'Role created successfully.', role: newRole });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Server error creating role' });
  } finally {
    if (connection) connection.release();
  }
});

// Update a role's details (name, description)
router.put('/roles/:roleId', authenticateToken, authorize(['Manage Roles']), async (req, res) => {
  const { roleId } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Role name and description are required.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE roles SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, roleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    res.status(200).json({ message: 'Role updated successfully.' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Server error updating role' });
  }
});

// Update a role's permissions
router.put('/roles/:roleId/permissions', authenticateToken, authorize(['Manage Roles']), async (req, res) => {
  const { roleId } = req.params;
  const { permissionIds } = req.body; // Array of permission IDs

  if (!Array.isArray(permissionIds)) {
    return res.status(400).json({ message: 'permissionIds must be an array.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Delete existing permissions for the role
    await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

    // 2. Insert new permissions
    if (permissionIds.length > 0) {
      const values = permissionIds.map((permId) => [roleId, permId]);
      await connection.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    res.status(200).json({ message: 'Role permissions updated successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating role permissions:', error);
    res.status(500).json({ message: 'Server error updating role permissions' });
  } finally {
    if (connection) connection.release();
  }
});

// Delete a role
router.delete('/roles/:roleId', authenticateToken, authorize(['Manage Roles']), async (req, res) => {
  const { roleId } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // First, set role_id to NULL for any users assigned to this role
    await connection.query('UPDATE users SET role_id = NULL WHERE role_id = ?', [roleId]);

    // Then, delete the role from the roles table (role_permissions will cascade delete)
    const [result] = await connection.query('DELETE FROM roles WHERE id = ?', [roleId]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Role not found.' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Role deleted successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Server error deleting role' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
