const KEY_STORAGE = 'cr-admin-key';

const keyForm = document.getElementById('crmKeyForm');
const keyInput = document.getElementById('crmKeyInput');
const clearKeyBtn = document.getElementById('crmClearKey');
const reloadAllBtn = document.getElementById('crmReloadAll');
const globalMessage = document.getElementById('crmGlobalMessage');

const clientForm = document.getElementById('clientForm');
const clientMessage = document.getElementById('clientMessage');
const clientReset = document.getElementById('clientReset');
const clientsList = document.getElementById('clientsList');

const leadForm = document.getElementById('leadForm');
const leadMessage = document.getElementById('leadMessage');
const leadReset = document.getElementById('leadReset');
const leadsBoard = document.getElementById('leadsBoard');

const taskForm = document.getElementById('taskForm');
const taskMessage = document.getElementById('taskMessage');
const taskReset = document.getElementById('taskReset');
const tasksList = document.getElementById('tasksList');

const statsNode = document.getElementById('crmStats');

let crmState = {
  clients: [],
  leads: [],
  tasks: []
};

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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function crmFetch(url, options = {}) {
  const key = getAdminKey();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'x-admin-key': key
    }
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || 'So\'rov bajarilmadi');
  }
  return data;
}

function readClientForm() {
  return {
    name: document.getElementById('clientName').value.trim(),
    company: document.getElementById('clientCompany').value.trim(),
    phone: document.getElementById('clientPhone').value.trim(),
    email: document.getElementById('clientEmail').value.trim(),
    status: document.getElementById('clientStatus').value,
    source: document.getElementById('clientSource').value.trim(),
    note: document.getElementById('clientNote').value.trim()
  };
}

function readLeadForm() {
  return {
    title: document.getElementById('leadTitle').value.trim(),
    clientName: document.getElementById('leadClientName').value.trim(),
    phone: document.getElementById('leadPhone').value.trim(),
    value: Number(document.getElementById('leadValue').value || 0),
    stage: document.getElementById('leadStage').value,
    owner: document.getElementById('leadOwner').value.trim(),
    nextActionDate: document.getElementById('leadNextActionDate').value,
    note: document.getElementById('leadNote').value.trim()
  };
}

function readTaskForm() {
  return {
    title: document.getElementById('taskTitle').value.trim(),
    assignee: document.getElementById('taskAssignee').value.trim(),
    dueDate: document.getElementById('taskDueDate').value,
    priority: document.getElementById('taskPriority').value,
    status: document.getElementById('taskStatus').value,
    relatedType: document.getElementById('taskRelatedType').value,
    relatedId: document.getElementById('taskRelatedId').value.trim(),
    note: document.getElementById('taskNote').value.trim()
  };
}

function resetClientForm() {
  clientForm.reset();
  document.getElementById('clientId').value = '';
  document.getElementById('clientStatus').value = 'new';
}

function resetLeadForm() {
  leadForm.reset();
  document.getElementById('leadId').value = '';
  document.getElementById('leadStage').value = 'new';
}

function resetTaskForm() {
  taskForm.reset();
  document.getElementById('taskId').value = '';
  document.getElementById('taskPriority').value = 'normal';
  document.getElementById('taskStatus').value = 'todo';
}

function fillClientForm(item) {
  document.getElementById('clientId').value = item.id;
  document.getElementById('clientName').value = item.name || '';
  document.getElementById('clientCompany').value = item.company || '';
  document.getElementById('clientPhone').value = item.phone || '';
  document.getElementById('clientEmail').value = item.email || '';
  document.getElementById('clientStatus').value = item.status || 'new';
  document.getElementById('clientSource').value = item.source || '';
  document.getElementById('clientNote').value = item.note || '';
}

