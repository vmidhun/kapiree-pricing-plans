const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorize } = require('../middleware/auth');

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

// GET all tenants (Super Admin only)
router.get('/', authenticateToken, authorize(['Manage Tenants']), async (req, res) => {
  try {
    const [tenants] = await pool.query('SELECT id, name, admin_user_id, created_at, updated_at FROM companies ORDER BY created_at DESC');
    res.status(200).json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ message: 'Server error retrieving tenants' });
  }
});

// GET a single tenant by ID (Super Admin only)
router.get('/:id', authenticateToken, authorize(['Manage Tenants']), async (req, res) => {
  const { id } = req.params;
  try {
    const [tenantRows] = await pool.query('SELECT id, name, admin_user_id, created_at, updated_at FROM companies WHERE id = ?', [id]);
    if (tenantRows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }
    res.status(200).json({ tenant: tenantRows[0] });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ message: 'Server error retrieving tenant' });
  }
});

// POST create a new tenant (Super Admin only)
router.post('/', authenticateToken, authorize(['Manage Tenants']), async (req, res) => {
  const { name, admin_user_id } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Tenant name is required.' });
  }
  if (!admin_user_id) {
    return res.status(400).json({ message: 'Admin User ID is required for a new tenant.' });
  }

  // Verify admin_user_id exists
  try {
    const [userExists] = await pool.query('SELECT id FROM users WHERE id = ?', [admin_user_id]);
    if (userExists.length === 0) {
      return res.status(400).json({ message: 'Provided Admin User ID does not exist.' });
    }
  } catch (error) {
    console.error('Error verifying admin_user_id:', error);
    return res.status(500).json({ message: 'Server error verifying admin user.' });
  }

  const tenantId = uuidv4();
  try {
    await pool.query(
      'INSERT INTO companies (id, name, admin_user_id) VALUES (?, ?, ?)',
      [tenantId, name, admin_user_id]
    );
    const [newTenantRows] = await pool.query('SELECT id, name, admin_user_id, created_at, updated_at FROM companies WHERE id = ?', [tenantId]);
    res.status(201).json({ message: 'Tenant created successfully.', tenant: newTenantRows[0] });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Server error creating tenant' });
  }
});

// PUT update a tenant (Super Admin only)
router.put('/:id', authenticateToken, authorize(['Manage Tenants']), async (req, res) => {
  const { id } = req.params;
  const { name, admin_user_id } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Tenant name is required.' });
  }
  if (!admin_user_id) {
    return res.status(400).json({ message: 'Admin User ID is required for a tenant.' });
  }

  // Verify admin_user_id exists
  try {
    const [userExists] = await pool.query('SELECT id FROM users WHERE id = ?', [admin_user_id]);
    if (userExists.length === 0) {
      return res.status(400).json({ message: 'Provided Admin User ID does not exist.' });
    }
  } catch (error) {
    console.error('Error verifying admin_user_id:', error);
    return res.status(500).json({ message: 'Server error verifying admin user.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE companies SET name = ?, admin_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, admin_user_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }
    res.status(200).json({ message: 'Tenant updated successfully.' });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Server error updating tenant' });
  }
});

// DELETE a tenant (Super Admin only)
router.delete('/:id', authenticateToken, authorize(['Manage Tenants']), async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Set company_id to NULL for any users associated with this tenant
    await connection.query('UPDATE users SET company_id = NULL WHERE company_id = ?', [id]);

    // Delete the tenant
    const [result] = await connection.query('DELETE FROM companies WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Tenant deleted successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting tenant:', error);
    res.status(500).json({ message: 'Server error deleting tenant' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
