const loginForm = document.getElementById('loginForm');
const adminId = document.getElementById('adminId');
const adminPassword = document.getElementById('adminPassword');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');
const togglePassword = document.getElementById('togglePassword');

if (IEMAdminAuth.isLoggedIn()) {
  window.location.replace('admin.html');
}

togglePassword.addEventListener('click', () => {
  const showing = adminPassword.type === 'text';
  adminPassword.type = showing ? 'password' : 'text';
  togglePassword.textContent = showing ? 'Show' : 'Hide';
  togglePassword.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';

  if (!adminId.value.trim() || !adminPassword.value) {
    loginMessage.textContent = 'Please enter your admin ID and password.';
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Signing in...';

  try {
    const valid = await IEMAdminAuth.login(adminId.value, adminPassword.value);
    if (valid) {
      window.location.href = 'admin.html';
      return;
    }
    loginMessage.textContent = 'Incorrect admin ID or password.';
    adminPassword.select();
  } catch (error) {
    loginMessage.textContent = 'Login could not be verified in this browser.';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Sign in to Admin';
  }
});