function fillLeadForm(item) {
  document.getElementById('leadId').value = item.id;
  document.getElementById('leadTitle').value = item.title || '';
  document.getElementById('leadClientName').value = item.clientName || '';
  document.getElementById('leadPhone').value = item.phone || '';
  document.getElementById('leadValue').value = item.value || '';
  document.getElementById('leadStage').value = item.stage || 'new';
  document.getElementById('leadOwner').value = item.owner || '';
  document.getElementById('leadNextActionDate').value = item.nextActionDate || '';
  document.getElementById('leadNote').value = item.note || '';
}

function fillTaskForm(item) {
  document.getElementById('taskId').value = item.id;
  document.getElementById('taskTitle').value = item.title || '';
  document.getElementById('taskAssignee').value = item.assignee || '';
  document.getElementById('taskDueDate').value = item.dueDate || '';
  document.getElementById('taskPriority').value = item.priority || 'normal';
  document.getElementById('taskStatus').value = item.status || 'todo';
  document.getElementById('taskRelatedType').value = item.relatedType || '';
  document.getElementById('taskRelatedId').value = item.relatedId || '';
  document.getElementById('taskNote').value = item.note || '';
}

function renderStats(state) {
  if (!statsNode) return;
  const wonCount = state.leads.filter((lead) => lead.stage === 'won').length;
  const todoCount = state.tasks.filter((task) => task.status !== 'done').length;

  statsNode.innerHTML = [
    `<article class="card"><h3>${state.clients.length}</h3><p>Mijozlar</p></article>`,
    `<article class="card"><h3>${state.leads.length}</h3><p>Leadlar</p></article>`,
    `<article class="card"><h3>${wonCount}</h3><p>Yopilgan bitimlar</p></article>`,
    `<article class="card"><h3>${todoCount}</h3><p>Ochiq vazifalar</p></article>`
  ].join('');
}

function renderClients(state) {
  if (!clientsList) return;
  if (!state.clients.length) {
    clientsList.innerHTML = '<p>Mijozlar hali qo\'shilmagan.</p>';
    return;
  }

  clientsList.innerHTML = state.clients
    .map(
      (item) => `
      <article class="crm-row">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p><strong>Kompaniya:</strong> ${escapeHtml(item.company || '-')}</p>
          <p><strong>Telefon:</strong> ${escapeHtml(item.phone || '-')}</p>
          <p><strong>Email:</strong> ${escapeHtml(item.email || '-')}</p>
          <p><strong>Status:</strong> <span class="crm-tag">${escapeHtml(item.status || '-')}</span></p>
          <p><strong>Manba:</strong> ${escapeHtml(item.source || '-')}</p>
        </div>
        <div class="admin-row-actions">
          <button type="button" class="btn btn-outline crm-edit-client" data-id="${item.id}">Edit</button>
          <button type="button" class="btn btn-danger crm-delete-client" data-id="${item.id}">Delete</button>
        </div>
      </article>
    `
    )
    .join('');
}

function renderLeads(state) {
  if (!leadsBoard) return;

  const stages = [
    { key: 'new', title: 'Yangi' },
    { key: 'contacted', title: "Bog'lanilgan" },
    { key: 'proposal', title: 'Taklif' },
    { key: 'won', title: 'Won' },
    { key: 'lost', title: 'Lost' }
  ];

  leadsBoard.innerHTML = stages
    .map((stage) => {
      const items = state.leads.filter((lead) => lead.stage === stage.key);
      const cards = items.length
        ? items
            .map(
              (lead) => `
          <article class="crm-mini-card">
            <h4>${escapeHtml(lead.title)}</h4>
            <p>${escapeHtml(lead.clientName || '-')}</p>
            <p><strong>${Number(lead.value || 0).toLocaleString('uz-UZ')} UZS</strong></p>
            <p>Mas'ul: ${escapeHtml(lead.owner || '-')}</p>
            <div class="admin-row-actions">
              <button type="button" class="btn btn-outline crm-edit-lead" data-id="${lead.id}">Edit</button>
              <button type="button" class="btn btn-danger crm-delete-lead" data-id="${lead.id}">Delete</button>
            </div>
          </article>
        `
            )
            .join('')
        : '<p>Bo\'sh</p>';

      return `
        <section class="crm-column">
          <h3>${stage.title}</h3>
          ${cards}
        </section>
      `;
    })
    .join('');
}

