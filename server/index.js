const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./database'); // Import the database connection pool

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants'); // Import tenant routes
const pricingRoutes = require('./routes/pricingPlansAndCreditPacks');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes); // Use tenant routes
app.use('/api', pricingRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
