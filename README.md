# Crown Rich Korporatsiyasi veb-sayti

Ushbu loyiha Crown Rich Korporatsiyasi uchun ko'p sahifali, responsive va zamonaviy korporativ veb-sayt namunasi.

## Tuzilma

- index.html - Bosh sahifa
- about.html - Kompaniya haqida
- services.html - Rich BFQ mahsulotlari katalogi
- product-detail.html - Har bir mahsulot uchun batafsil sahifa
- news.html - Yangiliklar ro'yxati (pagination bilan)
- news-detail.html - Yangilikning batafsil sahifasi
- contact.html - Kontakt, xarita placeholder va FAQ
- style.css - Asosiy dizayn uslublari
- responsive.css - Mobil/planshet moslashuv uslublari
- main.js - Interaktiv funksiyalar
- images/ - Placeholder rasmlar

## Ishlatilgan funksiyalar

- Sticky header va burger menyu
- Smooth scrolling
- Fade/slide reveal animatsiyalari
- Lazy loading rasmlar
- Back to top tugmasi
- Form validation (kontakt va modal)
- Modal oynasi (tezkor so'rov)
- Dark mode (localStorage bilan)
- Cookie consent banner
- Chatbot placeholder
- News pagination
- Rich BFQ mahsulot katalogi va alohida mahsulot sahifasi
- SEO-friendly meta teglar
- Telegram bot integratsiyasi (backend endpoint orqali)
- Admin panel orqali yangiliklarni boshqarish (CRUD)
- So'rov loglarini JSON faylga saqlash

## Ishga tushirish

1. Node.js 18+ o'rnatilganini tekshiring.
1. Loyiha papkasida quyidagilarni bajaring:

```bash
npm install
```

1. .env fayl yarating (namuna uchun .env.example dan foydalaning):

```env
TELEGRAM_BOT_TOKEN=bot_token
TELEGRAM_CHAT_ID=chat_id
ADMIN_PANEL_KEY=strong_key
PORT=3000
```

1. Serverni ishga tushiring:

```bash
npm start
```

1. Saytni oching:

<http://localhost:3000>

## Telegram bot sozlash

1. BotFather orqali bot yarating va token oling.
1. Botni o'zingizning kanal/guruhga admin qiling (agar guruhga yuborsangiz).
1. Chat ID ni oling:

- Botga xabar yuboring
- [Telegram getUpdates](https://api.telegram.org/bot%3CYOUR_BOT_TOKEN%3E/getUpdates) orqali `chat.id` ni oling

1. Olingan token va chat id ni .env faylga yozing.
1. Botga `/msgLogs` yuborsangiz, `data/message-logs.json` fayli hujjat sifatida yuboriladi.

## Admin panel

1. Admin sahifani oching: <http://localhost:3000/admin.html>
1. `.env` dagi `ADMIN_PANEL_KEY` qiymatini kiriting va saqlang.
1. Yangilik qo'shish/tahrirlash/o'chirish amallarini bajaring.
1. News sahifasi ma'lumotlari `data/news.json` orqali avtomatik yangilanadi.

## Xabar loglari

1. Har bir forma yuborilishi `data/message-logs.json` ga yoziladi.
1. Log yozuvlar soni serverda oxirgi 1000 ta yozuv bilan cheklanadi.
