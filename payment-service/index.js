const amqp = require('amqplib');

async function start() {
  try {
    const connection = await amqp.connect(process.env.BROKER_URL);
    const channel = await connection.createChannel();

    const exchange = 'order_exchange';
    const queue = 'payment_order_queue';
    const routingKey = 'order.placed';

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);

    console.log('✅ Payment Service ready - waiting for order.placed');

    channel.consume(queue, async (msg) => {
      if (msg) {
        const order = JSON.parse(msg.content.toString());
        console.log('💳 [Payment] Received order:', order);

        // Publish payment.success
        const paymentEvent = {
          orderId: order.id || order.orderId,
          status: 'success',
          amount: order.total || order.amount || 0
        };

        channel.publish(
          exchange,
          'payment.success',
          Buffer.from(JSON.stringify(paymentEvent)),
          { persistent: true }
        );

        console.log('✅ [Payment] Published payment.success');
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('Payment error:', err.message);
    setTimeout(start, 5000);
  }
}

start();