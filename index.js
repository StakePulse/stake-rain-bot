const express = require('express');
const https   = require('https');

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = '8736690342:AAFu1whZ7SeE072sM42adY_DcRS296mVQn4'; // @StakePulseAlert_Bot
const FIREBASE_URL   = 'alerte-rain-default-rtdb.europe-west1.firebasedatabase.app';
const ADMIN_CHAT_ID  = '281374538';
const RAILWAY_URL    = 'stake-rain-bot-production.up.railway.app';

const chatMap = {
  "2fcc08ba-9a3d-42bc-9265-90da709a4035": "🇸🇦 Arabic",
  "8590c8cd-65b2-45bd-ab58-973761efd1c6": "🇧🇷 Portuguese (Brazil)",
  "5d43c7fb-e444-4b0d-aa5e-1e78becd86eb": "🏆 Challenges",
  "67e89019-ae7e-446c-a371-24bae00a6826": "💥 Crash",
  "94e807f3-a2fc-4caf-b0ff-ccc613f71879": "🇩🇪 German",
  "f0326994-ee9e-411c-8439-b4997c187b95": "🇬🇧 English",
  "76609291-6ff5-4d0c-9ed6-0fde1d27de33": "🇪🇸 Spanish",
  "36f221a6-ba29-4d7c-9fc8-5c8dbe5d0127": "🇫🇮 Finnish",
  "688cf7f9-00d9-4e26-aa4f-bd7cc47e3ae4": "🇵🇭 Filipino",
  "5a6e5063-0154-47eb-9064-f69547213fe5": "🇫🇷 French",
  "38530077-e0f1-4cf7-8a92-08e9b3c7b63a": "🇮🇳 Hindi",
  "e824dc29-68ea-41a4-b69e-60fe31226e43": "🇮🇩 Indonesian",
  "9bc0ec54-98fb-4a83-9724-b55709eec990": "🌍 International",
  "c65b4f32-0001-4e1d-9cd6-e4b3538b43ae": "🇯🇵 Japanese",
  "9d70a3cc-ee83-4754-9189-318a83a1ec76": "🇯🇵 Japanese 2",
  "18f9a83c-0cfb-4c72-8600-23fbe0180e45": "🇰🇷 Korean",
  "f28dcd36-8325-49fa-aa23-a75045b13efa": "🇳🇬 Nigerian",
  "d58c1cf8-9b8e-4231-bcd7-a6c674f8e6a7": "🇳🇴 Norwegian",
  "68bb6e93-f9d6-4a27-875a-3ba28db4fb64": "🇵🇰 Pakistan",
  "81458dff-a653-4e9d-88c8-91b77f99e45b": "🇵🇱 Polish",
  "366c04f5-bdea-4415-8e2e-2d6952bf409d": "🇵🇹 Portuguese",
  "69b2aa0a-53b6-4eed-ada2-ad1d1f4d5bfe": "🇷🇺 Russian",
  "5cba7c13-b384-4c52-ad59-f169b23c62f8": "⚽ Sports (EN)",
  "6d27eb0d-1ac5-499c-9216-86eb6a86d86e": "⚽ Sports (RU)",
  "009ec486-7a86-4b50-89cd-a41683a05995": "🇸🇪 Swedish",
  "2a1c406f-d3af-4f4c-9d24-b57a592bfa78": "🇹🇭 Thai",
  "6ceca59c-394a-40e1-a133-0c2999d687bc": "🇹🇷 Turkish",
  "8c9994c8-192b-44aa-ac26-f083baf29896": "🇻🇳 Vietnamese",
  "96deb88b-ced9-4b78-b4da-8a65324c2aff": "🇨🇳 Chinese",
};

