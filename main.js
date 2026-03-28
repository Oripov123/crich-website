const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const backTop = document.getElementById('backTop');
const yearNode = document.getElementById('year');
const siteLoader = document.getElementById('siteLoader');

if (siteLoader) {
  window.addEventListener('load', () => {
    setTimeout(() => siteLoader.classList.add('hide'), 350);
  });
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const savedTheme = localStorage.getItem('cr-theme');
if (savedTheme === 'dark') {
  body.classList.add('dark');
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    localStorage.setItem('cr-theme', body.classList.contains('dark') ? 'dark' : 'light');
  });
}

if (backTop) {
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('show', window.scrollY > 300);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min((window.scrollY / docHeight) * 100, 100) : 0;
    document.body.style.setProperty('--scroll-progress', `${progress}%`);
  });

  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Reveal on scroll animation
const revealNodes = document.querySelectorAll('.reveal');
revealNodes.forEach((node, index) => {
  const delay = Math.min(index * 70, 420);
  node.style.setProperty('--reveal-delay', `${delay}ms`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);
revealNodes.forEach((node) => revealObserver.observe(node));

// Lazy loading visual state
const lazyImgs = document.querySelectorAll('.lazy-img');
lazyImgs.forEach((img) => {
  const setLoaded = () => {
    img.classList.add('loaded');
    const holder = img.closest('.media-skeleton');
    if (holder) {
      holder.classList.remove('loading');
    }
  };

  if (img.complete) {
    setLoaded();
  } else {
    img.addEventListener('load', setLoaded);
  }
});

// Modal
const openModalButtons = document.querySelectorAll('.open-modal');
const closeModalButtons = document.querySelectorAll('.modal-close');

openModalButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = document.querySelector(btn.getAttribute('data-modal-target'));
    if (target) {
      target.classList.add('open');
      target.setAttribute('aria-hidden', 'false');
    }
  });
});

closeModalButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  });
});

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  });
});

// Cookie consent
const cookieBanner = document.getElementById('cookieBanner');
const acceptCookies = document.getElementById('acceptCookies');
if (cookieBanner && acceptCookies) {
  const cookieAccepted = localStorage.getItem('cr-cookie-accepted') === '1';
  if (cookieAccepted) {
    cookieBanner.classList.add('hide');
  }

  acceptCookies.addEventListener('click', () => {
    localStorage.setItem('cr-cookie-accepted', '1');
    cookieBanner.classList.add('hide');
  });
}

// Chatbot placeholder
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotBox = document.getElementById('chatbotBox');
if (chatbotToggle && chatbotBox) {
  chatbotToggle.addEventListener('click', () => {
    chatbotBox.classList.toggle('open');
  });
}

// Form validation
const forms = document.querySelectorAll('form[data-validate]');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s()-]{7,}$/;
const telegramEndpoint = '/api/telegram';

function extractFormSource(form) {
  const blockTitle = form.closest('.modal-content, .section, .panel')?.querySelector('h2, h3');
  return blockTitle ? blockTitle.textContent.trim() : 'Website form';
}

function collectFormFields(form) {
  const data = new FormData(form);
  const fields = {};

  data.forEach((value, key) => {
    fields[key] = String(value).trim();
  });

  return fields;
}

async function submitToTelegram(form) {
  const payload = {
    source: extractFormSource(form),
    page: window.location.pathname,
    fields: collectFormFields(form)
  };

  const response = await fetch(telegramEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Telegramga yuborishda xatolik yuz berdi');
  }
}

