const express = require('express');
const router = express.Router();
// 1. UPDATED IMPORT: Using official 'agora-token' package
const { RtcTokenBuilder, RtcRole } = require('agora-token');

// GET /api/call/token?channelName=<conversationId>
router.get('/token', (req, res) => {
  const { channelName } = req.query;

  if (!channelName) {
    return res.status(400).json({ error: 'channelName is required' });
  }

  // 2. READ CREDENTIALS: Pulled from process.env variables set on Render
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return res.status(500).json({ error: 'Agora credentials missing on server' });
  }

  const uid = 0; // 0 allows Agora to auto-assign a numeric user ID
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour validity
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    // 3. UPDATED TOKEN BUILDER: 'agora-token' requires buildTokenWithUid with expiration arguments
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return res.json({ token, appId });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;