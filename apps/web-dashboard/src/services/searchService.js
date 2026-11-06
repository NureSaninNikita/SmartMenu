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

const searchService = {
  getFilters,
  searchDishes,
  getMenu,
};

export default searchService;