forms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const msg = form.querySelector('.form-message');
    const submitBtn = form.querySelector('button[type="submit"]');
    const initialBtnText = submitBtn ? submitBtn.textContent : '';

    if (msg) {
      msg.classList.remove('error', 'success');
      msg.textContent = '';
    }

    let isValid = true;
    const controls = form.querySelectorAll('input, textarea, select');
    controls.forEach((control) => {
      if (control.hasAttribute('required') && !String(control.value).trim()) {
        isValid = false;
      }

      if (control.type === 'email' && control.value && !emailPattern.test(control.value.trim())) {
        isValid = false;
      }

      if (control.type === 'tel' && control.value && !phonePattern.test(control.value.trim())) {
        isValid = false;
      }
    });

    if (!isValid) {
      if (msg) {
        msg.textContent = "Iltimos, barcha maydonlarni to'g'ri to'ldiring.";
        msg.classList.add('error');
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Yuborilmoqda...';
    }

    try {
      await submitToTelegram(form);
      if (msg) {
        msg.textContent = "Rahmat! So'rovingiz Telegram botga yuborildi.";
        msg.classList.add('success');
      }
      form.reset();
    } catch (_error) {
      if (msg) {
        msg.textContent = "Yuborib bo'lmadi. Iltimos, keyinroq qayta urinib ko'ring.";
        msg.classList.add('error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = initialBtnText;
      }
    }
  });
});

function formatNewsDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function wireLazyImage(imageNode) {
  if (!imageNode) {
    return;
  }
  imageNode.addEventListener('load', () => {
    imageNode.classList.add('loaded');
  });
}

// News pagination and dynamic feed
const newsList = document.querySelector('.news-list');
const pagination = document.getElementById('pagination');
const newsCardTemplate = document.getElementById('newsCardTemplate');
const newsListMessage = document.getElementById('newsListMessage');

function setNewsMessage(text, type = '') {
  if (!newsListMessage) {
    return;
  }
  newsListMessage.textContent = text;
  newsListMessage.classList.remove('error', 'success');
  if (type) {
    newsListMessage.classList.add(type);
  }
}

function drawNewsPagination(items, pageSize) {
  if (!pagination) {
    return;
  }

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  let currentPage = 1;

  const draw = () => {
    items.forEach((item, index) => {
      const start = (currentPage - 1) * pageSize;
      const end = currentPage * pageSize;
      item.style.display = index >= start && index < end ? '' : 'none';
    });

    pagination.innerHTML = '';
    for (let i = 1; i <= pageCount; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(i);
      if (i === currentPage) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        currentPage = i;
        draw();
        window.scrollTo({ top: 180, behavior: 'smooth' });
      });
      pagination.appendChild(btn);
    }
  };

  draw();
}

async function initDynamicNewsList() {
  if (!newsList || !pagination || newsList.dataset.dynamic !== 'true' || !newsCardTemplate) {
    return false;
  }

  const pageSize = Number(newsList.dataset.pageSize || 3);

  try {
    const response = await fetch('/api/news');
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'Yangiliklar yuklanmadi');
    }

    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      newsList.innerHTML = '';
      pagination.innerHTML = '';
      setNewsMessage('Yangiliklar mavjud emas');
      return true;
    }

    const fragments = items.map((item) => {
      const node = newsCardTemplate.content.firstElementChild.cloneNode(true);
      const image = node.querySelector('img');
      const date = node.querySelector('.news-date');
      const title = node.querySelector('h3');
      const excerpt = node.querySelector('.news-excerpt');
      const link = node.querySelector('.card-link');

      if (image) {
        image.src = item.image || 'images/news-1.svg';
        image.alt = item.title || 'News';
        wireLazyImage(image);
      }

      if (date) {
        date.textContent = formatNewsDate(item.date || '');
      }

      if (title) {
        title.textContent = item.title || 'Sarlavha';
      }

      if (excerpt) {
        excerpt.textContent = item.excerpt || '';
      }

      if (link) {
        link.href = `news-detail.html?id=${encodeURIComponent(item.id)}`;
      }

      return node;
    });

    newsList.innerHTML = '';
    fragments.forEach((card) => newsList.appendChild(card));
    drawNewsPagination(Array.from(newsList.querySelectorAll('.news-item')), pageSize);
    setNewsMessage('');
    return true;
  } catch (error) {
    setNewsMessage(error.message, 'error');
    return false;
  }
}

