(async () => {
  if (!requireAuth('admin')) return;
  const content = Layout.init({
    role: 'admin', active: 'dashboard',
    eyebrow: 'Clinic Overview', subtitle: "Here's what's happening at your clinic today"
  });

  const card = (label, id, color) => `
    <div class="bg-white rounded-2xl card-shadow border border-gray-200 p-8 min-h-[240px] flex flex-col">
      <p class="text-gray-500 text-lg">${label}</p>
      <p id="${id}" class="flex-1 flex items-center justify-center text-7xl font-extrabold ${color}">–</p>
    </div>`;

  content.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-8 w-full">
      ${card("Today's Appointment", 'c-today', 'text-[#0B1F7A]')}
      ${card('Pending Patients', 'c-pending', 'text-black')}
      ${card('Scheduled Patients', 'c-scheduled', 'text-green-600')}
      ${card('Cancelled Patients', 'c-cancelled', 'text-red-600')}
    </div>`;

  // the visitor's local date (YYYY-MM-DD)
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const localDate = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;

  try {
    const d = await API.get('/api/dashboard?date=' + localDate);
    document.getElementById('c-today').textContent = d.today;
    document.getElementById('c-pending').textContent = d.pending;
    document.getElementById('c-scheduled').textContent = d.scheduled;
    document.getElementById('c-cancelled').textContent = d.cancelled;
  } catch (e) { UI.toast(e.message); }
})();