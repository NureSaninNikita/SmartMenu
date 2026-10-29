const restaurants = [
  {
    id: 'oblaka',
    name: 'Oblaka',
  },
];

async function getRestaurants() {
  return restaurants;
}

async function getRestaurantById(restaurantId) {
  return restaurants.find((restaurant) => restaurant.id === restaurantId) ?? null;
}

const restaurantsService = {
  getRestaurants,
  getRestaurantById,
};

export default restaurantsService;