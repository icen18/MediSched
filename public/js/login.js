if (API.token && API.user && API.user.role === 'admin') location.replace('/admin/dashboard.html');
else API.clear();
document.getElementById('brand').innerHTML = Brand.stacked();
document.getElementById('brand-sm').innerHTML = Brand.inline(40);

const icons = document.querySelectorAll('#login-form .absolute');
icons[0].innerHTML = ICON.mail;
icons[1].innerHTML = ICON.lock;

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('error');
  const btn = document.getElementById('login-btn');
  err.textContent = '';
  btn.disabled = true;
  try {
    const { token, user } = await API.post('/api/auth/login', {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    });
    API.save(token, user);
    location.href = homeFor(user.role);
  } catch (ex) {
    err.textContent = ex.message;
    btn.disabled = false;
  }
});