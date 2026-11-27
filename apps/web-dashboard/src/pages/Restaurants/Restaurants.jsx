import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RestaurantCard from '../../components/RestaurantCard/RestaurantCard';
import restaurantsService, {
  isRestaurantOpenNow,
} from '../../services/restaurantsService';
import searchService from '../../services/searchService';
import {
  PREFS_CHANGE_EVENT,
  readPreferences,
} from '../../services/preferencesStore';
import { apiErrorMessage } from '../../services/apiError';
import './Restaurants.css';

const CUISINE_LIST = [
  'Середземноморська',
  'Сучасна українська',
  'Європейська',
  'Італійська',
  'Азійська',
  'Кафе та сніданки',
  'Американська',
  'Японська',
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();

  const city = searchParams.get('city')?.trim() || '';
  const cuisine = searchParams.get('cuisine') || '';
  const minRating = searchParams.get('minRating') || '';
  const checkMin = searchParams.get('checkMin') || '0';
  const checkMax = searchParams.get('checkMax') || '1200';
  const search = searchParams.get('query') || '';
  const openOnly = searchParams.get('openNow') === 'true';
  const maxDistanceParam = searchParams.get('maxDistance') || '10';
  const sortBy = searchParams.get('sort') || 'name';

  const [allCities, setAllCities] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [previewMap, setPreviewMap] = useState(new Map());
  const [prefs, setPrefs] = useState(readPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('');

  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(PREFS_CHANGE_EVENT, sync);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, sync);
  }, []);

  useEffect(() => {
    let active = true;
    restaurantsService.getRestaurants()
      .then((all) => {
        if (!active) return;
        const cities = [...new Set(all.map((r) => r.city?.trim()).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b, 'uk-UA'));
        setAllCities(cities);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [reloadKey]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadRestaurants() {
      setIsLoading(true);
      setError('');

      try {
        const result = await restaurantsService.getRestaurants(city);
        if (!isActive) return;
        setRestaurants(result);

        const missingLogo = result.filter((item) => !item.logoUrl);
        if (missingLogo.length > 0) {
          const previews = await Promise.allSettled(
            missingLogo.map(async (item) => {
              const page = await searchService.searchDishes(
                item.id,
                { page: 1, pageSize: 5 },
                { signal: controller.signal }
              );
              const firstPhoto = page.items.find((d) => d.imageUrl)?.imageUrl || null;
              return [item.id, firstPhoto];
            })
          );
          if (!isActive) return;
          const nextMap = new Map();
          for (const outcome of previews) {
            if (outcome.status === 'fulfilled' && outcome.value[1]) {
              nextMap.set(outcome.value[0], outcome.value[1]);
            }
          }
          setPreviewMap(nextMap);
        }
      } catch (failure) {
        if (isActive) {
          setError(apiErrorMessage(failure, 'Не вдалося завантажити заклади.'));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadRestaurants();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [city, reloadKey]);

  function updateParam(key, value) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }

  function resetAllFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  function requestGeolocation() {
    if (!navigator.geolocation) {
      setGeoStatus('Браузер не підтримує геолокацію. Оберіть місто вручну.');
      return;
    }

    setGeoStatus('Визначаємо ваше місцезнаходження…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setGeoStatus('Геолокацію визначено.');
        updateParam('sort', 'distance');
      },
      () => {
        setGeoStatus('Доступ до геолокації відхилено. Оберіть місто вручну.');
      },
      { timeout: 8000 }
    );
  }

  const enrichedRestaurants = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('uk-UA');
    const maxDist = Number(maxDistanceParam);
    const blacklistedIds = new Set(prefs.blacklistRestaurants.map((r) => Number(r.id)));

    const list = restaurants
      .filter((restaurant) => !blacklistedIds.has(Number(restaurant.id)))
      .map((restaurant) => {
        const hasCoords = restaurant.latitude != null && restaurant.longitude != null;
        const distanceKm =
          userCoords && hasCoords
            ? haversineKm(
                userCoords.lat,
                userCoords.lon,
                Number(restaurant.latitude),
                Number(restaurant.longitude)
              )
            : null;
        return {
          ...restaurant,
          previewImageUrl: previewMap.get(restaurant.id) || null,
          distanceKm,
        };
      })
      .filter((restaurant) => {
        if (normalizedSearch) {
          const haystack = [
            restaurant.name,
            restaurant.city,
            restaurant.address,
            restaurant.description,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase('uk-UA');
          if (!haystack.includes(normalizedSearch)) return false;
        }

        if (openOnly) {
          const openState = isRestaurantOpenNow(restaurant.openingHoursJson);
          if (openState === false) return false;
        }

        if (userCoords && Number.isFinite(maxDist) && maxDist < 10) {
          if (restaurant.distanceKm != null && restaurant.distanceKm > maxDist) {
            return false;
          }
        }

        return true;
      });

    const sorted = [...list];
    if (sortBy === 'distance' && userCoords) {
      sorted.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) {
          return a.name.localeCompare(b.name, 'uk-UA');
        }
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === 'name_desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name, 'uk-UA'));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'uk-UA'));
    }

    return sorted;
  }, [restaurants, previewMap, prefs, search, openOnly, maxDistanceParam, userCoords, sortBy]);

  const hasFilters = Boolean(city || search.trim() || openOnly || cuisine || minRating);

  return (
    <main className="restaurants-page">
      <header className="restaurants-page__header">
        <div>
          <span className="sm-eyebrow">Де поїсти</span>
          <h1>Ресторани поруч</h1>
        </div>
        <p className="restaurants-page__intro">
          Перевірені заклади міста з меню, цінами та чесними рейтингами.
        </p>
      </header>

      <section className="restaurants-location-bar" aria-label="Локація">
        <div className="restaurants-location-bar__info">
          <span className="restaurants-location-bar__pin" aria-hidden="true">◎</span>
          <div className="restaurants-location-bar__field">
            <label htmlFor="restaurant-city">Місто або адреса</label>
            <select
              id="restaurant-city"
              className="restaurants-location-bar__select"
              value={city}
              onChange={(event) => updateParam('city', event.target.value)}
            >
              <option value="">Усі міста</option>
              {allCities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
            {geoStatus && <p className="restaurants-location-bar__status">{geoStatus}</p>}
          </div>
        </div>

        <button
          type="button"
          className="restaurants-location-bar__btn"
          onClick={requestGeolocation}
        >
          ◎ Визначити місцезнаходження
        </button>
      </section>

      <section className="restaurants-filter-card" aria-label="Фільтри закладів">
        <div className="restaurants-filter-card__search">
          <span aria-hidden="true">⌕</span>
          <input
            id="restaurant-search"
            type="search"
            aria-label="Пошук за назвою або містом"
            placeholder="Пошук за назвою або містом"
            value={search}
            onChange={(event) => updateParam('query', event.target.value)}
          />
        </div>

        <div className="restaurants-filter-card__controls">
          <div className="restaurants-filter-field">
            <label htmlFor="restaurant-cuisine">Кухня</label>
            <select
              id="restaurant-cuisine"
              value={cuisine}
              onChange={(event) => updateParam('cuisine', event.target.value)}
            >
              <option value="">Усі кухні</option>
              {CUISINE_LIST.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="restaurants-filter-field">
            <label htmlFor="restaurant-rating">Мінімальний рейтинг</label>
            <select
              id="restaurant-rating"
              value={minRating}
              onChange={(event) => updateParam('minRating', event.target.value)}
            >
              <option value="">Будь-який</option>
              <option value="4.5">4,5 і вище</option>
              <option value="4">4 і вище</option>
              <option value="3">3 і вище</option>
            </select>
          </div>

          <div className="restaurants-filter-field restaurants-filter-field--check">
            <label>Приблизно на одну особу</label>
            <div className="restaurants-check-inputs">
              <input
                type="number"
                min="0"
                aria-label="Мінімальний чек"
                value={checkMin}
                onChange={(event) => updateParam('checkMin', event.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                min="0"
                aria-label="Максимальний чек"
                value={checkMax}
                onChange={(event) => updateParam('checkMax', event.target.value)}
              />
            </div>
          </div>

          <div className="restaurants-filter-field restaurants-filter-field--range">
            <label htmlFor="restaurant-distance">
              Відстань: до {maxDistanceParam} км
            </label>
            <input
              id="restaurant-distance"
              type="range"
              min="1"
              max="10"
              step="1"
              value={Number(maxDistanceParam) || 10}
              onChange={(event) => updateParam('maxDistance', event.target.value)}
            />
          </div>

          <label className="restaurants-open-pill">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(event) =>
                updateParam('openNow', event.target.checked ? 'true' : '')
              }
            />
            <span>Відкрито зараз</span>
          </label>
        </div>
      </section>

      <div className="restaurants-results-bar">
        <div className="restaurants-results-bar__left">
          <span role="status">
            {isLoading
              ? 'Завантажуємо заклади…'
              : `Знайдено ${enrichedRestaurants.length} ресторанів`}
          </span>
          {hasFilters && (
            <button
              type="button"
              className="restaurants-filter-reset"
              onClick={resetAllFilters}
            >
              Скинути фільтри ×
            </button>
          )}
        </div>

        <select
          className="restaurants-results-bar__sort"
          aria-label="Сортування закладів"
          value={sortBy}
          onChange={(event) => updateParam('sort', event.target.value === 'name' ? '' : event.target.value)}
        >
          <option value="name">За рейтингом</option>
          <option value="distance">За відстанню</option>
          <option value="name_desc">За назвою (Я–А)</option>
        </select>
      </div>

      {isLoading ? (
        <div className="restaurants-page__message" role="status">
          Завантажуємо заклади…
        </div>
      ) : error ? (
        <div className="restaurants-page__message restaurants-page__message--error" role="alert">
          <p>{error}</p>
          <button
            className="restaurants-page__clear"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Спробувати ще раз
          </button>
        </div>
      ) : enrichedRestaurants.length > 0 ? (
        <ul className="restaurants-page__grid">
          {enrichedRestaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <RestaurantCard
                restaurant={restaurant}
                distanceKm={restaurant.distanceKm}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="restaurants-page__message" role="status">
          <h2 className="sm-serif">
            {hasFilters
              ? 'За заданими фільтрами закладів не знайдено'
              : 'Заклади ще попереду'}
          </h2>
          <p>
            {hasFilters
              ? 'Спробуйте інше місто, змініть запит або скиньте фільтри.'
              : 'Щойно заклади з’являться в системі, ви зможете переглядати їхні меню.'}
          </p>
          {hasFilters && (
            <button
              className="restaurants-page__clear"
              type="button"
              onClick={resetAllFilters}
            >
              Скинути фільтри
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default Restaurants;
