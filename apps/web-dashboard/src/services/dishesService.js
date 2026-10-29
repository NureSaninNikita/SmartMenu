const featuredDish = {
  id: 'oblaka-1',
  restaurantId: 'oblaka',
  restaurantName: 'Oblaka',
  title: 'Салат зі свіжих овочів та ніжним сиром',
  category: 'Салати',
  description: null,
  price: 229,
  currency: 'UAH',
  weight: null,
  imageUrl: 'https://cdn-media.choiceqr.com/prod-eat-oblaka/menu/fRzFXEZ-cDWMiAc-TVErGeR.jpeg.webp',
};

async function getFeaturedDish() {
  return featuredDish;
}

async function getDishesByRestaurantId(restaurantId) {
  return featuredDish.restaurantId === restaurantId
    ? [featuredDish]
    : [];
}

async function getDishById(restaurantId, dishId) {
  return (
    featuredDish.restaurantId === restaurantId &&
    featuredDish.id === dishId
  )
    ? featuredDish
    : null;
}

const dishesService = {
  getFeaturedDish,
  getDishesByRestaurantId,
  getDishById,
};

export default dishesService;