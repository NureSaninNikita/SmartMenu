import api from '../api/axios';

function imageUrl(url) {
  if (!url) return null;
  return new URL(url, new URL(api.defaults.baseURL || '/', window.location.origin)).href;
}

async function loadDish(dishId) {
  try {
    const { data } = await api.get(`/dishes/${encodeURIComponent(dishId)}`);
    return {
      ...data,
      imageUrl: imageUrl(data.imageUrl),
      photos: data.photos.map(imageUrl),
    };
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function getFeaturedDish() {
  return loadDish(1);
}

async function getDishById(restaurantId, dishId) {
  const dish = await loadDish(dishId);
  return dish && String(dish.restaurantId) === String(restaurantId) ? dish : null;
}

const dishesService = {
  getFeaturedDish,
  getDishById,
};

export default dishesService;
