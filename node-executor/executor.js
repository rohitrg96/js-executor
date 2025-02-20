const amqp = require("amqplib");
const { VM } = require("vm2");

const RABBITMQ_URL = "amqp://rabbitmq";

async function consumeQueue() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  const queue = "js-code-queue";

  await channel.assertQueue(queue, { durable: true });

  console.log("Waiting for messages...");
  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const code = msg.content.toString();
      console.log("Received Code:", code);

      try {
        // Execute the code safely in a sandbox
        const vm = new VM({ timeout: 5000 }); // 5 sec timeout
        const result = vm.run(code);
        console.log("Execution Result:", result);
      } catch (err) {
        console.error("Execution Error:", err);
      }

      channel.ack(msg);
    }
  });
}

consumeQueue().catch(console.error);
