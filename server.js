require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const adminKey = process.env.ADMIN_PANEL_KEY || 'change-me';
const dataDir = path.join(__dirname, 'data');
const newsFilePath = path.join(dataDir, 'news.json');
const messageLogsFilePath = path.join(dataDir, 'message-logs.json');
const crmFilePath = path.join(dataDir, 'crm.json');
const maxMessageLogs = 1000;

const defaultCrm = {
  clients: [],
  leads: [],
  tasks: []
};

const defaultNews = [
  {
    id: 'news-1',
    title: 'MMF Farm Group dori vositalarini qadoqlash liniyasini ishga tushirdi',
    date: '2026-03-19',
    excerpt: "Yangi liniya dori partiyalarini tayyorlash va qadoqlash tezligini oshiradi.",
    content:
      "Crown Rich tarkibidagi MMF Farm Group korxonasi dori vositalarini tayyorlash va qadoqlash bo'yicha yangi liniyani ishga tushirdi. Jarayonlar sifat va xavfsizlik standartlari asosida avtomatlashtirilgan.",
    image: 'images/news-1.svg'
  },
  {
    id: 'news-5',
    title: 'Crown Rich raqamli transformatsiya dasturini kengaytirdi',
    date: '2026-02-25',
    excerpt: "Ichki operatsion monitoring uchun yangi dashboardlar joriy qilindi.",
    content: "Raqamli transformatsiya doirasida bo'limlar kesimida KPI monitoring jarayonlari to'liq raqamlashtirildi.",
    image: 'images/news-5.svg'
  },
  {
    id: 'news-6',
    title: "Yil yakuni bo'yicha korporatsiya 34% o'sishni qayd etdi",
    date: '2026-02-18',
    excerpt: "Asosiy o'sish savdo va xizmat yo'nalishlaridagi investitsiyalar hisobiga erishildi.",
    content: "Korporatsiya hisobotiga ko'ra, asosiy o'sish drayverlari sifatida xizmatlar diversifikatsiyasi va yangi bozorlar ko'rsatildi.",
    image: 'images/news-6.svg'
  }
];

async function ensureNewsStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(newsFilePath);
  } catch (_error) {
    await fs.writeFile(newsFilePath, JSON.stringify(defaultNews, null, 2), 'utf8');
  }
}

async function ensureMessageLogsStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(messageLogsFilePath);
  } catch (_error) {
    await fs.writeFile(messageLogsFilePath, JSON.stringify([], null, 2), 'utf8');
  }
}

