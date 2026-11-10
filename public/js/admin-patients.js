(async () => {
  if (!requireAuth('admin')) return;
  let patients = [];
  let query = '';
  let sortBy = 'az';

  const content = Layout.init({
    role: 'admin', active: 'patients',
    eyebrow: 'Patient Overview', subtitle: 'Here are the lists of your patients',
    search: 'Search patients',
    onSearch: (q) => { query = q; load(); }
  });

  content.innerHTML = `
    <div class="flex justify-end mb-5">
      <label class="flex items-center gap-2 text-sm font-semibold text-gray-600">
        Sort
        <select id="sort" class="input-field !w-auto !py-1.5 !rounded-full !text-sm">
          <option value="az">Name A → Z</option>
          <option value="za">Name Z → A</option>
        </select>
      </label>
    </div>
    <div class="rounded-2xl overflow-hidden card-shadow border border-gray-300 bg-white">
      <div class="overflow-x-auto">
        <table class="ms-table">
          <thead><tr><th>First Name</th><th>Middle Name</th><th>Last Name</th><th>Contact Number</th><th>Age</th><th>Gender</th><th>Actions</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>
    <button id="add-btn" class="btn-primary fixed bottom-8 right-8 !rounded-2xl !text-lg z-30">+ Add Patient</button>`;

  const rows = document.getElementById('rows');

  
  document.getElementById('sort').addEventListener('change', (e) => { sortBy = e.target.value; render(); });

  const cmp = (a, b) =>
    a.last_name.localeCompare(b.last_name, undefined, { sensitivity: 'base' }) ||
    a.first_name.localeCompare(b.first_name, undefined, { sensitivity: 'base' }) ||
    a.middle_name.localeCompare(b.middle_name, undefined, { sensitivity: 'base' });

   function sorted() {
    const copy = [...patients];
    copy.sort(sortBy === 'za' ? (a, b) => cmp(b, a) : cmp);
    return copy;
  }


  function render() {
    const data = sorted();
    rows.innerHTML = data.length
      ? data.map((p) => `
        <tr>
          <td>${esc(p.first_name)}</td><td>${esc(p.middle_name)}</td><td>${esc(p.last_name)}</td>
          <td>${esc(p.contact_number)}</td><td>${p.age}</td><td>${esc(p.gender)}</td>
          <td class="whitespace-nowrap">
            <button class="btn-sm" data-act="edit" data-id="${p.id}">Edit</button>
            <button class="btn-sm danger" data-act="del" data-id="${p.id}">Delete</button>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="7" class="!py-8 text-gray-400">No patients found.</td></tr>`;
  }

  async function load() {
    try {
      patients = await API.get('/api/patients?q=' + encodeURIComponent(query));
      render();
    } catch (e) { UI.toast(e.message); }
  }


  function openForm(p = {}) {
    const f = (label, name, ph, type = 'text', extra = '') => `
      <div><label class="font-bold text-sm ml-1">${label}</label>
      <input name="${name}" type="${type}" ${extra} value="${esc(p[name] ?? '')}" placeholder="${ph}" class="input-field mt-1"></div>`;
    const modal = UI.modal(`
      <form id="p-form" class="p-6 md:p-8" novalidate>
        <h2 class="text-2xl font-bold mb-5">${p.id ? 'Edit patient' : 'Add the new patient'}</h2>
        <div class="grid md:grid-cols-3 gap-x-5 gap-y-4">
          ${f('First Name', 'first_name', "Enter patient's first name")}
          ${f('Middle Name', 'middle_name', "Enter patient's middle name")}
          ${f('Last Name', 'last_name', "Enter patient's last name")}
          ${f('Contact Number', 'contact_number', "Enter patient's contact")}
          ${f('Age', 'age', "Enter patient's age", 'number', 'min="0" max="120"')}
          <div><label class="font-bold text-sm ml-1">Gender</label>
            <select name="gender" class="input-field mt-1">
              <option value="">Select</option>
              ${['Male', 'Female', 'Other'].map((g) => `<option ${p.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select></div>
        </div>
        <p id="form-error" class="text-red-600 text-sm mt-3 min-h-[1.25rem]"></p>
        <div class="flex justify-center gap-3 mt-1">
          <button type="button" id="cancel-btn" class="btn-ghost">Cancel</button>
          <button class="btn-primary !px-10">Submit</button>
        </div>
      </form>`);

    modal.querySelector('#cancel-btn').onclick = () => modal.remove();
    modal.querySelector('#p-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      try {
        if (p.id) await API.put('/api/patients/' + p.id, data);
        else await API.post('/api/patients', data);
        modal.remove();
        UI.message(p.id ? 'Updated Successfully!' : 'Added Successfully!');
        load();
      } catch (ex) { modal.querySelector('#form-error').textContent = ex.message; }
    });
  }

  document.getElementById('add-btn').onclick = () => openForm();

  rows.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const p = patients.find((x) => x.id == b.dataset.id);
    if (b.dataset.act === 'edit') return openForm(p);
    if (await UI.confirm(`Delete ${p.first_name} ${p.last_name} and all their appointments?`)) {
      try { await API.del('/api/patients/' + p.id); UI.message('Deleted!'); load(); }
      catch (ex) { UI.toast(ex.message); }
    }
  });

  load();
})();