function renderTasks(state) {
  if (!tasksList) return;

  if (!state.tasks.length) {
    tasksList.innerHTML = '<p>Vazifalar hali qo\'shilmagan.</p>';
    return;
  }

  tasksList.innerHTML = state.tasks
    .map(
      (item) => `
      <article class="crm-row">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p><strong>Mas'ul:</strong> ${escapeHtml(item.assignee || '-')}</p>
          <p><strong>Muddat:</strong> ${escapeHtml(item.dueDate || '-')}</p>
          <p><strong>Status:</strong> <span class="crm-tag">${escapeHtml(item.status || '-')}</span></p>
          <p><strong>Prioritet:</strong> ${escapeHtml(item.priority || '-')}</p>
          <p><strong>Bog'liq:</strong> ${escapeHtml(item.relatedType || '-')} ${escapeHtml(item.relatedId || '')}</p>
        </div>
        <div class="admin-row-actions">
          <button type="button" class="btn btn-outline crm-edit-task" data-id="${item.id}">Edit</button>
          <button type="button" class="btn btn-danger crm-delete-task" data-id="${item.id}">Delete</button>
        </div>
      </article>
    `
    )
    .join('');
}

function renderAll() {
  renderStats(crmState);
  renderClients(crmState);
  renderLeads(crmState);
  renderTasks(crmState);
}

async function loadCrm() {
  const data = await crmFetch('/api/crm');
  crmState = data.state || { clients: [], leads: [], tasks: [] };
  renderAll();
}

if (keyInput) {
  keyInput.value = getAdminKey();
}

if (keyForm) {
  keyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setAdminKey(keyInput.value.trim());
    setMessage(globalMessage, 'Admin key saqlandi', 'success');
    try {
      await loadCrm();
      setMessage(globalMessage, 'CRM ma\'lumotlari yuklandi', 'success');
    } catch (error) {
      setMessage(globalMessage, error.message, 'error');
    }
  });
}

if (clearKeyBtn) {
  clearKeyBtn.addEventListener('click', () => {
    setAdminKey('');
    keyInput.value = '';
    setMessage(globalMessage, 'Admin key tozalandi', 'success');
  });
}

if (reloadAllBtn) {
  reloadAllBtn.addEventListener('click', async () => {
    try {
      await loadCrm();
      setMessage(globalMessage, 'CRM yangilandi', 'success');
    } catch (error) {
      setMessage(globalMessage, error.message, 'error');
    }
  });
}

if (clientReset) {
  clientReset.addEventListener('click', () => {
    resetClientForm();
    setMessage(clientMessage, 'Forma tozalandi');
  });
}

if (leadReset) {
  leadReset.addEventListener('click', () => {
    resetLeadForm();
    setMessage(leadMessage, 'Forma tozalandi');
  });
}

if (taskReset) {
  taskReset.addEventListener('click', () => {
    resetTaskForm();
    setMessage(taskMessage, 'Forma tozalandi');
  });
}

if (clientForm) {
  clientForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readClientForm();
    const id = document.getElementById('clientId').value.trim();

    if (!payload.name || !payload.phone) {
      setMessage(clientMessage, 'Ism va telefon majburiy', 'error');
      return;
    }

    try {
      if (id) {
        await crmFetch(`/api/crm/clients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage(clientMessage, 'Mijoz yangilandi', 'success');
      } else {
        await crmFetch('/api/crm/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage(clientMessage, 'Mijoz qo\'shildi', 'success');
      }
      resetClientForm();
      await loadCrm();
    } catch (error) {
      setMessage(clientMessage, error.message, 'error');
    }
  });
}

if (leadForm) {
  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readLeadForm();
    const id = document.getElementById('leadId').value.trim();

    if (!payload.title) {
      setMessage(leadMessage, 'Lead nomi majburiy', 'error');
      return;
    }

    try {
      if (id) {
        await crmFetch(`/api/crm/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage(leadMessage, 'Lead yangilandi', 'success');
      } else {
        await crmFetch('/api/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage(leadMessage, 'Lead qo\'shildi', 'success');
      }
      resetLeadForm();
      await loadCrm();
    } catch (error) {
      setMessage(leadMessage, error.message, 'error');
    }
  });
}

