const amqp = require('amqplib');

async function start() {
  try {
    const connection = await amqp.connect(process.env.BROKER_URL);
    const channel = await connection.createChannel();

    const exchange = 'order_exchange';
    const queue = 'inventory_order_queue';
    const routingKey = 'order.placed';

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);

    console.log('✅ Inventory Service ready - waiting for order.placed');

    channel.consume(queue, (msg) => {
      if (msg) {
        const order = JSON.parse(msg.content.toString());
        console.log('📦 [Inventory] Received order:', order);
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('Inventory error:', err.message);
    setTimeout(start, 5000);
  }
}

start();