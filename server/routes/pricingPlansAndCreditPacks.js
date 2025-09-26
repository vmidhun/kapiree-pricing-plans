const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database'); // Import the database connection pool
const { authenticateToken, authorize } = require('../middleware/auth'); // Assuming auth middleware

// --- Pricing Plans Routes ---

// Get all pricing plans (unauthenticated for portal, authenticated for admin)
router.get('/pricing-plans', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM plans WHERE is_active = TRUE');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pricing plans:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single pricing plan by ID (unauthenticated for portal, authenticated for admin)
router.get('/pricing-plans/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM plans WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Pricing plan not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching pricing plan:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new pricing plan (authenticated, admin only)
router.post('/pricing-plans', authenticateToken, authorize(['Manage Pricing Plans']), async (req, res) => {
    const { name, description, price, currency, interval } = req.body;
    const id = uuidv4();
    try {
        await db.query(
            'INSERT INTO plans (id, name, description, price, currency, `interval`) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, description, price, currency, interval]
        );
        res.status(201).json({ message: 'Pricing plan created successfully', id });
    } catch (error) {
        console.error('Error creating pricing plan:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an existing pricing plan (authenticated, admin only)
router.put('/pricing-plans/:id', authenticateToken, authorize(['Manage Pricing Plans']), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, currency, interval } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE plans SET name = ?, description = ?, price = ?, currency = ?, `interval` = ? WHERE id = ?',
            [name, description, price, currency, interval, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pricing plan not found' });
        }
        res.json({ message: 'Pricing plan updated successfully' });
    } catch (error) {
        console.error('Error updating pricing plan:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a pricing plan (authenticated, admin only)
router.delete('/pricing-plans/:id', authenticateToken, authorize(['Manage Pricing Plans']), async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('UPDATE plans SET is_active = FALSE WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pricing plan not found' });
        }
        res.json({ message: 'Pricing plan marked as inactive successfully' });
    } catch (error) {
        console.error('Error marking pricing plan as inactive:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Credit Packs Routes ---

// Get all credit packs (unauthenticated for portal, authenticated for admin)
router.get('/credit-packs', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM credit_packs_definition');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching credit packs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single credit pack by ID (unauthenticated for portal, authenticated for admin)
router.get('/credit-packs/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM credit_packs_definition WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Credit pack not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching credit pack:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new credit pack (authenticated, admin only)
router.post('/credit-packs', authenticateToken, authorize(['Manage Credit Packs']), async (req, res) => {
    const { name, description, credits_amount, price, currency, validity_days } = req.body;
    const id = uuidv4();
    try {
        await db.query(
            'INSERT INTO credit_packs_definition (id, name, description, credits_amount, price, currency, validity_days) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, description, credits_amount, price, currency, validity_days]
        );
        res.status(201).json({ message: 'Credit pack created successfully', id });
    } catch (error) {
        console.error('Error creating credit pack:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an existing credit pack (authenticated, admin only)
router.put('/credit-packs/:id', authenticateToken, authorize(['Manage Credit Packs']), async (req, res) => {
    const { id } = req.params;
    const { name, description, credits_amount, price, currency, validity_days } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE credit_packs_definition SET name = ?, description = ?, credits_amount = ?, price = ?, currency = ?, validity_days = ? WHERE id = ?',
            [name, description, credits_amount, price, currency, validity_days, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Credit pack not found' });
        }
        res.json({ message: 'Credit pack updated successfully' });
    } catch (error) {
        console.error('Error updating credit pack:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a credit pack (authenticated, admin only)
router.delete('/credit-packs/:id', authenticateToken, authorize(['Manage Credit Packs']), async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM credit_packs_definition WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Credit pack not found' });
        }
        res.json({ message: 'Credit pack deleted successfully' });
    } catch (error) {
        console.error('Error deleting credit pack:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
