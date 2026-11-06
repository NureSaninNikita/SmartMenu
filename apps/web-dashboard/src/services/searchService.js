import api from '../api/axios';

async function getFilters(restaurantId) {
  const { data } = await api.get(`/restaurants/${encodeURIComponent(restaurantId)}/dish-filters`);
  return data;
}

async function searchDishes(restaurantId, filters) {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  for (const ingredientId of filters.ingredientIds) {
    params.append('ingredientIds', ingredientId);
  }
  params.set('page', filters.page);
  params.set('pageSize', '20');
  const { data } = await api.get(`/restaurants/${encodeURIComponent(restaurantId)}/dishes`, { params });
  return data;
}

const searchService = { getFilters, searchDishes };

export default searchService;
