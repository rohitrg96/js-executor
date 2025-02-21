const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = 5000;

app.use(express.json()); // Enable JSON parsing

// API to trigger Load Test
app.post("/start-test", (req, res) => {
  const { code, totalRequests, concurrentUsers, targetApi } = req.body;

  if (!code || !totalRequests || !concurrentUsers || !targetApi) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Save the request body to postdata.json
  fs.writeFileSync("postdata.json", JSON.stringify({ code }));

  // Construct the Apache Benchmark command
  const abCommand = `ab -n ${totalRequests} -c ${concurrentUsers} -p postdata.json -T application/json ${targetApi}`;

  console.log("Running Load Test:", abCommand);

  // Execute Apache Benchmark
  exec(abCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }

    // Send test results
    res.json({ message: "Load test completed", results: stdout });
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Load Tester API running on port ${PORT}`);
});
