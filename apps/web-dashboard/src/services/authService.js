import api from '../api/axios';
import { clearSession, readSession, saveSession } from './authSession';

async function register(values) {
  const { data } = await api.post('/auth/register', values);
  return data;
}

async function login(values) {
  const { data } = await api.post('/auth/login', values);
  saveSession(data);
  return data;
}

async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  const session = readSession();
  if (session) saveSession({ ...session, user: data });
  return data;
}

function logout() {
  clearSession();
}

const authService = { register, login, getCurrentUser, logout };

export default authService;
