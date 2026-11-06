export const AUTH_SESSION_KEY = 'smartmenu.auth';
export const AUTH_CHANGE_EVENT = 'smartmenu:auth-change';

export function readSession() {
  try {
    const value = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value);
    const expiresAt = Date.parse(session.expiresAt);
    if (!session.token || !session.user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function saveSession(session) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}
