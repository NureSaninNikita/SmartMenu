import api from '../api/axios';

const reviewService = {
  async getRestaurantReviews(restaurantId) {
    const { data } = await api.get(
      `/restaurants/${encodeURIComponent(restaurantId)}/reviews`
    );
    return data;
  },
  async createDishReview(dishId, text) {
    const { data } = await api.post(
      `/dishes/${encodeURIComponent(dishId)}/reviews`, { text }
    );
    return data;
  },
  async createRestaurantReview(restaurantId, text) {
    const { data } = await api.post(
      `/restaurants/${encodeURIComponent(restaurantId)}/reviews`, { text }
    );
    return data;
  },
  async updateReview(reviewId, text) {
    const { data } = await api.put(
      `/reviews/${encodeURIComponent(reviewId)}`, { text }
    );
    return data;
  },
  async deleteReview(reviewId) {
    await api.delete(`/reviews/${encodeURIComponent(reviewId)}`);
  },
};

export default reviewService;
