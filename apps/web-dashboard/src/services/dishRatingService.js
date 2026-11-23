import api from '../api/axios';

const ratingPath = (dishId) => `/dishes/${encodeURIComponent(dishId)}/rating`;

const dishRatingService = {
  async getMine(dishId) {
    const { data } = await api.get(ratingPath(dishId));
    return data;
  },
  async setMine(dishId, value) {
    const { data } = await api.put(ratingPath(dishId), { value });
    return data;
  },
};

export default dishRatingService;
