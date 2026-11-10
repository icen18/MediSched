const ICON = {
  wrap: (p, c = 'w-5 h-5') =>
    `<svg viewBox="0 0 24 24" class="${c}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`,
  get grid() { return this.wrap('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'); },
  get user() { return this.wrap('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'); },
  get cal() { return this.wrap('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'); },
  get search() { return this.wrap('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'); },
  get mail() { return this.wrap('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'); },
  get lock() { return this.wrap('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'); },
  get menu() { return this.wrap('<path d="M4 6h16M4 12h16M4 18h16"/>', 'w-6 h-6'); }
};

const Brand = {
  pin: (h = 36) => `<svg viewBox="0 0 64 80" style="height:${h}px" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 0C14.3 0 0 14 0 31.3 0 52 32 80 32 80s32-28 32-48.7C64 14 49.7 0 32 0z" fill="#2FCBFF"/>
    <rect x="26" y="15" width="12" height="32" rx="3" fill="#fff"/><rect x="16" y="25" width="32" height="12" rx="3" fill="#fff"/></svg>`,
  inline: (h = 30) => `<span class="inline-flex items-center gap-1.5 font-extrabold leading-none" style="font-size:${h * 0.85}px">
    ${Brand.pin(h)}<span><span class="text-medired">Medi</span><span class="text-mediblue">Sched</span></span></span>`,
  stacked: () => `<div class="flex flex-col items-center gap-2">${Brand.pin(86)}
    <div class="text-5xl font-extrabold" style="text-shadow:2px 3px 0 rgba(0,0,0,.25)">
    <span class="text-medired">Medi</span><span class="text-mediblue">Sched</span></div></div>`
};

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const homeFor = (role) => (role === 'admin' ? '/admin/dashboard.html' : '/patient/dashboard.html');
const fmtDate = (at) => new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtTime = (at) => new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const statusClass = (s) => 'st-' + String(s).toLowerCase();
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const nowLocalInput = () => {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ---------- API ---------- */
const API = {
  get token() { return localStorage.getItem('ms_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('ms_user')); } catch { return null; } },
  save(token, user) { localStorage.setItem('ms_token', token); localStorage.setItem('ms_user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('ms_token'); localStorage.removeItem('ms_user'); },
  async request(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (API.token) headers.Authorization = 'Bearer ' + API.token;
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let data = null;
    try { data = await res.json(); } catch {}
    if (res.status === 401 && !url.startsWith('/api/auth/')) {
      API.clear(); location.href = '/'; throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  },
  get: (u) => API.request('GET', u),
  post: (u, b) => API.request('POST', u, b || {}),
  put: (u, b) => API.request('PUT', u, b || {}),
  patch: (u, b) => API.request('PATCH', u, b || {}),
  del: (u) => API.request('DELETE', u)
};

function requireAuth(role) {
  const u = API.user;
  if (!API.token || !u) { location.replace('/'); return false; }
  if (role && u.role !== role) { location.replace(homeFor(u.role)); return false; }
  return true;
}

/* ---------- UI ---------- */
const UI = {
  modal(html, { dismissible = true, width = 'max-w-3xl' } = {}) {
    const el = document.createElement('div');
    el.className = 'modal-backdrop fade-in';
    el.innerHTML = `<div class="modal-card w-full ${width}">${html}</div>`;
    if (dismissible) el.addEventListener('mousedown', (e) => { if (e.target === el) el.remove(); });
    document.body.appendChild(el);
    return el;
  },
  message(text, ms = 1600) {
    const el = UI.modal(
      `<div class="border-b border-gray-400 px-4 py-2 bg-white rounded-t-2xl">${Brand.inline(22)}</div>
       <p class="px-8 py-7 text-center text-2xl font-bold">${esc(text)}</p>`,
      { width: 'max-w-md' }
    );
    setTimeout(() => el.remove(), ms);
    return el;
  },
  confirm(text) {
    return new Promise((resolve) => {
      const el = UI.modal(
        `<div class="border-b border-gray-400 px-4 py-2 bg-white rounded-t-2xl">${Brand.inline(22)}</div>
         <p class="px-8 pt-6 pb-4 text-center text-2xl font-bold">${esc(text)}</p>
         <div class="flex justify-center gap-5 pb-6">
           <button data-a="no" class="btn-primary !rounded-full !px-9 !py-1.5 text-sm">No</button>
           <button data-a="yes" class="btn-primary !rounded-full !px-9 !py-1.5 text-sm">Yes</button>
         </div>`,
        { width: 'max-w-md', dismissible: false }
      );
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (!a) return;
        el.remove();
        resolve(a === 'yes');
      });
    });
  },
  toast(text, type = 'error') {
    const t = document.createElement('div');
    t.className = `toast fade-in ${type}`;
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
};