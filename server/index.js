const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Import mysql2
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection pool
// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// Function to execute SQL file
const executeSqlFile = async (filePath) => {
  try {
    const sql = require('fs').readFileSync(filePath, 'utf8');
    const connection = await pool.getConnection();
    await connection.query(sql);
    console.log(`Successfully executed SQL from ${filePath}`);
    connection.release();
  } catch (err) {
    console.error(`Error executing SQL from ${filePath}:`, err.message);
    throw err; // Re-throw to indicate failure
  }
};

// Test database connection and execute schema
(async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT NOW() as currentTime');
    console.log('Database connected:', rows[0].currentTime);
    connection.release();

    // Execute database schema
    await executeSqlFile('database.sql');

  } catch (err) {
    console.error('Error during database initialization:', err.message);
    console.log('Server will continue without full database setup...');
  }
})();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