async function readMessageLogs() {
  await ensureMessageLogsStorage();
  const raw = await fs.readFile(messageLogsFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeMessageLogs(items) {
  await ensureMessageLogsStorage();
  await fs.writeFile(messageLogsFilePath, JSON.stringify(items, null, 2), 'utf8');
}

async function appendMessageLog(entry) {
  const items = await readMessageLogs();
  items.push(entry);
  const trimmed = items.slice(-maxMessageLogs);
  await writeMessageLogs(trimmed);
}

async function readNews() {
  await ensureNewsStorage();
  const raw = await fs.readFile(newsFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeNews(newsItems) {
  await ensureNewsStorage();
  await fs.writeFile(newsFilePath, JSON.stringify(newsItems, null, 2), 'utf8');
}

async function ensureCrmStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(crmFilePath);
  } catch (_error) {
    await fs.writeFile(crmFilePath, JSON.stringify(defaultCrm, null, 2), 'utf8');
  }
}

function normalizeCrmState(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    clients: Array.isArray(source.clients) ? source.clients : [],
    leads: Array.isArray(source.leads) ? source.leads : [],
    tasks: Array.isArray(source.tasks) ? source.tasks : []
  };
}

async function readCrm() {
  await ensureCrmStorage();
  const raw = await fs.readFile(crmFilePath, 'utf8');
  return normalizeCrmState(JSON.parse(raw));
}

async function writeCrm(state) {
  await ensureCrmStorage();
  await fs.writeFile(crmFilePath, JSON.stringify(normalizeCrmState(state), null, 2), 'utf8');
}

function byDateDesc(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function validateAdmin(req, res, next) {
  const incoming = req.header('x-admin-key');
  if (!incoming || incoming !== adminKey) {
    return res.status(401).json({ ok: false, message: 'Admin kaliti noto\'g\'ri' });
  }
  return next();
}

function normalizeNewsPayload(payload = {}) {
  return {
    title: String(payload.title || '').trim(),
    date: String(payload.date || '').trim(),
    excerpt: String(payload.excerpt || '').trim(),
    content: String(payload.content || '').trim(),
    image: String(payload.image || '').trim() || 'images/news-1.svg'
  };
}

function isNewsPayloadValid(payload) {
  return Boolean(payload.title && payload.date && payload.excerpt && payload.content);
}

function normalizeClientPayload(payload = {}) {
  return {
    name: String(payload.name || '').trim(),
    company: String(payload.company || '').trim(),
    phone: String(payload.phone || '').trim(),
    email: String(payload.email || '').trim(),
    status: String(payload.status || 'new').trim() || 'new',
    source: String(payload.source || '').trim(),
    note: String(payload.note || '').trim()
  };
}

function normalizeLeadPayload(payload = {}) {
  return {
    title: String(payload.title || '').trim(),
    clientName: String(payload.clientName || '').trim(),
    phone: String(payload.phone || '').trim(),
    value: Number(payload.value || 0),
    stage: String(payload.stage || 'new').trim() || 'new',
    owner: String(payload.owner || '').trim(),
    nextActionDate: String(payload.nextActionDate || '').trim(),
    note: String(payload.note || '').trim()
  };
}

function normalizeTaskPayload(payload = {}) {
  return {
    title: String(payload.title || '').trim(),
    assignee: String(payload.assignee || '').trim(),
    dueDate: String(payload.dueDate || '').trim(),
    priority: String(payload.priority || 'normal').trim() || 'normal',
    status: String(payload.status || 'todo').trim() || 'todo',
    relatedType: String(payload.relatedType || '').trim(),
    relatedId: String(payload.relatedId || '').trim(),
    note: String(payload.note || '').trim()
  };
}

function isClientValid(payload) {
  return Boolean(payload.name && payload.phone);
}

function isLeadValid(payload) {
  return Boolean(payload.title && payload.stage);
}

function isTaskValid(payload) {
  return Boolean(payload.title && payload.status);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const fieldLabelMap = {
  name: 'Ism',
  company: 'Kompaniya',
  email: 'Email',
  phone: 'Telefon',
  department: "Yo'nalish",
  message: 'Xabar'
};

const preferredFieldOrder = ['name', 'company', 'email', 'phone', 'department', 'message'];

function formatSourceLabel(source) {
  return String(source || 'Web Form').trim();
}

function sourceToHashtag(source) {
  const normalized = String(source || 'web_form')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const safe = normalized || 'web_form';
  return `#${safe}`;
}

function formatPageLabel(page) {
  const value = String(page || '/').trim();
  if (value === '/' || value === '') {
    return 'Asosiy sahifa';
  }
  return value;
}

function normalizeFields(fields = {}) {
  return Object.entries(fields)
    .map(([key, value]) => [String(key).trim(), String(value || '').trim()])
    .filter(([, value]) => value.length > 0);
}

function formatFieldRows(fields = {}) {
  const normalized = normalizeFields(fields);
  if (!normalized.length) {
    return '• Ma\'lumot kiritilmagan';
  }

  const orderIndex = new Map(preferredFieldOrder.map((key, index) => [key, index]));
  const sorted = normalized.sort((a, b) => {
    const aIndex = orderIndex.has(a[0]) ? orderIndex.get(a[0]) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.has(b[0]) ? orderIndex.get(b[0]) : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return a[0].localeCompare(b[0]);
  });

  return sorted
    .map(([key, value]) => {
      const label = fieldLabelMap[key] || key;
      return `• <b>${escapeHtml(label)}</b>: ${escapeHtml(value)}`;
    })
    .join('\n');
}

let telegramOffset = 0;

function isAuthorizedChat(chat = {}) {
  if (!chatId) {
    return false;
  }

  const configured = String(chatId).trim();
  const incomingId = String(chat.id || '').trim();
  const incomingUsername = String(chat.username || '').trim();

  if (!configured) {
    return false;
  }

  if (configured.startsWith('@')) {
    return configured.slice(1).toLowerCase() === incomingUsername.toLowerCase();
  }

  return configured === incomingId;
}

async function sendTelegramText(targetChatId, text) {
  return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: targetChatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
}

async function sendMessageLogsDocument(targetChatId) {
  await ensureMessageLogsStorage();
  const payload = await fs.readFile(messageLogsFilePath, 'utf8');
  const formData = new FormData();
  const blob = new Blob([payload], { type: 'application/json' });
  const filename = `message-logs-${new Date().toISOString().slice(0, 10)}.json`;

  formData.append('chat_id', String(targetChatId));
  formData.append('caption', "Crown Rich so'rov loglari");
  formData.append('document', blob, filename);

  return fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: formData
  });
}

async function handleBotCommand(message) {
  const text = String(message?.text || '').trim();
  const chat = message?.chat || {};

  if (!text.startsWith('/msgLogs')) {
    return;
  }

  if (!isAuthorizedChat(chat)) {
    await sendTelegramText(chat.id, 'Bu komandani ishlatish uchun ruxsat yo\'q.');
    return;
  }

  try {
    const response = await sendMessageLogsDocument(chat.id);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      await sendTelegramText(chat.id, 'Log faylini yuborishda xatolik yuz berdi.');
    }
  } catch (_error) {
    await sendTelegramText(chat.id, 'Log faylini yuborib bo\'lmadi.');
  }
}

