const adminKeyForm = document.getElementById('adminKeyForm');
const adminKeyInput = document.getElementById('adminKeyInput');
const clearAdminKeyBtn = document.getElementById('clearAdminKey');
const adminKeyMessage = document.getElementById('adminKeyMessage');

const newsForm = document.getElementById('newsForm');
const newsIdInput = document.getElementById('newsId');
const newsTitleInput = document.getElementById('newsTitle');
const newsDateInput = document.getElementById('newsDate');
const newsExcerptInput = document.getElementById('newsExcerpt');
const newsContentInput = document.getElementById('newsContent');
const newsImageInput = document.getElementById('newsImage');
const newsFormMessage = document.getElementById('newsFormMessage');
const resetNewsBtn = document.getElementById('resetNewsBtn');
const refreshNewsBtn = document.getElementById('refreshNewsBtn');
const adminNewsList = document.getElementById('adminNewsList');

const KEY_STORAGE = 'cr-admin-key';

function getAdminKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
}

function setAdminKey(value) {
  if (!value) {
    localStorage.removeItem(KEY_STORAGE);
    return;
  }
  localStorage.setItem(KEY_STORAGE, value);
}

function setMessage(node, text, type = '') {
  if (!node) return;
  node.textContent = text;
  node.classList.remove('success', 'error');
  if (type) {
    node.classList.add(type);
  }
}

function readFormValues() {
  return {
    title: newsTitleInput.value.trim(),
    date: newsDateInput.value,
    excerpt: newsExcerptInput.value.trim(),
    content: newsContentInput.value.trim(),
    image: newsImageInput.value.trim() || 'images/news-1.svg'
  };
}

function fillForm(item) {
  newsIdInput.value = item.id;
  newsTitleInput.value = item.title;
  newsDateInput.value = item.date;
  newsExcerptInput.value = item.excerpt;
  newsContentInput.value = item.content;
  newsImageInput.value = item.image || 'images/news-1.svg';
}

function resetForm() {
  newsForm.reset();
  newsIdInput.value = '';
}

async function adminFetch(url, options = {}) {
  const key = getAdminKey();
  const headers = {
    ...(options.headers || {}),
    'x-admin-key': key
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || 'So\'rov bajarilmadi');
  }

  return data;
}

function renderNewsList(items) {
  if (!adminNewsList) return;

  if (!items.length) {
    adminNewsList.innerHTML = '<p>Hozircha yangiliklar mavjud emas.</p>';
    return;
  }

  adminNewsList.innerHTML = items
    .map(
      (item) => `
        <article class="admin-row">
          <img src="${item.image}" alt="${item.title}" loading="lazy" />
          <div>
            <h3>${item.title}</h3>
            <p class="news-date">${item.date}</p>
            <p>${item.excerpt}</p>
          </div>
          <div class="admin-row-actions">
            <button type="button" class="btn btn-outline admin-edit" data-id="${item.id}">Edit</button>
            <button type="button" class="btn btn-danger admin-delete" data-id="${item.id}">Delete</button>
          </div>
        </article>
      `
    )
    .join('');
}

async function loadNews() {
  const response = await fetch('/api/news');
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || 'Yangiliklar olinmadi');
  }
  renderNewsList(data.items || []);
}

if (adminKeyInput) {
  adminKeyInput.value = getAdminKey();
}

if (adminKeyForm) {
  adminKeyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = adminKeyInput.value.trim();
    setAdminKey(value);
    setMessage(adminKeyMessage, 'Admin key saqlandi', 'success');
  });
}

if (clearAdminKeyBtn) {
  clearAdminKeyBtn.addEventListener('click', () => {
    setAdminKey('');
    adminKeyInput.value = '';
    setMessage(adminKeyMessage, 'Admin key tozalandi', 'success');
  });
}

if (resetNewsBtn) {
  resetNewsBtn.addEventListener('click', () => {
    resetForm();
    setMessage(newsFormMessage, 'Forma tozalandi');
  });
}

if (refreshNewsBtn) {
  refreshNewsBtn.addEventListener('click', async () => {
    try {
      await loadNews();
      setMessage(newsFormMessage, 'Ro\'yxat yangilandi', 'success');
    } catch (error) {
      setMessage(newsFormMessage, error.message, 'error');
    }
  });
}

if (newsForm) {
  newsForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = readFormValues();
    const editingId = newsIdInput.value.trim();

    if (!payload.title || !payload.date || !payload.excerpt || !payload.content) {
      setMessage(newsFormMessage, 'Majburiy maydonlarni to\'ldiring', 'error');
      return;
    }

    try {
      if (editingId) {
        await adminFetch(`/api/news/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage(newsFormMessage, 'Yangilik yangilandi', 'success');
      } else {
        await adminFetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage(newsFormMessage, 'Yangilik qo\'shildi', 'success');
      }

      resetForm();
      await loadNews();
    } catch (error) {
      setMessage(newsFormMessage, error.message, 'error');
    }
  });
}

if (adminNewsList) {
  adminNewsList.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.admin-edit');
    const deleteBtn = event.target.closest('.admin-delete');

    if (!editBtn && !deleteBtn) {
      return;
    }

    const id = (editBtn || deleteBtn).dataset.id;
    if (!id) {
      return;
    }

    if (editBtn) {
      try {
        const response = await fetch(`/api/news/${id}`);
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.message || 'Yangilik topilmadi');
        }
        fillForm(data.item);
        setMessage(newsFormMessage, 'Tahrirlash rejimi yoqildi', 'success');
      } catch (error) {
        setMessage(newsFormMessage, error.message, 'error');
      }
    }

    if (deleteBtn) {
      const accepted = window.confirm('Haqiqatan ham ushbu yangilikni o\'chirmoqchimisiz?');
      if (!accepted) {
        return;
      }

      try {
        await adminFetch(`/api/news/${id}`, { method: 'DELETE' });
        setMessage(newsFormMessage, 'Yangilik o\'chirildi', 'success');
        await loadNews();
      } catch (error) {
        setMessage(newsFormMessage, error.message, 'error');
      }
    }
  });
}

loadNews().catch((error) => {
  setMessage(newsFormMessage, error.message, 'error');
});
