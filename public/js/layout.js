const Layout = {
  init({ role, active, eyebrow, subtitle, search, onSearch }) {
    const u = API.user;
    const nav = role === 'admin'
      ? [
          { id: 'dashboard', label: 'DASHBOARD', href: '/admin/dashboard.html', icon: ICON.grid },
          { id: 'patients', label: 'PATIENT', href: '/admin/patients.html', icon: ICON.user },
          { id: 'appointments', label: 'APPOINTMENTS', href: '/admin/appointments.html', icon: ICON.cal }
        ]
      : [
          { id: 'dashboard', label: 'DASHBOARD', href: '/patient/dashboard.html', icon: ICON.grid },
          { id: 'appointments', label: 'MY APPOINTMENTS', href: '/patient/appointments.html', icon: ICON.cal }
        ];

    const greetName = role === 'admin'
      ? 'Dr. ' + u.full_name.split(',')[0].trim()
      : (u.full_name.split(',')[1] || u.full_name).trim();
    const initials = u.full_name.replace(',', '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('shell').innerHTML = `
    <div class="min-h-screen md:flex">
      <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full transition-transform md:translate-x-0 md:sticky md:top-0 md:h-screen md:shrink-0 bg-cream border-r border-black">
        <div class="px-10 pt-8 pb-10">${Brand.inline(34)}</div>
        <p class="px-10 text-sm font-bold text-maroon mb-5">MAIN MENU</p>
        <nav class="px-5 space-y-4">
          ${nav.map((n) => `
            <a href="${n.href}" class="flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-bold transition
              ${n.id === active ? 'bg-white text-black card-shadow' : 'text-gray-500 hover:bg-white/70'}">
              ${n.icon}<span>${n.label}</span></a>`).join('')}
        </nav>
      </aside>

      <div class="flex-1 min-w-0 flex flex-col">
        <header class="flex items-center justify-between gap-3 border-b border-black px-4 md:px-10 py-4 bg-cream">
          <div class="flex items-center gap-3 flex-1">
            <button id="menu-btn" class="md:hidden p-1">${ICON.menu}</button>
            ${search ? `<label class="flex items-center gap-2 bg-white rounded-xl card-shadow px-4 py-2.5 w-full max-w-md text-gray-400">
              ${ICON.search}<input id="global-search" placeholder="${esc(search)}" class="w-full outline-none text-sm text-gray-700 bg-transparent"></label>` : ''}
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-3 bg-white rounded-full card-shadow pl-2 pr-5 py-1.5">
              <div class="w-11 h-11 rounded-full bg-brown text-white flex items-center justify-center font-bold">${esc(initials)}</div>
              <div class="leading-tight hidden sm:block">
                <p class="font-bold text-sm">${esc(u.full_name)}</p>
                <p class="text-[11px] text-gray-500">${role === 'admin' ? 'Administrator' : 'Patient'}</p>
              </div>
            </div>
            <button id="signout-btn" class="bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded-full px-5 py-1.5">Sign Out</button>
          </div>
        </header>

        <main class="flex-1 px-5 md:px-12 py-8 pb-28">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="font-semibold text-gray-500">${esc(eyebrow)}</p>
              <h1 class="text-3xl md:text-4xl font-bold text-maroon">Good Day, ${esc(greetName)}!</h1>
              <p class="text-gray-500 mt-1">${esc(subtitle)}</p>
            </div>
            <div class="flex items-center gap-3 bg-white rounded-xl card-shadow px-5 py-3 text-gray-500">
              ${ICON.cal}<span>${today}</span>
            </div>
          </div>
          <section id="content" class="mt-8"></section>
        </main>
      </div>
    </div>`;

    document.getElementById('menu-btn').onclick = () =>
      document.getElementById('sidebar').classList.toggle('-translate-x-full');

    document.getElementById('signout-btn').onclick = async () => {
      if (await UI.confirm('Are you sure you want to sign out?')) {
        API.clear();
        location.href = '/';
      }
    };

    if (search && onSearch) {
      document.getElementById('global-search').addEventListener('input', debounce((e) => onSearch(e.target.value.trim())));
    }
    return document.getElementById('content');
  }
};