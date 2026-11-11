(async () => {
  if (!requireAuth('admin')) return;
  const STATUSES = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];
  let query = '', filter = '', sortBy = 'date';
  let list = [];
  const endAt = (a) => new Date(new Date(a.appointment_at).getTime() + (a.duration_minutes || 60) * 60000);

  const content = Layout.init({
    role: 'admin', active: 'appointments',
    eyebrow: 'Appointment Lists', subtitle: 'Here are the lists of your appointments.',
    search: 'Search appointment',
    onSearch: (q) => { query = q; load(); }
  });

  content.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div id="tabs" class="flex flex-wrap gap-2"></div>
      <label class="flex items-center gap-2 text-sm font-semibold text-gray-600">
        Sort
        <select id="sort" class="input-field !w-auto !py-1.5 !rounded-full !text-sm">
          <option value="date">Date &amp; time</option>
          <option value="az">Patient A → Z</option>
          <option value="za">Patient Z → A</option>
        </select>
      </label>
    </div>
    <div class="rounded-2xl overflow-hidden card-shadow border border-black bg-white">
      <div class="overflow-x-auto">
        <table class="ms-table">
          <thead><tr><th>Patient</th><th>Date &amp; Time</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>
    <button id="add-btn" class="btn-primary fixed bottom-8 right-8 !rounded-2xl z-30">+ Add an appointment</button>`;

  const rows = document.getElementById('rows');
  const tabs = document.getElementById('tabs');

  // tabs 
  function drawTabs() {
    tabs.innerHTML = ['All', ...STATUSES].map((s) => {
      const on = (s === 'All' ? '' : s) === filter;
      return `<button data-f="${s === 'All' ? '' : s}" class="px-4 py-1.5 rounded-full text-sm font-semibold border
        ${on ? 'bg-brown text-white border-brown' : 'bg-white text-gray-600 border-gray-300 hover:bg-peach'}">${s}</button>`;
    }).join('');
  }
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    filter = b.dataset.f; drawTabs(); load();
  });

  // sorting 
  document.getElementById('sort').addEventListener('change', (e) => { sortBy = e.target.value; render(); });

  const byName = (a, b) => a.patient_name.localeCompare(b.patient_name, undefined, { sensitivity: 'base' });

  function sorted() {
    const copy = [...list];
    if (sortBy === 'az') copy.sort(byName);
    else if (sortBy === 'za') copy.sort((a, b) => byName(b, a));
    return copy;
  }

  // table  
  function render() {
    const data = sorted();
    rows.innerHTML = data.length
      ? data.map((a) => `
        <tr>
          <td class="font-medium">${esc(a.patient_name)}</td>
                    <td><div class="font-medium">${fmtDate(a.appointment_at)}</div><div class="text-[11px] text-gray-500">${fmtTime(a.appointment_at)} – ${fmtTime(endAt(a))}</div></td>
          <td>${esc(a.reason)}</td>
          <td>
            <div class="flex items-center justify-center gap-1.5">
                <span class="pill pill-fixed ${statusClass(a.status)}">${a.status}</span>
              <button type="button" data-menu="${a.id}" data-status="${a.status}" aria-label="Change status"
                class="text-xs px-1.5 py-1 rounded hover:bg-gray-200">▼</button>
            </div>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="4" class="!py-8 text-gray-400">No appointments found.</td></tr>`;
  }

  async function load() {
    try {
      list = await API.get(`/api/appointments?q=${encodeURIComponent(query)}&status=${filter}`);
      render();
    } catch (e) { UI.toast(e.message); }
  }

  // status menu (opens from the ▼ icon only) 
  let menu = null, menuBtn = null;

  function closeMenu() {
    if (menu) menu.remove();
    menu = null; menuBtn = null;
  }

  function openMenu(btn) {
    closeMenu();
    menuBtn = btn;
    const id = btn.dataset.menu;
    const current = btn.dataset.status;

    menu = document.createElement('div');
    menu.className = 'status-menu fixed z-[70] bg-white rounded-xl card-shadow border border-gray-200 p-1.5 flex flex-col gap-1 fade-in';
    menu.innerHTML = STATUSES.map((s) => `
      <button type="button" data-set="${s}"
        class="px-5 py-1.5 rounded-full text-sm font-bold text-left ${statusClass(s)} hover:opacity-80
        ${s === current ? 'ring-2 ring-gray-500' : ''}">${s}</button>`).join('');
    document.body.appendChild(menu);

    const r = btn.getBoundingClientRect();
    let top = r.bottom + 4;
    let left = r.left;
    if (top + menu.offsetHeight > window.innerHeight - 8) top = r.top - menu.offsetHeight - 4;
    if (left + menu.offsetWidth > window.innerWidth - 8) left = window.innerWidth - menu.offsetWidth - 8;
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';

    menu.addEventListener('click', async (e) => {
      const item = e.target.closest('[data-set]');
      if (!item) return;
      const status = item.dataset.set;
      closeMenu();
      if (status === current) return;
      try {
        await API.patch(`/api/appointments/${id}/status`, { status });
      } catch (ex) { UI.toast(ex.message); }
      load();
    });
  }

  rows.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-menu]');
    if (!btn) return;
    if (menuBtn === btn) return closeMenu(); 
    openMenu(btn);
  });

  document.addEventListener('mousedown', (e) => {
    if (menu && !e.target.closest('.status-menu') && !e.target.closest('[data-menu]')) closeMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', closeMenu);
  window.addEventListener('scroll', closeMenu, true);

  /* add appointment form */
  async function openForm() {
    let patients = [];
    try { patients = await API.get('/api/patients'); } catch (e) { return UI.toast(e.message); }
    patients.sort((a, b) =>
      (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name, undefined, { sensitivity: 'base' }));

    const modal = UI.modal(`
      <form id="a-form" class="p-6 md:p-8 bg-white rounded-2xl" novalidate>
        <h2 class="text-2xl font-extrabold">BOOK AN APPOINTMENT</h2>
        <p class="text-sm text-gray-500 mb-5">Enter the appointment details below</p>
        <div class="grid md:grid-cols-2 gap-x-6 gap-y-4">
          <div><label class="font-bold text-sm">Patient</label>
            <select name="patient_id" class="input-field mt-1 !rounded-xl">
              <option value="">Select patient</option>
              ${patients.map((p) => `<option value="${p.id}">${esc([p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' '))}</option>`).join('')}
            </select></div>
          <div><label class="font-bold text-sm">Appointment date and time</label>
            <input name="appointment_at" type="datetime-local" min="${nowLocalInput()}" class="input-field mt-1 !rounded-xl"></div>
          <div><label class="font-bold text-sm">Reason</label>
            <input name="reason" maxlength="255" placeholder="Write your reason" class="input-field mt-1 !rounded-xl"></div>
          <div><label class="font-bold text-sm">Duration</label>
            <select name="duration" class="input-field mt-1 !rounded-xl">
              <option value="50">50 minutes</option>
              <option value="60" selected>1 hour</option>
              <option value="90">1 hour 30 minutes</option>
            </select></div>
          <div class="md:col-span-2 flex items-center justify-end gap-3">
            <button type="button" id="clear-btn" class="btn-ghost">Clear Form</button>
            <button class="btn-primary !rounded-full !text-sm">Save Appointment</button>
          </div>
        </div>
        <p id="form-error" class="text-red-600 text-sm mt-3 min-h-[1.25rem]"></p>
      </form>`, { width: 'max-w-3xl' });

    const form = modal.querySelector('#a-form');
    modal.querySelector('#clear-btn').onclick = () => { form.reset(); modal.querySelector('#form-error').textContent = ''; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.post('/api/appointments', Object.fromEntries(new FormData(form)));
        modal.remove();
        UI.message('Appointment Scheduled!');
        load();
      } catch (ex) { modal.querySelector('#form-error').textContent = ex.message; }
    });
  }

  document.getElementById('add-btn').onclick = openForm;
  drawTabs();
  load();
})();