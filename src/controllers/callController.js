const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Token expiry: 1 hour
const EXPIRATION_TIME_IN_SECONDS = 3600;

// GET /api/call/token?channelName=xxx&uid=0
async function getCallToken(req, res) {
  try {
    const channelName = req.query.channelName;

    if (!channelName) {
      return res.status(400).json({ message: 'channelName is required' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error('Agora env vars missing', { hasAppId: !!appId, hasCert: !!appCertificate });
      return res.status(500).json({ message: 'Call service not configured' });
    }

    // uid 0 = Agora assigns one automatically
    const uid = req.query.uid ? parseInt(req.query.uid, 10) : 0;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + EXPIRATION_TIME_IN_SECONDS;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({ token, appId, uid });
  } catch (err) {
    console.error('getCallToken error:', err);
    res.status(500).json({ message: 'Could not generate call token', error: err.message });
  }
}

module.exports = { getCallToken };