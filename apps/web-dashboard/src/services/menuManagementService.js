import api from '../api/axios';

const restaurantPath = (restaurantId) =>
  `/admin/restaurants/${encodeURIComponent(restaurantId)}`;

const menuManagementService = {
  async getCategories(restaurantId, includeInactive = false) {
    const { data } = await api.get(`${restaurantPath(restaurantId)}/categories`, {
      params: { includeInactive },
    });
    return data;
  },
  async createCategory(restaurantId, values) {
    const { data } = await api.post(`${restaurantPath(restaurantId)}/categories`, values);
    return data;
  },
  async updateCategory(restaurantId, categoryId, values) {
    const { data } = await api.put(
      `${restaurantPath(restaurantId)}/categories/${categoryId}`, values
    );
    return data;
  },
  async reorderCategories(restaurantId, categoryIds) {
    const { data } = await api.put(
      `${restaurantPath(restaurantId)}/categories/order`, { categoryIds }
    );
    return data;
  },
  async deleteCategory(restaurantId, categoryId) {
    await api.delete(`${restaurantPath(restaurantId)}/categories/${categoryId}`);
  },
};

export default menuManagementService;
