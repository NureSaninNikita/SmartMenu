import api from '../api/axios';

function imageUrl(url) {
  if (!url) return null;

  return new URL(
    url,
    new URL(api.defaults.baseURL || '/', window.location.origin)
  ).href;
}

async function getFilters(restaurantId, { signal } = {}) {
  const { data } = await api.get(
    `/restaurants/${encodeURIComponent(restaurantId)}/dish-filters`,
    { signal }
  );

  return data;
}

async function getAllIngredients({ signal } = {}) {
  const { data } = await api.get('/ingredients', { signal });
  return data;
}

async function searchDishes(
  restaurantId,
  filters = {},
  { signal } = {}
) {
  const params = new URLSearchParams();
  const query = filters.query?.trim();

  if (query) {
    params.set('query', query);
  }

  if (filters.categoryId) {
    params.set('categoryId', filters.categoryId);
  }

  for (const ingredientId of filters.ingredientIds || []) {
    params.append('ingredientIds', ingredientId);
  }

  params.set('page', String(filters.page ?? 1));
  params.set('pageSize', String(filters.pageSize ?? 20));

  const { data } = await api.get(
    `/restaurants/${encodeURIComponent(restaurantId)}/dishes`,
    { params, signal }
  );

  return {
    ...data,
    items: data.items.map((dish) => ({
      ...dish,
      imageUrl: imageUrl(dish.imageUrl),
    })),
  };
}

async function getMenu(
  restaurantId,
  filters = {},
  { signal } = {}
) {
  const firstPage = await searchDishes(
    restaurantId,
    {
      ...filters,
      page: 1,
      pageSize: 100,
    },
    { signal }
  );

  const items = [...firstPage.items];
  const totalPages = Math.ceil(firstPage.total / firstPage.pageSize);

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await searchDishes(
      restaurantId,
      {
        ...filters,
        page,
        pageSize: firstPage.pageSize,
      },
      { signal }
    );

    items.push(...nextPage.items);
  }

  return items;
}

async function getCatalogDishes(restaurants, filters = {}, { signal } = {}) {
  const selectedIds = filters.restaurantIds?.length
    ? new Set(filters.restaurantIds.map(Number))
    : null;
  const targetRestaurants = selectedIds
    ? restaurants.filter((restaurant) => selectedIds.has(Number(restaurant.id)))
    : restaurants;

  const results = await Promise.allSettled(
    targetRestaurants.map(async (restaurant) => {
      const items = await getMenu(
        restaurant.id,
        {
          query: filters.query || '',
          categoryId:
            targetRestaurants.length === 1 && filters.categoryId
              ? filters.categoryId
              : undefined,
          ingredientIds: filters.ingredientIds || [],
        },
        { signal }
      );
      return items.map((dish) => ({
        ...dish,
        restaurantName: restaurant.name,
        restaurantCity: restaurant.city || null,
      }));
    })
  );

  const dishes = [];
  let failedCount = 0;

  for (const outcome of results) {
    if (outcome.status === 'fulfilled') {
      dishes.push(...outcome.value);
    } else if (outcome.reason?.code !== 'ERR_CANCELED') {
      failedCount += 1;
    }
  }

  if (targetRestaurants.length > 0 && failedCount === targetRestaurants.length) {
    const firstRejection = results.find((item) => item.status === 'rejected');
    throw firstRejection?.reason || new Error('Failed to load catalog dishes');
  }

  return dishes;
}

const searchService = {
  getFilters,
  getAllIngredients,
  searchDishes,
  getMenu,
  getCatalogDishes,
};

export default searchService;
