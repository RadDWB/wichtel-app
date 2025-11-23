import { v4 as uuid } from 'uuid';
import { getGroup, saveGroup, setParticipantSession } from '../../../lib/kv';

const RECOVERY_PIN = '999999';

const buildCookie = (name, value, { maxAge = 60 * 60 * 24 * 7, secure = true } = {}) => {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) {
    parts.push('Secure');
  }
  return parts.join('; ');
};

const getCookies = (req) => {
  const header = req.headers?.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((c) => {
      const [k, v] = c.trim().split('=');
      return [k, decodeURIComponent(v || '')];
    })
  );
};

const logSession = (phase, req, extra = {}) => {
  const cookies = getCookies(req);
  const sessionId = cookies.sessionId || req.headers['x-session-id'] || null;
  console.log(
    `[session-debug] phase=${phase} route=${req.url} method=${req.method} sessionId=${sessionId || 'none'} cookies=${JSON.stringify(
      cookies
    )} extra=${JSON.stringify(extra)}`
  );
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { groupId, participantId, pin } = req.body || {};
  logSession('participant-session:entry', req, { groupId, participantId });

  if (!groupId || !participantId || !pin) {
    return res.status(400).json({ error: 'groupId, participantId, pin required' });
  }

  try {
    const group = await getGroup(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const participant = group.participants?.find((p) => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // If no PIN stored yet (legacy), set it now
    if (!participant.pin) {
      participant.pin = pin;
      await saveGroup(groupId, group);
      logSession('participant-session:set-pin-legacy', req, { groupId, participantId });
    }

    if (participant.pin !== pin && pin !== RECOVERY_PIN) {
      logSession('participant-session:pin-mismatch', req, { groupId, participantId });
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    const sessionId = uuid();
    const sessionPayload = {
      groupId,
      participantId,
      createdAt: new Date().toISOString(),
    };

    await setParticipantSession(sessionId, sessionPayload);
    const cookie = buildCookie('sessionId', sessionId, { secure: req.headers['x-forwarded-proto'] === 'https' });
    res.setHeader('Set-Cookie', cookie);
    logSession('participant-session:set-session', req, { groupId, participantId, sessionId });

    return res.status(200).json({ success: true, sessionId });
  } catch (error) {
    console.error('Error creating participant session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
}