async function pollTelegramCommands() {
  if (!botToken) {
    return;
  }

  try {
    const query = new URLSearchParams({ timeout: '20', offset: String(telegramOffset) }).toString();
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?${query}`);
    const data = await response.json();
    if (!response.ok || !data.ok || !Array.isArray(data.result)) {
      return;
    }

    for (const update of data.result) {
      telegramOffset = Math.max(telegramOffset, Number(update.update_id || 0) + 1);
      if (update.message?.text) {
        await handleBotCommand(update.message);
      }
    }
  } catch (_error) {
    // Polling errors are intentionally ignored to keep server alive.
  }
}

function startTelegramCommandPolling() {
  if (!botToken) {
    return;
  }

  setInterval(() => {
    pollTelegramCommands();
  }, 4000);
}

app.post('/api/telegram', async (req, res) => {
  if (!botToken || !chatId) {
    return res.status(500).json({ ok: false, message: 'Telegram konfiguratsiyasi topilmadi' });
  }

  const { source = 'Web Form', page = '-', fields = {} } = req.body || {};
  const formattedSource = formatSourceLabel(source);
  const sourceHashtag = sourceToHashtag(formattedSource);
  const formattedPage = formatPageLabel(page);
  const formattedFields = formatFieldRows(fields);

  const text = [
    '📩 <b>Yangi so\'rov</b>',
    `🏷️ <b>Manba:</b> ${escapeHtml(formattedSource)} ${escapeHtml(sourceHashtag)}`,
    `🌐 <b>Sahifa:</b> ${escapeHtml(formattedPage)}`,
    '',
    '🧾 <b>Ma\'lumotlar</b>',
    formattedFields
  ].join('\n');

  try {
    const logEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      source: formattedSource,
      page: formattedPage,
      fields: normalizeFields(fields).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {})
    };

    await appendMessageLog(logEntry);

    const telegramRes = await sendTelegramText(chatId, text);

    const telegramData = await telegramRes.json();
    if (!telegramRes.ok || !telegramData.ok) {
      return res.status(502).json({ ok: false, message: 'Telegram API xatosi', details: telegramData });
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Server xatosi', details: error.message });
  }
});

app.get('/api/news', async (_req, res) => {
  try {
    const news = await readNews();
    return res.json({ ok: true, items: news.sort(byDateDesc) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Yangiliklarni o\'qishda xatolik', details: error.message });
  }
});

app.get('/api/news/:id', async (req, res) => {
  try {
    const news = await readNews();
    const item = news.find((entry) => entry.id === req.params.id);
    if (!item) {
      return res.status(404).json({ ok: false, message: 'Yangilik topilmadi' });
    }
    return res.json({ ok: true, item });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Yangilikni o\'qishda xatolik', details: error.message });
  }
});

app.post('/api/news', validateAdmin, async (req, res) => {
  try {
    const payload = normalizeNewsPayload(req.body);
    if (!isNewsPayloadValid(payload)) {
      return res.status(400).json({ ok: false, message: 'Majburiy maydonlar to\'liq emas' });
    }

    const news = await readNews();
    const created = {
      id: crypto.randomUUID(),
      ...payload
    };

    news.push(created);
    await writeNews(news);
    return res.status(201).json({ ok: true, item: created });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Yangilik qo\'shishda xatolik', details: error.message });
  }
});

app.put('/api/news/:id', validateAdmin, async (req, res) => {
  try {
    const payload = normalizeNewsPayload(req.body);
    if (!isNewsPayloadValid(payload)) {
      return res.status(400).json({ ok: false, message: 'Majburiy maydonlar to\'liq emas' });
    }

    const news = await readNews();
    const index = news.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Yangilik topilmadi' });
    }

    news[index] = {
      id: news[index].id,
      ...payload
    };

    await writeNews(news);
    return res.json({ ok: true, item: news[index] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Yangilikni yangilashda xatolik', details: error.message });
  }
});

app.delete('/api/news/:id', validateAdmin, async (req, res) => {
  try {
    const news = await readNews();
    const nextNews = news.filter((entry) => entry.id !== req.params.id);

    if (nextNews.length === news.length) {
      return res.status(404).json({ ok: false, message: 'Yangilik topilmadi' });
    }

    await writeNews(nextNews);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Yangilikni o\'chirishda xatolik', details: error.message });
  }
});

app.get('/api/crm', validateAdmin, async (_req, res) => {
  try {
    const state = await readCrm();
    return res.json({ ok: true, state });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'CRM ma\'lumotlarini o\'qishda xatolik', details: error.message });
  }
});

app.post('/api/crm/clients', validateAdmin, async (req, res) => {
  try {
    const payload = normalizeClientPayload(req.body);
    if (!isClientValid(payload)) {
      return res.status(400).json({ ok: false, message: 'Mijoz uchun majburiy maydonlar to\'liq emas' });
    }

    const state = await readCrm();
    const created = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...payload };
    state.clients.push(created);
    await writeCrm(state);
    return res.status(201).json({ ok: true, item: created });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Mijoz qo\'shishda xatolik', details: error.message });
  }
});

app.put('/api/crm/clients/:id', validateAdmin, async (req, res) => {
  try {
    const payload = normalizeClientPayload(req.body);
    if (!isClientValid(payload)) {
      return res.status(400).json({ ok: false, message: 'Mijoz uchun majburiy maydonlar to\'liq emas' });
    }

    const state = await readCrm();
    const index = state.clients.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Mijoz topilmadi' });
    }

    state.clients[index] = { ...state.clients[index], ...payload };
    await writeCrm(state);
    return res.json({ ok: true, item: state.clients[index] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Mijozni yangilashda xatolik', details: error.message });
  }
});

app.delete('/api/crm/clients/:id', validateAdmin, async (req, res) => {
  try {
    const state = await readCrm();
    const next = state.clients.filter((item) => item.id !== req.params.id);
    if (next.length === state.clients.length) {
      return res.status(404).json({ ok: false, message: 'Mijoz topilmadi' });
    }
    state.clients = next;
    await writeCrm(state);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Mijozni o\'chirishda xatolik', details: error.message });
  }
});

app.post('/api/crm/leads', validateAdmin, async (req, res) => {
  try {
    const payload = normalizeLeadPayload(req.body);
    if (!isLeadValid(payload)) {
      return res.status(400).json({ ok: false, message: 'Lead uchun majburiy maydonlar to\'liq emas' });
    }

    const state = await readCrm();
    const created = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...payload };
    state.leads.push(created);
    await writeCrm(state);
    return res.status(201).json({ ok: true, item: created });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Lead qo\'shishda xatolik', details: error.message });
  }
});

app.put('/api/crm/leads/:id', validateAdmin, async (req, res) => {
  try {
    const payload = normalizeLeadPayload(req.body);
    if (!isLeadValid(payload)) {
      return res.status(400).json({ ok: false, message: 'Lead uchun majburiy maydonlar to\'liq emas' });
    }

    const state = await readCrm();
    const index = state.leads.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Lead topilmadi' });
    }

    state.leads[index] = { ...state.leads[index], ...payload };
    await writeCrm(state);
    return res.json({ ok: true, item: state.leads[index] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Leadni yangilashda xatolik', details: error.message });
  }
});

app.delete('/api/crm/leads/:id', validateAdmin, async (req, res) => {
  try {
    const state = await readCrm();
    const next = state.leads.filter((item) => item.id !== req.params.id);
    if (next.length === state.leads.length) {
      return res.status(404).json({ ok: false, message: 'Lead topilmadi' });
    }
    state.leads = next;
    await writeCrm(state);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Leadni o\'chirishda xatolik', details: error.message });
  }
});

app.post('/api/crm/tasks', validateAdmin, async (req, res) => {
  try {
    const payload = normalizeTaskPayload(req.body);
    if (!isTaskValid(payload)) {
      return res.status(400).json({ ok: false, message: 'Vazifa uchun majburiy maydonlar to\'liq emas' });
    }

    const state = await readCrm();
    const created = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...payload };
    state.tasks.push(created);
    await writeCrm(state);
    return res.status(201).json({ ok: true, item: created });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Vazifa qo\'shishda xatolik', details: error.message });
  }
});

app.put('/api/crm/tasks/:id', validateAdmin, async (req, res) => {
  try {
    const payload = normalizeTaskPayload(req.body);
    if (!isTaskValid(payload)) {
      return res.status(400).json({ ok: false, message: 'Vazifa uchun majburiy maydonlar to\'liq emas' });
    }

    const state = await readCrm();
    const index = state.tasks.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Vazifa topilmadi' });
    }

    state.tasks[index] = { ...state.tasks[index], ...payload };
    await writeCrm(state);
    return res.json({ ok: true, item: state.tasks[index] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Vazifani yangilashda xatolik', details: error.message });
  }
});

app.delete('/api/crm/tasks/:id', validateAdmin, async (req, res) => {
  try {
    const state = await readCrm();
    const next = state.tasks.filter((item) => item.id !== req.params.id);
    if (next.length === state.tasks.length) {
      return res.status(404).json({ ok: false, message: 'Vazifa topilmadi' });
    }
    state.tasks = next;
    await writeCrm(state);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Vazifani o\'chirishda xatolik', details: error.message });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

ensureNewsStorage()
  .then(() => {
    return ensureMessageLogsStorage();
  })
  .then(() => {
    return ensureCrmStorage();
  })
  .then(() => {
    startTelegramCommandPolling();
    app.listen(port, () => {
      console.log(`Crown Rich server ishga tushdi: http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Serverni ishga tushirishda xatolik:', error.message);
    process.exit(1);
  });
