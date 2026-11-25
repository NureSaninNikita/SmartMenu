import api from '../api/axios';

const restaurantPath = (restaurantId) =>
  `/admin/restaurants/${encodeURIComponent(restaurantId)}`;

const dishPath = (restaurantId, dishId) =>
  `${restaurantPath(restaurantId)}/dishes/${encodeURIComponent(dishId)}`;

const dishManagementService = {
  async getCategories(restaurantId) {
    const { data } = await api.get(`${restaurantPath(restaurantId)}/categories`);
    return data;
  },
  async getDishes(restaurantId) {
    const { data } = await api.get(`${restaurantPath(restaurantId)}/dishes`);
    return data;
  },
  async createDish(restaurantId, values) {
    const { data } = await api.post(`${restaurantPath(restaurantId)}/dishes`, values);
    return data;
  },
  async updateDish(restaurantId, dishId, values) {
    const { data } = await api.put(dishPath(restaurantId, dishId), values);
    return data;
  },
  async uploadPhoto(restaurantId, dishId, position, file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.put(
      `${dishPath(restaurantId, dishId)}/photos/${position}`, form
    );
    return data;
  },
  async deletePhoto(restaurantId, dishId, position) {
    await api.delete(`${dishPath(restaurantId, dishId)}/photos/${position}`);
  },
  async getIngredients() {
    const { data } = await api.get('/ingredients');
    return data;
  },
  async createIngredient(name) {
    const { data } = await api.post('/ingredients', { name });
    return data;
  },
};

export default dishManagementService;
