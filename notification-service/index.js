const amqp = require('amqplib');

async function start() {
  try {
    const connection = await amqp.connect(process.env.BROKER_URL);
    const channel = await connection.createChannel();

    const exchange = 'order_exchange';
    const queue = 'notification_payment_queue';
    const routingKey = 'payment.success';

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);

    console.log('✅ Notification Service ready - waiting for payment.success');

    channel.consume(queue, (msg) => {
      if (msg) {
        const payment = JSON.parse(msg.content.toString());
        console.log('🔔 [Notification] Payment success:', payment);
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('Notification error:', err.message);
    setTimeout(start, 5000);
  }
}

start();