// Admin authentication helper
const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export const ADMIN_PASSWORD = isProduction
  ? (CLIENT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD)
  : (CLIENT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123'); // Dev fallback only

export function isValidAdminPassword(password) {
  // In production, require a configured ADMIN_PASSWORD
  if (isProduction && !ADMIN_PASSWORD) {
    return false;
  }
  return password === ADMIN_PASSWORD;
}

export function setAdminSession(password) {
  if (typeof window === 'undefined') return false;

  if (isValidAdminPassword(password)) {
    // Set session token in localStorage
    const token = btoa(`admin:${Date.now()}`);
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_login_time', Date.now().toString());

    // Store Basic auth token for admin API calls (used client-side only)
    const basic = btoa(`admin:${password}`);
    localStorage.setItem('admin_basic', basic);

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
  localStorage.removeItem('admin_basic');
}

export function isAdminLoggedIn() {
  if (typeof window === 'undefined') return false;
  return !!getAdminSession();
}

// Helper for admin API calls from client
export function getAdminAuthHeader() {
  if (typeof window === 'undefined') return null;
  const basic = localStorage.getItem('admin_basic');
  if (!basic) return null;
  return { Authorization: `Basic ${basic}` };
}
