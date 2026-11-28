import api from '../api/axios';

export function parseOpeningHours(openingHoursJson) {
  if (!openingHoursJson) return null;
  try {
    const parsed = JSON.parse(openingHoursJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isRestaurantOpenNow(openingHoursJson) {
  const schedule = parseOpeningHours(openingHoursJson);
  if (!schedule) return null;

  const now = new Date();
  const dayNames = [
    ['sun', 'sunday', 'нд', 'неділя', '0'],
    ['mon', 'monday', 'пн', 'понеділок', '1'],
    ['tue', 'tuesday', 'вт', 'вівторок', '2'],
    ['wed', 'wednesday', 'ср', 'середа', '3'],
    ['thu', 'thursday', 'чт', 'четвер', '4'],
    ['fri', 'friday', 'пт', 'пʼятниця', "п'ятниця", '5'],
    ['sat', 'saturday', 'сб', 'субота', '6'],
  ];

  const todayKeys = dayNames[now.getDay()];
  const entries = Object.entries(schedule);
  const match = entries.find(([key]) =>
    todayKeys.includes(key.trim().toLowerCase()) ||
    key.trim().toLowerCase() === 'daily' ||
    key.trim().toLowerCase() === 'щодня'
  );

  if (!match) return null;
  const raw = String(match[1] ?? '').trim();
  if (!raw || /closed|вихідний|зачинено/i.test(raw)) return false;

  const timeMatch = raw.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;

  const openMinutes = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  const closeMinutes = Number(timeMatch[3]) * 60 + Number(timeMatch[4]);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

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
