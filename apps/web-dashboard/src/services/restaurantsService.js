import api from '../api/axios';

async function getRestaurants(city = '') {
  const { data } = await api.get('/restaurants', {
    params: city ? { city } : {},
  });

  return data;
}

async function getRestaurantById(restaurantId) {
  try {
    const { data } = await api.get(`/restaurants/${encodeURIComponent(restaurantId)}`);
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

const restaurantsService = {
  getRestaurants,
  getRestaurantById,
};

export default restaurantsService;
