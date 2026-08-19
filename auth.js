(() => {
  const SESSION_KEY = 'iem_umpsa_admin_session';
  const ADMIN_ID = 'iem@umpsa.edu.my';
  const ADMIN_PASSWORD = 'iemumpss2021';

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
  }

  async function login(id, password) {
    const valid = id.trim().toLowerCase() === ADMIN_ID && password === ADMIN_PASSWORD;
    if (valid) sessionStorage.setItem(SESSION_KEY, 'authenticated');
    return valid;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'admin-login.html';
  }

  function requireLogin() {
    if (!isLoggedIn()) {
      window.location.replace('admin-login.html');
    }
  }

  window.IEMAdminAuth = { login, logout, isLoggedIn, requireLogin };
})();
