const express = require("express");
const k8s = require("@kubernetes/client-node");

const app = express();
const port = 3001;

// Load Kubernetes Config
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

const NAMESPACE = "default"; // Set namespace
const DEPLOYMENT_NAME = "node-executor"; // Name of the executor deployment

// Function to check if the node-executor pod is running
async function isExecutorRunning() {
  try {
    const res = await k8sApi.readNamespacedDeployment(
      DEPLOYMENT_NAME,
      NAMESPACE
    );
    return res.body.status.readyReplicas > 0;
  } catch (err) {
    if (err.response?.status === 404) {
      console.log("Deployment not found, creating one...");
      return false;
    }
    // console.error("Error checking deployment:", err);
    return false;
  }
}

// Function to create the node-executor Deployment
async function createExecutorDeployment() {
  console.log("updated9");
  const deploymentManifest = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: { name: DEPLOYMENT_NAME, namespace: NAMESPACE },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: "node-executor" } },
      template: {
        metadata: { labels: { app: "node-executor" } },
        spec: {
          containers: [
            {
              name: "node-executor",
              image: "node-executor",
              imagePullPolicy: "IfNotPresent",
              env: [{ name: "RABBITMQ_URL", value: "amqp://rabbitmq" }],
              resources: {
                requests: { cpu: "250m" },
                limits: { cpu: "500m" },
              },
            },
          ],
        },
      },
    },
  };

  try {
    await k8sApi.createNamespacedDeployment(NAMESPACE, deploymentManifest);
    // console.log("Created node-executor deployment.");
  } catch (err) {
    console.error(
      "Error creating deployment:",
      err.response?.body || err.message
    );
  }
}

// API to ensure executor is running
app.post("/ensure-executor", async (req, res) => {
  if (await isExecutorRunning()) {
    return res.json({ message: "Executor pod is already running." });
  }
  await createExecutorDeployment(); // Create the deployment if not found
  res.json({ message: "Executor pod created and started." });
});

app.listen(port, () => console.log(`Orchestrator API running on port ${port}`));
