const express = require('express');
const https   = require('https');

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = '8736690342:AAFu1whZ7SeE072sM42adY_DcRS296mVQn4'; // @StakePulseAlert_Bot
const FIREBASE_URL   = 'stakepulse-v2.europe-west1.firebasedatabase.app';
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
app.listen(PORT, () => {
  console.log('StakePulse Bot running on port', PORT);
  // Lancer le bridge WebSocket Stake
  startBridge();
});

// ─── Bridge WebSocket Stake ────────────────────────────────────────────────────
// bridge.js — Bridge Railway (rains + messages + HR)
// Tourne sur Railway — pousse directement vers Firebase


// ─── Config Bridge ────────────────────────────────────────────────────────────
const STAKE_WS_URL = 'wss://stake.bet/_api/websockets';
let STAKE_SESSION = process.env.STAKE_SESSION || '';



const CRYPTO_IDS = {
  'BTC':'bitcoin','ETH':'ethereum','LTC':'litecoin','USDT':'tether',
  'USDC':'usd-coin','XRP':'ripple','DOGE':'dogecoin','TRX':'tron',
  'BNB':'binancecoin','SOL':'solana','BCH':'bitcoin-cash',
};

const QUERY = `subscription ChatMessages($chatId: String!) {
  chatMessages(chatId: $chatId) {
    id
    data {
      ... on ChatMessageDataText { message __typename }
      ... on ChatMessageDataRain {
        rain { amount currency rainUsers { user { id name __typename } __typename } }
        __typename
      }
      ... on ChatMessageDataBot { message __typename }
    }
    user { id name isHighroller __typename }
    createdAt
  }
}`;

// ─── Crypto prix ──────────────────────────────────────────────────────────────
const priceCache = {};
function getCryptoPrice(symbol, callback) {
  const sym = symbol.toUpperCase();
  const id = CRYPTO_IDS[sym];
  if (!id) { callback(null, null); return; }
  const cached = priceCache[sym];
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) { callback(cached.usd, cached.eur); return; }
  const req = https.request({
    hostname: 'api.coingecko.com',
    path: `/api/v3/simple/price?ids=${id}&vs_currencies=usd,eur`,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const p = JSON.parse(data)[id] || {};
        if (p.usd) priceCache[sym] = { usd: p.usd, eur: p.eur, ts: Date.now() };
        callback(p.usd || null, p.eur || null);
      } catch(e) { if (cached) callback(cached.usd, cached.eur); else callback(null, null); }
    });
  });
  req.on('error', () => { if (cached) callback(cached.usd, cached.eur); else callback(null, null); });
  req.end();
}

// ─── Firebase ─────────────────────────────────────────────────────────────────
function fbGet(path, callback) {
  const req = https.request({ hostname: FIREBASE_URL, path: '/' + path + '.json', method: 'GET' }, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => { try { callback(JSON.parse(data)); } catch(e) { callback(null); } });
  });
  req.on('error', () => callback(null));
  req.end();
}

