// Admin authentication helper
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change in production!

export function isValidAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

export function setAdminSession(password) {
  if (typeof window === 'undefined') return false;

  if (isValidAdminPassword(password)) {
    // Set session token in localStorage
    const token = btoa(`admin:${Date.now()}`);
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_login_time', Date.now().toString());
    return true;
  }
  return false;
}

export function getAdminSession() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_login_time');
}

export function isAdminLoggedIn() {
  if (typeof window === 'undefined') return false;
  return !!getAdminSession();
}

// Server-side auth check for API routes
export function checkAdminAuth(req) {
  const token = req.headers.authorization?.split(' ')[1];
  return token === btoa(`admin:${req.headers['x-admin-time']}`);
}
