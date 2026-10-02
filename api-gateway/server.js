const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3000';

app.post('/api/orders', async (req, res) => {
  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/orders`, req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to place order', detail: err.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/health`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'order-service unavailable' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));