function fbPut(path, data) {
  const body = JSON.stringify(data);
  const req = https.request({
    hostname: FIREBASE_URL, path: '/' + path + '.json', method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, res => { res.on('data', () => {}); res.on('end', () => {}); });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

function firebasePushRain(entry) {
  fbGet('shared/srn_rain_log', existing => {
    const log = Array.isArray(existing) ? existing : [];
    const key = e => `${e.ts}|${e.chatId||''}|${e.sender||''}`;
    if (log.some(e => key(e) === key(entry))) return;
    log.push(entry);
    const trimmed = log.length > 10000 ? log.slice(-10000) : log;
    fbPut('shared/srn_rain_log', trimmed);
    console.log(`[Firebase] Rain pushee : ${entry.chat} | ${entry.sender}`);
  });
}

function firebasePushRainer(entry) {
  fbGet('shared/srn_rainers', existing => {
    const log = Array.isArray(existing) ? existing : [];
    if (log.some(e => e.ts === entry.ts)) return;
    log.push(entry);
    const trimmed = log.length > 10000 ? log.slice(-10000) : log;
    fbPut('shared/srn_rainers', trimmed);
  });
}

function firebasePushMention(mentioned, sender, text, chatId) {
  fbGet('mentions/' + mentioned, existing => {
    const mentions = Array.isArray(existing) ? existing : [];
    const key = text.substring(0, 80);
    if (mentions.some(m => m.text && m.text.substring(0, 80) === key)) return;
    mentions.unshift({ id: Date.now(), ts: Date.now(), sender, text: text.substring(0, 300), chatId: chatId || '', read: false });
    fbPut('mentions/' + mentioned, mentions.slice(0, 100));
    console.log(`[Firebase] Mention pushee pour @${mentioned} par ${sender}`);
  });
}

function firebasePushHR(entry) {
  const chatId = entry.chatId || 'unknown';
  fbGet('highrollers/' + chatId, existing => {
    const hrs = Array.isArray(existing) ? existing : [];
    const key = entry.sender + '|' + (entry.message || '').substring(0, 30);
    if (hrs.some(h => h.sender + '|' + (h.message || '').substring(0, 30) === key)) return;
    hrs.unshift(entry);
    fbPut('highrollers/' + chatId, hrs.slice(0, 50));
  });
}

// ─── Telegram ─────────────────────────────────────────────────────────────────
function sendTelegram(text) {
  CHAT_IDS.forEach(chatId => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🎮 Join Discord', url: 'https://discord.gg/5gjbrjMtMB' }]] } });
    const req = https.request({ hostname: 'api.telegram.org', path: `/bot${BOT_TOKEN}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => { res.on('data', () => {}); res.on('end', () => {}); });
    req.on('error', () => {});
    req.write(body);
    req.end();
  });
}

function callRailway(path, data) {
  const body = JSON.stringify(data);
  const req = https.request({ hostname: RAILWAY_URL, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => { res.on('data', () => {}); res.on('end', () => {}); });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

// ─── Deduplication ────────────────────────────────────────────────────────────
const seen = new Map();
function isDuplicate(key) {
  const now = Date.now();
  if (seen.has(key) && now - seen.get(key) < 15000) return true;
  seen.set(key, now);
  if (seen.size > 500) for (const [k, ts] of seen) { if (now - ts > 15000) seen.delete(k); }
  return false;
}

const hrDedup = new Map();
const HR_DEDUP_MS = 30000;

// ─── Bridge WebSocket Stake ───────────────────────────────────────────────────
let stakeWS = null;

function connectStake() {
  if (!STAKE_SESSION) {
    console.error('[Bridge] Pas de STAKE_SESSION — configure la variable Railway');
    setTimeout(connectStake, 60000);
    return;
  }

  console.log('[Bridge] Connexion a Stake...');
  stakeWS = new WebSocket(STAKE_WS_URL, 'graphql-transport-ws', {
    headers: {
      'Cookie':     `session=${STAKE_SESSION}`,
      'Origin':     'https://stake.bet',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    }
  });

  const subMap = {};

  stakeWS.on('open', () => {
    console.log('[Bridge] WS Stake ouvert — auth...');
    stakeWS.send(JSON.stringify({ type: 'connection_init', payload: {} }));
  });

  stakeWS.on('message', raw => {
    try {
      const d = JSON.parse(raw);

      if (d.type === 'connection_ack') {
        console.log('[Bridge] Auth OK — souscription de', Object.keys(chatMap).length, 'chats');
        Object.keys(chatMap).forEach((chatId, i) => {
          const id = String(9000 + i);
          subMap[id] = chatId;
          setTimeout(() => {
            if (stakeWS.readyState === 1) {
              stakeWS.send(JSON.stringify({ id, type: 'subscribe', payload: { query: QUERY, variables: { chatId } } }));
            }
          }, i * 50);
        });
      }

      if (d.type === 'ping') stakeWS.send(JSON.stringify({ type: 'pong' }));

      if (d.type === 'next' && d.payload && d.payload.data && d.payload.data.chatMessages) {
        const cm      = d.payload.data.chatMessages;
        const msgData = cm.data || {};
        const type    = msgData.__typename || '';
        const user    = cm.user || {};
        const sender  = user.name || 'Inconnu';
        const chatId  = subMap[d.id] || 'unknown';
        const chat    = chatMap[chatId] || chatId;
        const isHR    = !!user.isHighroller;

        if (type === 'ChatMessageDataText') {
          const text = msgData.message || '';
          if (!text || text.length < 2) return;
          if (isDuplicate(text.substring(0, 80))) return;
          // Mentions
          const mentionMatch = text.match(/@([A-Za-z0-9_]{2,25})/g);
          if (mentionMatch) {
            mentionMatch.forEach(tag => {
              const mentioned = tag.replace('@', '').toLowerCase();
              firebasePushMention(mentioned, sender, text, chatId);
              callRailway('/notify-mention', { mentioned, sender, chatId, message: text, time: new Date().toLocaleTimeString('en-US') });
            });
          }
          // HR
          if (isHR) {
            const dedupKey = sender + '|' + text.substring(0, 30);
            const now = Date.now();
            if (!hrDedup.has(dedupKey) || now - hrDedup.get(dedupKey) > HR_DEDUP_MS) {
              hrDedup.set(dedupKey, now);
              console.log(`[Bridge] HR: ${sender} | ${text.substring(0, 60)}`);
              firebasePushHR({ ts: now, sender, message: text, chat, chatId, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) });
            }
          }

        } else if (type === 'ChatMessageDataRain') {
          const rain       = msgData.rain || {};
          const amount     = rain.amount ? parseFloat(rain.amount) : 0;
          const currency   = (rain.currency || '').toUpperCase();
          const rainUsers  = rain.rainUsers || [];
          const recipients = rainUsers.map(r => r.user && r.user.name).filter(Boolean);
          const nb         = recipients.length;
          const key        = `rain|${chatId}|${amount}|${recipients.slice(0,5).join(',')}|${Math.floor(Date.now()/30000)}`;
          if (isDuplicate(key)) return;
          console.log(`[Bridge] Rain ${amount} ${currency} -> ${nb} joueurs | ${chat}`);
          getCryptoPrice(currency, (price, priceEur) => {
            const amountEach = nb > 0 ? amount / nb : amount;
            const usdEach    = price    ? (amountEach * price).toFixed(2)    : null;
            const usdTotal   = price    ? parseFloat((amount * price).toFixed(2)) : null;
            const eurEach    = priceEur ? (amountEach * priceEur).toFixed(2) : null;
            const eurTotal   = priceEur ? parseFloat((amount * priceEur).toFixed(2)) : null;
            const ts         = Date.now();
            const time       = new Date().toLocaleTimeString('en-US');
            const rainEmoji  = !usdEach ? '🌧' : parseFloat(usdEach) < 1 ? '🌦' : parseFloat(usdEach) < 5 ? '🌧' : parseFloat(usdEach) < 20 ? '⛈' : parseFloat(usdEach) < 50 ? '🌊' : '🚀';
            // Push Firebase
            firebasePushRain({ ts, sender, chat, chatId, currency, amount: amountEach, recipients, usdEach, usdTotal: usdTotal ? usdTotal.toString() : null, eurEach, eurTotal: eurTotal ? eurTotal.toString() : null });
            firebasePushRainer({ ts, sender, amount: amountEach, currency, usdTotal: usdTotal ? usdTotal.toString() : null, eurTotal: eurTotal ? eurTotal.toString() : null, chatId });
            // Telegram
            const list = recipients.slice(0, 15).join(', ') + (recipients.length > 15 ? '...' : '');
            sendTelegram(
              `${rainEmoji} <b>Rain on Stake!</b>\n💬 Chat: <b>${chat}</b>\n👤 From: <b>${sender}</b>\n` +
              (usdEach ? `💰 <b>$${usdEach} / €${eurEach} per player</b>\n` : '') +
              (usdTotal ? `💵 <b>$${usdTotal} / €${eurTotal} total</b> (${nb} players)\n` : `👥 ${nb} players\n`) +
              (list ? `👥 ${list}\n` : '') + `🕐 ${time}`
            );
            // Notif Railway
            callRailway('/notify-rain', { recipients, sender, chatId, amount, currency, usdEach, usdTotal: usdTotal ? usdTotal.toString() : null, eurEach, eurTotal: eurTotal ? eurTotal.toString() : null, time });
          });
        }
      }
    } catch(e) {}
  });

  stakeWS.on('close', code => {
    console.log(`[Bridge] Deconnecte de Stake (${code}) — reconnexion dans 60s`);
    setTimeout(connectStake, 60000);
  });

  stakeWS.on('error', err => {
    console.error('[Bridge] Erreur WS:', err.message);
  });
}



function startBridge() {
  connectStake();
  console.log('[Bridge] v3.0.0 Railway — rains + mentions + HR + Firebase');
}
