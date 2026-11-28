import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DishCard from '../../components/DishCard/DishCard';
import restaurantsService, {
  isRestaurantOpenNow,
} from '../../services/restaurantsService';
import searchService from '../../services/searchService';
import {
  PREFS_CHANGE_EVENT,
  readPreferences,
} from '../../services/preferencesStore';
import { apiErrorMessage } from '../../services/apiError';
import './Dishes.css';

const CUISINE_OPTIONS = [
  'Середземноморська',
  'Сучасна українська',
  'Європейська',
  'Італійська',
  'Азійська',
  'Кафе та сніданки',
  'Американська',
  'Японська',
];

const DIET_OPTIONS = [
  { id: 'all', label: 'Усі' },
  { id: 'vegetarian', label: 'Вегетаріанське' },
  { id: 'vegan', label: 'Веганське' },
];

const RATING_OPTIONS = [
  { id: '4.5', label: '4,5 і вище' },
  { id: '4', label: '4 і вище' },
  { id: '3', label: '3 і вище' },
  { id: '', label: 'Будь-який' },
];

function parsePositiveIds(values) {
  return [...new Set(
    values
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
  )].sort((a, b) => a - b);
}

function Dishes() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('query') || '';
  const selectedCategories = searchParams.getAll('category').filter(Boolean);
  const selectedCuisines = searchParams.getAll('cuisine').filter(Boolean);
  const dietType = searchParams.get('diet') || 'all';
  const minRatingParam = searchParams.get('minRating') || '';
  const maxDistanceParam = searchParams.get('distance') || '10';
  const selectedRestaurantIds = parsePositiveIds(searchParams.getAll('restaurantId'));
  const selectedIngredientIds = parsePositiveIds(searchParams.getAll('ingredientIds'));
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const restaurantOpenOnly = searchParams.get('openNow') === 'true';
  const availableOnly = searchParams.get('availableOnly') === 'true';
  const sortBy = searchParams.get('sort') || 'relevance';
  const viewMode = searchParams.get('view') === 'list' ? 'list' : 'card';

  const selectedRestaurantKey = selectedRestaurantIds.join(',');
  const selectedIngredientKey = selectedIngredientIds.join(',');

  const [useBlacklist, setUseBlacklist] = useState(true);
  const [useFavorites, setUseFavorites] = useState(true);
  const [prefs, setPrefs] = useState(readPreferences);

  const [debouncedQuery, setDebouncedQuery] = useState(() => query.trim());
  const [restaurantFilterSearch, setRestaurantFilterSearch] = useState('');
  const [ingredientFilterSearch, setIngredientFilterSearch] = useState('');

  const [restaurants, setRestaurants] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(PREFS_CHANGE_EVENT, sync);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, sync);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 280);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadMetadata() {
      setMetaLoading(true);
      setError('');

      try {
        const [restaurantsData, ingredientsData] = await Promise.all([
          restaurantsService.getRestaurants(),
          searchService.getAllIngredients({ signal: controller.signal }),
        ]);

        if (!active) return;
        setRestaurants(restaurantsData);
        setIngredients(ingredientsData);

        const filterResults = await Promise.allSettled(
          restaurantsData.map((restaurant) =>
            searchService.getFilters(restaurant.id, { signal: controller.signal })
          )
        );

        if (!active) return;
        const categoryNames = new Set();
        for (const outcome of filterResults) {
          if (outcome.status === 'fulfilled') {
            for (const cat of outcome.value.categories || []) {
              if (cat.name) categoryNames.add(cat.name);
            }
          }
        }
        setAllCategories([...categoryNames].sort((a, b) => a.localeCompare(b, 'uk-UA')));
      } catch (failure) {
        if (active && failure?.code !== 'ERR_CANCELED') {
          setError(apiErrorMessage(failure, 'Не вдалося завантажити фільтри каталогу.'));
        }
      } finally {
        if (active) setMetaLoading(false);
      }
    }

    loadMetadata();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  useEffect(() => {
    if (metaLoading) return;

    let active = true;
    const controller = new AbortController();

    async function loadDishes() {
      setDishesLoading(true);
      setError('');

      try {
        const result = await searchService.getCatalogDishes(
          restaurants,
          {
            query: debouncedQuery,
            restaurantIds: selectedRestaurantKey
              ? selectedRestaurantKey.split(',').map(Number)
              : [],
            ingredientIds: selectedIngredientKey
              ? selectedIngredientKey.split(',').map(Number)
              : [],
          },
          { signal: controller.signal }
        );

        if (active) {
          setDishes(result);
        }
      } catch (failure) {
        if (active && failure?.code !== 'ERR_CANCELED') {
          setError(apiErrorMessage(failure, 'Не вдалося завантажити страви.'));
        }
      } finally {
        if (active) setDishesLoading(false);
      }
    }

    loadDishes();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    metaLoading,
    restaurants,
    debouncedQuery,
    selectedRestaurantKey,
    selectedIngredientKey,
    reloadKey,
  ]);

  const restaurantMap = useMemo(() => {
    const map = new Map();
    for (const r of restaurants) map.set(Number(r.id), r);
    return map;
  }, [restaurants]);

  const priceBounds = useMemo(() => {
    const prices = dishes
      .map((dish) => Number(dish.price))
      .filter((price) => Number.isFinite(price) && price >= 0);
    if (prices.length === 0) return { min: 0, max: 600 };
    return {
      min: 0,
      max: Math.max(600, Math.ceil(Math.max(...prices) / 50) * 50),
    };
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    const minPrice = minPriceParam !== '' ? Number(minPriceParam) : null;
    const maxPrice = maxPriceParam !== '' ? Number(maxPriceParam) : null;
    const blacklistedDishIds = new Set(prefs.blacklistDishes.map((d) => Number(d.id)));
    const blacklistedRestIds = new Set(prefs.blacklistRestaurants.map((r) => Number(r.id)));
    const whitelistedDishIds = new Set(prefs.whitelistDishes.map((d) => Number(d.id)));

    const list = dishes.filter((dish) => {
      if (useBlacklist) {
        if (blacklistedDishIds.has(Number(dish.id))) return false;
        if (blacklistedRestIds.has(Number(dish.restaurantId))) return false;
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(dish.category)) {
        return false;
      }

      if (availableOnly && dish.status !== 'Available') {
        return false;
      }

      if (restaurantOpenOnly) {
        const rest = restaurantMap.get(Number(dish.restaurantId));
        if (rest && isRestaurantOpenNow(rest.openingHoursJson) === false) {
          return false;
        }
      }

      if (minPrice !== null && Number.isFinite(minPrice) && dish.price != null && Number(dish.price) < minPrice) {
        return false;
      }

      if (maxPrice !== null && Number.isFinite(maxPrice) && dish.price != null && Number(dish.price) > maxPrice) {
        return false;
      }

      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'uk-UA'));
    }

    if (useFavorites && whitelistedDishIds.size > 0) {
      sorted.sort((a, b) => {
        const aFav = whitelistedDishIds.has(Number(a.id)) ? 1 : 0;
        const bFav = whitelistedDishIds.has(Number(b.id)) ? 1 : 0;
        return bFav - aFav;
      });
    }

    return sorted;
  }, [
    dishes,
    prefs,
    useBlacklist,
    useFavorites,
    selectedCategories,
    availableOnly,
    restaurantOpenOnly,
    restaurantMap,
    minPriceParam,
    maxPriceParam,
    sortBy,
  ]);

  const activeFiltersCount =
    (query.trim() ? 1 : 0) +
    selectedCategories.length +
    selectedCuisines.length +
    (dietType !== 'all' ? 1 : 0) +
    (minRatingParam ? 1 : 0) +
    selectedRestaurantIds.length +
    selectedIngredientIds.length +
    (minPriceParam !== '' ? 1 : 0) +
    (maxPriceParam !== '' ? 1 : 0) +
    (restaurantOpenOnly ? 1 : 0) +
    (availableOnly ? 1 : 0);

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

  function toggleMultiParam(key, value) {
    const strValue = String(value);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      const existing = next.getAll(key);
      next.delete(key);
      const exists = existing.includes(strValue);
      const updated = exists
        ? existing.filter((item) => item !== strValue)
        : [...existing, strValue];
      for (const item of updated) {
        next.append(key, item);
      }
      return next;
    }, { replace: true });
  }

  function resetFilters() {
    setDebouncedQuery('');
    setSearchParams((current) => {
      const next = new URLSearchParams();
      if (current.get('view') === 'list') {
        next.set('view', 'list');
      }
      return next;
    }, { replace: true });
  }

  const visibleRestaurants = restaurants.filter((restaurant) =>
    restaurant.name
      .toLocaleLowerCase('uk-UA')
      .includes(restaurantFilterSearch.trim().toLocaleLowerCase('uk-UA'))
  );

  const visibleIngredients = ingredients.filter((ingredient) =>
    ingredient.name
      .toLocaleLowerCase('uk-UA')
      .includes(ingredientFilterSearch.trim().toLocaleLowerCase('uk-UA'))
  );

  const isLoading = metaLoading || dishesLoading;

  return (
    <main className="dishes-page">
      <header className="dishes-page__header">
        <div>
          <span className="sm-eyebrow">Розумний пошук у меню</span>
          <h1>Страви</h1>
        </div>
        <p className="dishes-page__intro">
          Знайдіть саме те, чого хочеться, з урахуванням складу та вподобань.
        </p>
      </header>

      <div className="dishes-toolbar">
        <div className="dishes-toolbar__count">
          <strong role="status">
            {isLoading ? 'Пошук…' : `${filteredDishes.length} результатів`}
          </strong>
          <span>{activeFiltersCount} активних фільтрів</span>
        </div>

        <button
          type="button"
          className="dishes-toolbar__reset"
          onClick={resetFilters}
        >
          Скинути фільтри
        </button>

        <div className="dishes-toolbar__search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Пошук страв"
            placeholder="Страва, ресторан або складник"
            maxLength={200}
            value={query}
            onChange={(event) => updateParam('query', event.target.value)}
          />
        </div>

        <select
          className="dishes-toolbar__sort"
          aria-label="Сортування страв"
          value={sortBy}
          onChange={(event) => updateParam('sort', event.target.value === 'relevance' ? '' : event.target.value)}
        >
          <option value="relevance">За релевантністю</option>
          <option value="rating">За рейтингом</option>
          <option value="price_asc">Ціна: від нижчої</option>
          <option value="price_desc">Ціна: від вищої</option>
          <option value="distance">За відстанню</option>
          <option value="title">За назвою</option>
        </select>

        <div className="dishes-toolbar__view" role="group" aria-label="Вигляд списку">
          <button
            type="button"
            className={viewMode === 'card' ? 'dishes-view-btn dishes-view-btn--active' : 'dishes-view-btn'}
            aria-pressed={viewMode === 'card'}
            onClick={() => updateParam('view', '')}
          >
            Картки
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'dishes-view-btn dishes-view-btn--active' : 'dishes-view-btn'}
            aria-pressed={viewMode === 'list'}
            onClick={() => updateParam('view', 'list')}
          >
            Список
          </button>
        </div>
      </div>

      <div className="dishes-layout">
        <aside className="dishes-sidebar" aria-label="Фільтри страв">
          <div className="dishes-availability-panel">
            <h2>Налаштування видачі</h2>

            <label className="dishes-toggle">
              <input
                type="checkbox"
                checked={useBlacklist}
                onChange={(event) => setUseBlacklist(event.target.checked)}
              />
              <span className="dishes-toggle__slider" aria-hidden="true" />
              <span className="dishes-toggle__text">
                <strong>Враховувати чорний список</strong>
                <small>Приховує заборонене</small>
              </span>
            </label>

            <div className="dishes-panel-divider" />

            <label className="dishes-toggle">
              <input
                type="checkbox"
                checked={useFavorites}
                onChange={(event) => setUseFavorites(event.target.checked)}
              />
              <span className="dishes-toggle__slider" aria-hidden="true" />
              <span className="dishes-toggle__text">
                <strong>Враховувати обране</strong>
                <small>Підіймає улюблене</small>
              </span>
            </label>
          </div>

          <div className="dishes-filters__head">
            <h2>Фільтри</h2>
            <button type="button" onClick={resetFilters}>
              Скинути
            </button>
          </div>

          <details className="dishes-filter-group" open>
            <summary>Тип страви</summary>
            <div className="dishes-filter-group__body">
              {allCategories.length === 0 ? (
                <p className="dishes-filter-empty">Категорії завантажуються…</p>
              ) : (
                <div className="dishes-filter-scroll">
                  {allCategories.map((category) => (
                    <label key={category} className="dishes-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleMultiParam('category', category)}
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </details>

          <details className="dishes-filter-group" open>
            <summary>Ціна, ₴</summary>
            <div className="dishes-filter-group__body">
              <div className="dishes-price-inputs">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  aria-label="Мінімальна ціна"
                  value={minPriceParam}
                  onChange={(event) => updateParam('minPrice', event.target.value)}
                />
                <span>—</span>
                <input
                  type="number"
                  min="0"
                  placeholder={String(priceBounds.max)}
                  aria-label="Максимальна ціна"
                  value={maxPriceParam}
                  onChange={(event) => updateParam('maxPrice', event.target.value)}
                />
              </div>
              <input
                type="range"
                className="dishes-price-range"
                min={priceBounds.min}
                max={priceBounds.max}
                step="10"
                aria-label="Максимальна ціна слайдер"
                value={maxPriceParam !== '' ? Number(maxPriceParam) : priceBounds.max}
                onChange={(event) => {
                  const val = Number(event.target.value);
                  updateParam('maxPrice', val >= priceBounds.max ? '' : String(val));
                }}
              />
            </div>
          </details>

          <details className="dishes-filter-group">
            <summary>Кухня</summary>
            <div className="dishes-filter-group__body">
              {CUISINE_OPTIONS.map((cuisine) => (
                <label key={cuisine} className="dishes-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCuisines.includes(cuisine)}
                    onChange={() => toggleMultiParam('cuisine', cuisine)}
                  />
                  <span>{cuisine}</span>
                </label>
              ))}
              <p className="dishes-filter-hint">
                Фільтр за типом кухні буде підключено після розширення API.
              </p>
            </div>
          </details>

          <details className="dishes-filter-group">
            <summary>Тип харчування</summary>
            <div className="dishes-filter-group__body">
              <div className="dishes-pills-wrap">
                {DIET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={
                      dietType === opt.id
                        ? 'dishes-filter-pill dishes-filter-pill--active'
                        : 'dishes-filter-pill'
                    }
                    onClick={() => updateParam('diet', opt.id === 'all' ? '' : opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="dishes-filter-hint">
                Дієтичні мітки з’являться у наступному оновленні API.
              </p>
            </div>
          </details>

          <details className="dishes-filter-group" open={selectedRestaurantIds.length > 0}>
            <summary>
              Ресторани
              {selectedRestaurantIds.length > 0 && (
                <span className="dishes-filter-badge">{selectedRestaurantIds.length}</span>
              )}
            </summary>
            <div className="dishes-filter-group__body">
              <input
                type="search"
                className="dishes-filter-search"
                placeholder="Знайти ресторан"
                value={restaurantFilterSearch}
                onChange={(event) => setRestaurantFilterSearch(event.target.value)}
              />
              <div className="dishes-filter-scroll">
                {visibleRestaurants.map((restaurant) => (
                  <label key={restaurant.id} className="dishes-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRestaurantIds.includes(restaurant.id)}
                      onChange={() => toggleMultiParam('restaurantId', restaurant.id)}
                    />
                    <span>{restaurant.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>

          <details className="dishes-filter-group" open={selectedIngredientIds.length > 0}>
            <summary>
              Інгредієнти
              {selectedIngredientIds.length > 0 && (
                <span className="dishes-filter-badge">{selectedIngredientIds.length}</span>
              )}
            </summary>
            <div className="dishes-filter-group__body">
              <p className="dishes-filter-hint">
                Страва має містити всі вибрані інгредієнти.
              </p>
              <input
                type="search"
                className="dishes-filter-search"
                placeholder="Пошук інгредієнта"
                value={ingredientFilterSearch}
                onChange={(event) => setIngredientFilterSearch(event.target.value)}
              />
              <div className="dishes-filter-scroll">
                {visibleIngredients.map((ingredient) => (
                  <label key={ingredient.id} className="dishes-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIngredientIds.includes(ingredient.id)}
                      onChange={() => toggleMultiParam('ingredientIds', ingredient.id)}
                    />
                    <span>{ingredient.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>

          <details className="dishes-filter-group">
            <summary>Мінімальний рейтинг</summary>
            <div className="dishes-filter-group__body">
              <div className="dishes-pills-wrap">
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className={
                      minRatingParam === opt.id
                        ? 'dishes-filter-pill dishes-filter-pill--active'
                        : 'dishes-filter-pill'
                    }
                    onClick={() => updateParam('minRating', opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </details>

          <details className="dishes-filter-group">
            <summary>Відстань від адреси</summary>
            <div className="dishes-filter-group__body">
              <input
                type="range"
                className="dishes-price-range"
                min="1"
                max="10"
                step="1"
                value={Number(maxDistanceParam) || 10}
                onChange={(event) => updateParam('distance', event.target.value)}
              />
              <div className="dishes-distance-labels">
                <span>1 км</span>
                <strong>до {maxDistanceParam} км</strong>
                <span>10 км</span>
              </div>
            </div>
          </details>

          <div className="dishes-bottom-switches">
            <label className="dishes-switch-row">
              <span>Ресторан відкритий зараз</span>
              <input
                type="checkbox"
                checked={restaurantOpenOnly}
                onChange={(event) =>
                  updateParam('openNow', event.target.checked ? 'true' : '')
                }
              />
              <span className="dishes-switch-row__track" aria-hidden="true" />
            </label>

            <label className="dishes-switch-row">
              <span>Страва доступна зараз</span>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) =>
                  updateParam('availableOnly', event.target.checked ? 'true' : '')
                }
              />
              <span className="dishes-switch-row__track" aria-hidden="true" />
            </label>
          </div>
        </aside>

        <section className="dishes-results" aria-busy={isLoading}>
          {isLoading ? (
            <div className="dishes-state" role="status">
              <p>Завантажуємо актуальні страви з меню закладів…</p>
            </div>
          ) : error ? (
            <div className="dishes-state dishes-state--error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="dishes-state__btn"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Спробувати ще раз
              </button>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="dishes-state" role="status">
              <h2 className="sm-serif">За цими параметрами страв не знайдено</h2>
              <p>Спробуйте змінити пошуковий запит або скинути частину фільтрів.</p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="dishes-state__btn"
                  onClick={resetFilters}
                >
                  Скинути фільтри
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'list'
                  ? 'dishes-grid dishes-grid--list'
                  : 'dishes-grid'
              }
            >
              {filteredDishes.map((dish) => (
                <DishCard
                  key={`${dish.restaurantId}-${dish.id}`}
                  dish={dish}
                  variant={viewMode}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Dishes;