if (taskForm) {
  taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readTaskForm();
    const id = document.getElementById('taskId').value.trim();

    if (!payload.title) {
      setMessage(taskMessage, 'Vazifa nomi majburiy', 'error');
      return;
    }

    try {
      if (id) {
        await crmFetch(`/api/crm/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage(taskMessage, 'Vazifa yangilandi', 'success');
      } else {
        await crmFetch('/api/crm/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setMessage(taskMessage, 'Vazifa qo\'shildi', 'success');
      }
      resetTaskForm();
      await loadCrm();
    } catch (error) {
      setMessage(taskMessage, error.message, 'error');
    }
  });
}

if (clientsList) {
  clientsList.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.crm-edit-client');
    const deleteBtn = event.target.closest('.crm-delete-client');
    if (!editBtn && !deleteBtn) return;

    const id = (editBtn || deleteBtn).dataset.id;
    const item = crmState.clients.find((client) => client.id === id);
    if (!item) return;

    if (editBtn) {
      fillClientForm(item);
      setMessage(clientMessage, 'Mijoz tahrirlash rejimi', 'success');
      return;
    }

    if (deleteBtn && window.confirm('Mijozni o\'chirasizmi?')) {
      try {
        await crmFetch(`/api/crm/clients/${id}`, { method: 'DELETE' });
        await loadCrm();
        setMessage(clientMessage, 'Mijoz o\'chirildi', 'success');
      } catch (error) {
        setMessage(clientMessage, error.message, 'error');
      }
    }
  });
}

if (leadsBoard) {
  leadsBoard.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.crm-edit-lead');
    const deleteBtn = event.target.closest('.crm-delete-lead');
    if (!editBtn && !deleteBtn) return;

    const id = (editBtn || deleteBtn).dataset.id;
    const item = crmState.leads.find((lead) => lead.id === id);
    if (!item) return;

    if (editBtn) {
      fillLeadForm(item);
      setMessage(leadMessage, 'Lead tahrirlash rejimi', 'success');
      return;
    }

    if (deleteBtn && window.confirm('Leadni o\'chirasizmi?')) {
      try {
        await crmFetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
        await loadCrm();
        setMessage(leadMessage, 'Lead o\'chirildi', 'success');
      } catch (error) {
        setMessage(leadMessage, error.message, 'error');
      }
    }
  });
}

if (tasksList) {
  tasksList.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.crm-edit-task');
    const deleteBtn = event.target.closest('.crm-delete-task');
    if (!editBtn && !deleteBtn) return;

    const id = (editBtn || deleteBtn).dataset.id;
    const item = crmState.tasks.find((task) => task.id === id);
    if (!item) return;

    if (editBtn) {
      fillTaskForm(item);
      setMessage(taskMessage, 'Vazifa tahrirlash rejimi', 'success');
      return;
    }

    if (deleteBtn && window.confirm('Vazifani o\'chirasizmi?')) {
      try {
        await crmFetch(`/api/crm/tasks/${id}`, { method: 'DELETE' });
        await loadCrm();
        setMessage(taskMessage, 'Vazifa o\'chirildi', 'success');
      } catch (error) {
        setMessage(taskMessage, error.message, 'error');
      }
    }
  });
}

if (getAdminKey()) {
  loadCrm().catch((error) => {
    setMessage(globalMessage, error.message, 'error');
  });
}
