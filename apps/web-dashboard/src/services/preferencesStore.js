const STORAGE_KEY = 'smartmenu:user-preferences:v1';
export const PREFS_CHANGE_EVENT = 'smartmenu:prefs-change';

const DEFAULT_PREFS = {
  whitelistDishes: [],
  whitelistRestaurants: [],
  blacklistDishes: [],
  blacklistRestaurants: [],
  blacklistIngredients: [],
};

export function readPreferences() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return {
      whitelistDishes: Array.isArray(parsed.whitelistDishes) ? parsed.whitelistDishes : [],
      whitelistRestaurants: Array.isArray(parsed.whitelistRestaurants) ? parsed.whitelistRestaurants : [],
      blacklistDishes: Array.isArray(parsed.blacklistDishes) ? parsed.blacklistDishes : [],
      blacklistRestaurants: Array.isArray(parsed.blacklistRestaurants) ? parsed.blacklistRestaurants : [],
      blacklistIngredients: Array.isArray(parsed.blacklistIngredients) ? parsed.blacklistIngredients : [],
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function writePreferences(next) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PREFS_CHANGE_EVENT));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function toggleWhitelistDish(dish) {
  const prefs = readPreferences();
  const exists = prefs.whitelistDishes.some((d) => Number(d.id) === Number(dish.id));
  const whitelistDishes = exists
    ? prefs.whitelistDishes.filter((d) => Number(d.id) !== Number(dish.id))
    : [
        ...prefs.whitelistDishes,
        {
          id: dish.id,
          restaurantId: dish.restaurantId,
          title: dish.title,
          restaurantName: dish.restaurantName || '',
          price: dish.price ?? null,
        },
      ];
  const blacklistDishes = exists
    ? prefs.blacklistDishes
    : prefs.blacklistDishes.filter((d) => Number(d.id) !== Number(dish.id));
  return writePreferences({ ...prefs, whitelistDishes, blacklistDishes });
}

export function toggleBlacklistDish(dish) {
  const prefs = readPreferences();
  const exists = prefs.blacklistDishes.some((d) => Number(d.id) === Number(dish.id));
  const blacklistDishes = exists
    ? prefs.blacklistDishes.filter((d) => Number(d.id) !== Number(dish.id))
    : [
        ...prefs.blacklistDishes,
        {
          id: dish.id,
          restaurantId: dish.restaurantId,
          title: dish.title,
          restaurantName: dish.restaurantName || '',
        },
      ];
  const whitelistDishes = exists
    ? prefs.whitelistDishes
    : prefs.whitelistDishes.filter((d) => Number(d.id) !== Number(dish.id));
  return writePreferences({ ...prefs, whitelistDishes, blacklistDishes });
}

export function toggleWhitelistRestaurant(restaurant) {
  const prefs = readPreferences();
  const exists = prefs.whitelistRestaurants.some((r) => Number(r.id) === Number(restaurant.id));
  const whitelistRestaurants = exists
    ? prefs.whitelistRestaurants.filter((r) => Number(r.id) !== Number(restaurant.id))
    : [
        ...prefs.whitelistRestaurants,
        {
          id: restaurant.id,
          name: restaurant.name,
          city: restaurant.city || '',
          address: restaurant.address || '',
        },
      ];
  const blacklistRestaurants = exists
    ? prefs.blacklistRestaurants
    : prefs.blacklistRestaurants.filter((r) => Number(r.id) !== Number(restaurant.id));
  return writePreferences({ ...prefs, whitelistRestaurants, blacklistRestaurants });
}

export function toggleBlacklistRestaurant(restaurant) {
  const prefs = readPreferences();
  const exists = prefs.blacklistRestaurants.some((r) => Number(r.id) === Number(restaurant.id));
  const blacklistRestaurants = exists
    ? prefs.blacklistRestaurants.filter((r) => Number(r.id) !== Number(restaurant.id))
    : [
        ...prefs.blacklistRestaurants,
        {
          id: restaurant.id,
          name: restaurant.name,
          city: restaurant.city || '',
          address: restaurant.address || '',
        },
      ];
  const whitelistRestaurants = exists
    ? prefs.whitelistRestaurants
    : prefs.whitelistRestaurants.filter((r) => Number(r.id) !== Number(restaurant.id));
  return writePreferences({ ...prefs, whitelistRestaurants, blacklistRestaurants });
}

export function addBlacklistIngredient(name) {
  const trimmed = name.trim();
  if (!trimmed) return readPreferences();
  const prefs = readPreferences();
  const exists = prefs.blacklistIngredients.some(
    (item) => item.toLocaleLowerCase('uk-UA') === trimmed.toLocaleLowerCase('uk-UA')
  );
  if (exists) return prefs;
  return writePreferences({
    ...prefs,
    blacklistIngredients: [...prefs.blacklistIngredients, trimmed],
  });
}

export function removeBlacklistIngredient(name) {
  const prefs = readPreferences();
  return writePreferences({
    ...prefs,
    blacklistIngredients: prefs.blacklistIngredients.filter((item) => item !== name),
  });
}
