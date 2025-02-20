const express = require("express");
const amqp = require("amqplib");

const app = express();
app.use(express.json());

const RABBITMQ_URL = "amqp://rabbitmq";

async function sendToQueue(code) {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  const queue = "js-code-queue";

  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(code), { persistent: true });

  console.log("Sent code to queue:", code);
  setTimeout(() => conn.close(), 500);
}

app.post("/execute", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).send("Code is required");

  await sendToQueue(code);
  res.send({ message: "Code added to queue" });
});

app.listen(3000, () => console.log("API Server running on port 3000"));
