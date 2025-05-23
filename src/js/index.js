const core = require("@actions/core");
const github = require('@actions/github');
const crypto = require('crypto');
import fetch from 'node-fetch';

try {
  const webhookUrl = core.getInput("webhook_url", { required: true });
  const webhookToken = core.getInput("webhook_token", { required: true });

  // Get the payload from the GitHub context
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  var payloadBuf = Buffer.from(payload, 'utf-8');
  const secretBuffer = Buffer.from(webhookToken, 'utf-8');
  console.log(`The event payload: ${payloadBuf}`);

  const signature = crypto
      .createHmac('sha256', secretBuffer)
      .update(payloadBuf)
      .digest('hex');

  // Send the payload to the webhook with the signature
  const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': github.context.eventName,
        'X-Hub-Signature-256': 'sha256='+signature, // Include the signature in the headers
      },
      body: payload,
    });

    // Check if the request was successful
    if (!response.ok) {
      core.setFailed(`Failed to send payload to webhook: ${response.statusText}`);
    }
    else {
      core.info(`Payload sent to webhook successfully: ${response.status}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