async function initNewsDetailPage() {
  if (!document.querySelector('[data-news-detail]')) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const newsId = params.get('id');
  if (!newsId) {
    return;
  }

  const titleNode = document.querySelector('[data-news-title]');
  const dateNode = document.querySelector('[data-news-date]');
  const imageNode = document.querySelector('[data-news-image]');
  const excerptNode = document.querySelector('[data-news-excerpt]');
  const contentNode = document.querySelector('[data-news-content]');
  const messageNode = document.querySelector('[data-news-detail-message]');

  try {
    const response = await fetch(`/api/news/${encodeURIComponent(newsId)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'Yangilik topilmadi');
    }

    const item = data.item;
    if (titleNode) {
      titleNode.textContent = item.title;
    }
    if (dateNode) {
      dateNode.textContent = formatNewsDate(item.date);
    }
    if (imageNode) {
      imageNode.src = item.image || 'images/news-1.svg';
      imageNode.alt = item.title || 'Yangilik tasviri';
      wireLazyImage(imageNode);
    }
    if (excerptNode) {
      excerptNode.textContent = item.excerpt;
    }
    if (contentNode) {
      contentNode.textContent = item.content;
    }
    if (messageNode) {
      messageNode.textContent = '';
    }
  } catch (error) {
    if (messageNode) {
      messageNode.textContent = error.message;
      messageNode.classList.add('error');
    }
  }
}

const richProducts = {
  'rich-immuno-stim': {
    name: 'Rich IMMUNO STIM',
    image: 'images/stim.jpg',
    type: 'Tabiiy antianemik va immunomodulyator sirop · 200 ml',
    purpose: "Anemiya profilaktikasi va immunitetni qo'llab-quvvatlash uchun mo'ljallangan tabiiy vosita.",
    usage:
      "Immunodefitsit, antibiotiklar bilan davolanishda majmuaviy terapiya, bolalarda charchoq fonida diqqat pasayishi, gipovitaminoz, homiladorlik va laktatsiya davri, bolalarda jadal o'sish davri, operatsiyadan keyingi tiklanish, keksalarda quvvatlantirish, anemiya, jismoniy va aqliy toliqishda qo'llaniladi.",
    composition:
      "Har 5 ml siropda: na'matak sharbati konsentrati 100 mg, zirk (barbaris) mevasi ekstrakti 100 mg; vitaminlar C, E, B2, B12, B6, K, D3, A, PP (nikotinamid), B9 (foliy kislotasi); minerallar: temir (Fe) 50 mg, natriy (Na), magniy (Mg), fosfor (P); aminokislotalar.",
    feature:
      "Gematopoetik tizim va immun javobni qo'llab-quvvatlaydi, temir so'rilishini yaxshilashga yordam beradi, umumiy quvvatni oshiradi. Nojo'ya ta'sir sifatida allergik toshmalar kuzatilishi mumkin.",
    dosage:
      "Ovqatdan 30 daqiqa oldin ichiladi, ishlatishdan oldin silkitiladi. 1-4 yosh: 1 choy qoshiq kuniga 2-3 marta; 4-12 yosh: 1.5 choy qoshiq kuniga 2-3 marta; kattalar: 1 osh qoshiq kuniga 2-3 marta. Kurs davomiyligi 10-30 kun. Qarshi ko'rsatmalar: qandli diabet va mahsulot komponentlariga shaxsiy chidamsizlik.",
    storage: "Yorug'likdan himoyalangan joyda, 20°C dan yuqori bo'lmagan haroratda saqlansin. Yaroqlilik muddati: ishlab chiqarilgan sanadan boshlab 1 yil.",
    maker: 'MMF FARM GROUP TRADE MCHJ, Andijon viloyati, Asaka tumani.',
    certification: "Biologik faol qo'shimcha bo'lishi mumkin. Ishlatishdan oldin shifokor bilan maslahatlashish tavsiya etiladi."
  },
  'rich-pulmoklin': {
    name: 'Rich PULMOKLIN',
    image: 'images/hero.svg',
    type: 'Sirop',
    purpose: "Nafas yo'llari kasalliklari, yo'tal va balg'am ko'chirish qiyin holatlarida.",
    usage: "Nafas yo'llari faoliyatini qo'llab-quvvatlash va balg'am ajralishini yengillashtirish uchun.",
    composition:
      "Andiz, jambil (timyan), qalampir yalpiz, shirinmiya (solodka), na'matak, B, C, D, PP, E vitaminlari va mikroelementlar.",
    feature: "Yallig'lanishga qarshi, balg'amni yumshatuvchi va ko'chiruvchi ta'sirga ega.",
    dosage: "Qabul qilish tartibi shifokor tavsiyasi asosida individual belgilanadi.",
    storage: "0°C dan +20°C gacha, quruq va yorug'likdan himoyalangan joyda saqlang.",
    maker: 'MMF FARM GROUP TRADE MCHJ, Andijon viloyati, Asaka tumani.',
    certification: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi tomonidan ma'qullangan BFQ."
  },
  'rich-gemolayf': {
    name: 'Rich GEMOLAYF',
    image: 'images/gemolayf.jpg',
    type: 'Tabiiy sirop',
    purpose: "Qon kamligi (anemiya) profilaktikasi va organizmni umumiy quvvatlash uchun mo'ljallangan.",
    usage: "Anemiya xavfi bo'lganda, organizmda temir moddasi yetishmaganda va umumiy holsizlikda tavsiya etiladi.",
    composition:
      "Na'matak (shipovnik), temir moddasi, askorbin kislotasi (Vitamin C), foliy kislotasi va vitaminlar (A, B, P, K).",
    feature:
      "Gematopoetik tizimni yaxshilaydi, gemoglobin sintezini rag'batlantiradi, temir so'rilishini oshiradi, immun tizimini mustahkamlaydi, moddalar almashinuvini yaxshilaydi hamda jigar faoliyati va o't suyuqligi ajralishini tartibga solishga ko'maklashadi.",
    dosage: "Qabul qilish tartibi shifokor tavsiyasi asosida individual belgilanadi.",
    storage: "0°C dan +20°C gacha, quruq va yorug'likdan himoyalangan joyda saqlang.",
    maker: 'MMF FARM GROUP TRADE MCHJ, Andijon viloyati, Asaka tumani.',
    certification: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi tomonidan ma'qullangan BFQ."
  },
  'rich-neyroson': {
    name: 'Rich NEYROSON',
    image: 'images/neyroson.jpg',
    type: 'Tabiiy sirop · to\'q jigarrang',
    purpose: "Asab tizimini tinchlantiruvchi o'simlik asosidagi sirop, sedativ (tinchlantiruvchi) ta'sirga ega.",
    usage:
      "Nevroz, stress, uyqusizlik, yurak ritmi buzilishi, boshlang'ich gipertoniya, ateroskleroz, surunkali alkogolizm va talvasa profilaktikasida yordamchi vosita sifatida.",
    composition:
      "Arslonquyruq (Leonurus) 3.5 g, passiflora 5 g, yalpiz (Mentha piperita) 3.5 g, do'lana (Crataegus) 2.5 g, kiyik o'ti (Thymus/Serpyllum) 2.5 g; qo'shimcha moddalari: B, C, PP vitaminlari, rutin, karotin, aminokislotalar, arginin, sorbit, xolin va atsetilxolin.",
    feature:
      "Asabni tinchlantirishga, stress va talvasani kamaytirishga, uyquni yaxshilashga, yurak urishini me'yorlashtirishga, qon bosimini biroz pasaytirishga, bosh aylanishi va quloq shovqinini kamaytirishga hamda kayfiyatni ko'tarishga yordam beradi.",
    dosage:
      "2-6 yosh: 2.5 ml kuniga 2 mahal; 6-12 yosh: 5 ml kuniga 2 mahal; kattalar: 5-10 ml kuniga 3 mahal. Ovqat vaqtida suv bilan ichiladi. Davolanish kursi 2-4 hafta, zarur bo'lsa shifokor tavsiyasi bilan 1 oygacha davom ettiriladi. Tarkibiy qismlariga allergiya yoki individual sezuvchanlikda tavsiya etilmaydi.",
    storage: "0°C dan +20°C gacha, quruq va yorug'likdan himoyalangan joyda saqlang.",
    maker: 'MMF FARM GROUP TRADE MCHJ (2017-yildan faol farmatsevtika kompaniya), Andijon viloyati, Asaka tumani.',
    certification: "Neyroson kimyoviy kuchli dori emas, balki o'simlik asosidagi tinchlantiruvchi sirop hisoblanadi."
  },
  'rich-fitonefrin': {
    name: 'Rich FITONEFRIN',
    image: 'images/fitonefrin.jpg',
    type: 'Sirop · 200 ml',
    purpose: "Buyrak va siydik yo'llari faoliyatini yaxshilash, siydik haydash.",
    usage: "Buyrak faoliyatini qo'llab-quvvatlash va ortiqcha tuzlarni chiqarishga ko'maklashish uchun.",
    composition:
      "Pol-pola, na'matak, shirinmiya, makkajo'xori popugi va rastropsha ekstraktlari.",
    feature:
      "Tuzlarni haydashga yordam beradi, yallig'lanishni kamaytiradi va buyrak filtratsiyasini yaxshilaydi.",
    dosage: "Qabul qilish tartibi shifokor tavsiyasi asosida individual belgilanadi.",
    storage: "0°C dan +20°C gacha, quruq va yorug'likdan himoyalangan joyda saqlang.",
    maker: 'MMF FARM GROUP TRADE MCHJ, Andijon viloyati, Asaka tumani.',
    certification: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi tomonidan ma'qullangan BFQ."
  },
  'rich-renofitolin': {
    name: 'Rich RENOFITOLIN',
    image: 'images/hero.svg',
    type: 'Kapsula',
    purpose: "Buyrak va siydik yo'llari faoliyatini yaxshilash, toshlarni yumshatish uchun o'simliklar majmuasi.",
    usage:
      "Sistit, uretrit, pielonefrit kabi siydik yo'llari infeksiyalarida yordamchi vosita sifatida qo'llanadi va tuzlar to'planishini (kristalluriya) kamaytirishga ko'maklashadi.",
    composition:
      "Makka soqoli, pijma gullari, zveroboy o'ti, yalpiz moyi, romashka gullari, na'matak mevasi, sporish o'ti.",
    feature:
      "Buyrakdagi toshlarni yumshatish va og'riqsiz tushirishga yordam beradi; diuretik va yallig'lanishga qarshi xususiyatga ega.",
    dosage:
      "12 yoshdan kattalarga ovqatdan oldin kuniga 3 mahal 1 tadan kapsula. Davolanish kursi odatda 2 hafta. Tarkibiy qismlarga allergiya bo'lsa, homiladorlik va emizish davrida hamda 14 yoshgacha bo'lgan bolalarda tavsiya etilmaydi.",
    storage: "0°C dan +25°C gacha, quruq va yorug'likdan himoyalangan joyda saqlang.",
    maker: 'MMF FARM GROUP TRADE MCHJ, Andijon viloyati, Asaka tumani.',
    certification: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi tomonidan ma'qullangan BFQ."
  },
  'rich-male': {
    name: 'Rich MALE',
    image: 'images/hero.svg',
    type: 'Kapsula',
    purpose: "Erkaklar jinsiy salomatligini tiklash: potensiya, libido va bepushtlik holatlarida yordamchi.",
    usage: "Erkaklar reproduktiv tizimini qo'llab-quvvatlash uchun yordamchi BFQ sifatida.",
    composition:
      "L-Arginin, L-Karnitin, Rux (Zn), Selen (Se), Evrikoma va o'simlik ekstraktlari.",
    feature: "Testosteron darajasini tabiiy ravishda oshirish va sperma sifatini yaxshilashga yordam beradi.",
    dosage: "Qabul qilish tartibi shifokor tavsiyasi asosida individual belgilanadi.",
    storage: "0°C dan +25°C gacha, quruq va yorug'likdan himoyalangan joyda saqlang.",
    maker: 'MMF FARM GROUP TRADE MCHJ, Andijon viloyati, Asaka tumani.',
    certification: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi tomonidan ma'qullangan BFQ."
  },
  'rich-relaks-forte': {
    name: 'Rich RELAKS FORTE',
    image: 'images/hero.svg',
    type: 'Kapsula',
    purpose: "Tayanch-harakat tizimi va bo'g'imlar salomatligini qo'llab-quvvatlash.",
    usage: "Bo'g'imlar egiluvchanligini saqlash va tog'ay to'qimasini qo'llab-quvvatlash uchun.",
    composition:
      "Glyukozamin (150 mg), xondroitin sulfat (150 mg), vitamin C (25 mg), akula tog'ayi (300 mg).",
    feature: "Bo'g'imlar egiluvchanligini ta'minlaydi va tog'ay to'qimasini tiklashga yordam beradi.",
    dosage: "Qabul qilish tartibi shifokor tavsiyasi asosida individual belgilanadi.",
    storage: "0°C dan +25°C gacha, quruq va yorug'likdan himoyalangan joyda saqlang.",
    maker: 'MMF FARM GROUP TRADE MCHJ, Andijon viloyati, Asaka tumani.',
    certification: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi tomonidan ma'qullangan BFQ."
  },
  'rich-kaltsiybak': {
    name: 'Rich KALTSIYBAK',
    image: 'images/kalsiybak.jpg',
    type: 'Tabletka',
    purpose: "Suyak va tishlar mustahkamligi uchun kaltsiy va vitamin D3 manbai.",
    usage:
      "Osteoporoz profilaktikasi, o'sish davrida, homiladorlikda va menopauza vaqtida kaltsiyga bo'lgan ehtiyojni qondirish hamda mushak va asab faoliyatini qo'llab-quvvatlash uchun.",
    composition: "1 tabletkada: kaltsiy karbonat 625 mg (250 mg elementar kaltsiy), vitamin D3 125 IU.",
    feature: "Suyak va tishlarni mustahkamlaydi, kaltsiy almashinuvi hamda mushak-asab faoliyatini qo'llab-quvvatlaydi.",
    dosage: "Odatda ovqatdan keyin suv bilan kuniga 2 mahal 1 tadan tabletka (yoki shifokor ko'rsatmasi bo'yicha).",
    storage: "0°C dan +25°C gacha, quruq va yorug'likdan himoyalangan joyda saqlang.",
    maker: 'MMF FARM GROUP TRADE MCHJ, Andijon viloyati, Asaka tumani.',
    certification: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi tomonidan ma'qullangan BFQ."
  }
};

function setNodeText(selector, value) {
  const node = document.querySelector(selector);
  if (node) {
    node.textContent = value || '';
  }
}

function initProductDetailPage() {
  if (!document.querySelector('[data-product-detail]')) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || '';
  const product = richProducts[slug];
  const messageNode = document.querySelector('[data-product-message]');

  if (!product) {
    if (messageNode) {
      messageNode.textContent = "Mahsulot topilmadi. Katalogdan qayta tanlang.";
      messageNode.classList.add('error');
    }
    return;
  }

  setNodeText('[data-product-type]', product.type);
  setNodeText('[data-product-name]', product.name);
  setNodeText('[data-product-purpose]', product.purpose);
  setNodeText('[data-product-composition]', product.composition);
  setNodeText('[data-product-usage]', product.usage);
  setNodeText('[data-product-feature]', product.feature);
  setNodeText('[data-product-dosage]', product.dosage);
  setNodeText('[data-product-storage]', product.storage);
  setNodeText('[data-product-maker]', product.maker);
  setNodeText('[data-product-certification]', product.certification);
}

function injectBfqDisclaimer() {
  const footerInner = document.querySelector('.site-footer .footer-inner');
  if (!footerInner || footerInner.querySelector('.bfq-disclaimer')) {
    return;
  }

  const note = document.createElement('p');
  note.className = 'bfq-disclaimer';
  note.textContent = "Dori vositasi emas, BFQ. Qo'llashdan oldin shifokor bilan maslahatlashing.";
  footerInner.appendChild(note);
}

if (newsList && pagination) {
  initDynamicNewsList().then((isDynamicLoaded) => {
    if (isDynamicLoaded) {
      return;
    }
    const items = Array.from(newsList.querySelectorAll('.news-item'));
    const pageSize = Number(newsList.dataset.pageSize || 3);
    drawNewsPagination(items, pageSize);
  });
}

initNewsDetailPage();
initProductDetailPage();
injectBfqDisclaimer();
