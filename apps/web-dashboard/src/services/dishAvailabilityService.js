import api from '../api/axios';

const dishPath = (restaurantId, dishId) =>
  `/admin/restaurants/${encodeURIComponent(restaurantId)}/dishes/${encodeURIComponent(dishId)}`;

const dishAvailabilityService = {
  async getDishes(restaurantId) {
    const { data } = await api.get(
      `/admin/restaurants/${encodeURIComponent(restaurantId)}/dishes`
    );
    return data;
  },
  async setAvailability(restaurantId, dishId, isAvailable) {
    const { data } = await api.patch(
      `${dishPath(restaurantId, dishId)}/availability`, { isAvailable }
    );
    return data;
  },
};

export default dishAvailabilityService;
