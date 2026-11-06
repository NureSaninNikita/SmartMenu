import api from '../api/axios';

async function getUsers(page) {
  const { data } = await api.get('/admin/users', { params: { page, pageSize: 20 } });
  return data;
}

async function setUserActive(id, isActive) {
  const { data } = await api.patch(`/admin/users/${encodeURIComponent(id)}/active`, { isActive });
  return data;
}

async function assignRestaurant(userId, restaurantId) {
  const { data } = await api.post(`/admin/users/${encodeURIComponent(userId)}/restaurants/${encodeURIComponent(restaurantId)}`);
  return data;
}

async function removeRestaurant(userId, restaurantId) {
  const { data } = await api.delete(`/admin/users/${encodeURIComponent(userId)}/restaurants/${encodeURIComponent(restaurantId)}`);
  return data;
}

async function getRestaurants() {
  const { data } = await api.get('/admin/restaurants');
  return data;
}

async function createRestaurant(values) {
  const { data } = await api.post('/admin/restaurants', values);
  return data;
}

async function updateRestaurant(id, values) {
  const { data } = await api.put(`/admin/restaurants/${encodeURIComponent(id)}`, values);
  return data;
}

async function deactivateRestaurant(id) {
  await api.delete(`/admin/restaurants/${encodeURIComponent(id)}`);
}

const adminService = {
  getUsers,
  setUserActive,
  assignRestaurant,
  removeRestaurant,
  getRestaurants,
  createRestaurant,
  updateRestaurant,
  deactivateRestaurant,
};

export default adminService;