// ─── Firebase ─────────────────────────────────────────────────────────────────
function firebaseGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: FIREBASE_URL,
      path:     '/' + path + '.json',
      method:   'GET',
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(null); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function firebaseSet(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: FIREBASE_URL,
      path:     '/' + path + '.json',
      method:   'PUT',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Telegram ─────────────────────────────────────────────────────────────────
function sendMessage(chatId, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path:     '/bot' + TELEGRAM_TOKEN + '/sendMessage',
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Webhook Telegram (commandes users) ──────────────────────────────────────
app.post('/webhook', async (req, res) => {
  res.status(200).send('ok');
  try {
    const update = req.body;
    if (!update || !update.message) return;

    const msg      = update.message;
    const chatId   = msg.chat.id;
    const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name || 'Unknown';
    const text     = (msg.text || '').trim();

    if (text === '/start') {
      await sendMessage(chatId,
        '🌧 <b>StakePulse Bot</b>\n\n' +
        'To receive notifications, register your Stake username:\n' +
        '/register yourusername'
      );

    } else if (text.startsWith('/register ')) {
      const pseudo = text.split(' ')[1].trim().toLowerCase();
      await firebaseSet('users/' + pseudo, {
        chatId:       chatId.toString(),
        pseudo,
        registeredAt: Date.now(),
      });
      await sendMessage(chatId,
        '✅ <b>Registered!</b>\n\n' +
        '👤 Stake username: <b>' + pseudo + '</b>\n\n' +
        "You'll now receive notifications when:\n" +
        '• You receive a rain 🌧\n' +
        '• You are mentioned in chat 🔔\n\n' +
        'Type /help to see all commands.'
      );
      await sendMessage(ADMIN_CHAT_ID,
        '🔔 <b>New registration!</b>\n\n' +
        '👤 Stake: <b>' + pseudo + '</b>\n' +
        '📱 Telegram: ' + username + '\n' +
        '🕐 ' + new Date().toLocaleString('fr-FR')
      );

    } else if (text === '/help') {
      await sendMessage(chatId,
        '🌧 <b>StakePulse - Commands</b>\n\n' +
        '/register username - Register your Stake username\n' +
        '/help - Show this message'
      );

    } else {
      await sendMessage(chatId, 'Use /register yourusername to register.\nType /help to see commands.');
    }
  } catch(e) {
    console.error('Webhook error:', e);
  }
});

// ─── Route : notif rain ───────────────────────────────────────────────────────
app.post('/notify-rain', async (req, res) => {
  res.status(200).send('ok');
  try {
    const { recipients, sender, chatId, amount, currency, usdEach, usdTotal, eurEach, eurTotal, time } = req.body;
    if (!recipients || !recipients.length) return;

    const chat = chatMap[chatId] || chatId || 'Unknown';
    const users = await firebaseGet('users');
    if (!users) return;

    const list = recipients.slice(0, 15).join(', ') + (recipients.length > 15 ? '...' : '');

    for (const pseudo of recipients) {
      const user = users[pseudo.toLowerCase()];
      if (!user || !user.chatId) continue;

      await sendMessage(user.chatId,
        `🌧 <b>You received a rain on Stake!</b>\n` +
        `💬 Chat: <b>${chat}</b>\n` +
        `👤 From: <b>${sender}</b>\n` +
        (usdEach  ? `💰 <b>$${usdEach} / €${eurEach} per player</b>\n` : '') +
        (usdTotal ? `💵 <b>$${usdTotal} / €${eurTotal} total</b> (${recipients.length} players)\n` : '') +
        `👥 ${list}\n` +
        `🕐 ${time}`
      );
    }
  } catch(e) {
    console.error('notify-rain error:', e);
  }
});

// ─── Route : notif mention ────────────────────────────────────────────────────
app.post('/notify-mention', async (req, res) => {
  res.status(200).send('ok');
  try {
    const { mentioned, sender, chatId, message, time } = req.body;
    if (!mentioned) return;

    const chat = chatMap[chatId] || chatId || 'Unknown';
    const users = await firebaseGet('users');
    if (!users) return;

    const user = users[mentioned.toLowerCase()];
    if (!user || !user.chatId) return;

    const preview = message && message.length > 120 ? message.substring(0, 120) + '...' : message;

    await sendMessage(user.chatId,
      `🔔 <b>You were mentioned on Stake!</b>\n` +
      `💬 Chat: <b>${chat}</b>\n` +
      `👤 By: <b>${sender}</b>\n` +
      `📨 "${preview}"\n` +
      `🕐 ${time}`
    );
  } catch(e) {
    console.error('notify-mention error:', e);
  }
});

app.get('/', (req, res) => res.send('StakePulse Bot - OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('StakePulse Bot running on port', PORT));
