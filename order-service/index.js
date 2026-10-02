const express = require('express');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

const RABBIT_URL = process.env.BROKER_URL || 'amqp://guest:guest@message-broker:5672';
const PORT = 3000;

let channel = null;

async function connectRabbit() {
  try {
    const conn = await amqp.connect(RABBIT_URL);
    channel = await conn.createChannel();

    // Tama na ang exchange name
    await channel.assertExchange('order_exchange', 'topic', { durable: true });

    console.log('Connected to RabbitMQ, exchange ready.');
  } catch (err) {
    console.error('RabbitMQ connection failed, retrying in 5s...', err.message);
    setTimeout(connectRabbit, 5000);
  }
}

app.post('/orders', async (req, res) => {
  const { productId, quantity, customerName } = req.body || {};

  if (!productId || !quantity) {
    return res.status(400).json({ error: 'productId and quantity are required' });
  }

  const order = {
    orderId: 'ORD-' + Date.now(),
    productId,
    quantity: Number(quantity),
    customerName: customerName || 'Guest',
    status: 'PLACED',
    createdAt: new Date().toISOString()
  };

  if (channel) {
    // Publish sa tamang exchange + routing key
    channel.publish(
      'order_exchange',
      'order.placed',
      Buffer.from(JSON.stringify(order)),
      { persistent: true }
    );
    console.log('Order published:', order.orderId);
  } else {
    console.warn('RabbitMQ not connected; order stored locally only.');
  }

  res.status(201).json(order);
});

app.get('/health', (req, res) => res.json({ status: 'order-service OK' }));

app.listen(PORT, () => {
  console.log(`order-service running on port ${PORT}`);
});

connectRabbit();