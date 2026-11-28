import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import MenuDish from '../../components/MenuDish/MenuDish';
import RestaurantReviews from '../../components/Feedback/RestaurantReviews';
import restaurantsService, {
  isRestaurantOpenNow,
  parseOpeningHours,
} from '../../services/restaurantsService';
import searchService from '../../services/searchService';
import {
  PREFS_CHANGE_EVENT,
  readPreferences,
  toggleBlacklistRestaurant,
  toggleWhitelistRestaurant,
} from '../../services/preferencesStore';
import { apiErrorMessage } from '../../services/apiError';
import './Restaurant.css';

const TABS = [
  { id: 'menu', label: 'Меню' },
  { id: 'reviews', label: 'Відгуки' },
  { id: 'info', label: 'Інформація' },
];

function formatHoursSummary(openingHoursJson) {
  const schedule = parseOpeningHours(openingHoursJson);
  if (!schedule) return 'Щодня, 09:00–22:00';
  const entries = Object.entries(schedule);
  if (entries.length === 0) return 'Щодня, 09:00–22:00';
  if (entries.length === 1) {
    return `${entries[0][0]}: ${entries[0][1]}`;
  }
  const uniqueValues = [...new Set(entries.map(([, val]) => String(val)))];
  if (uniqueValues.length === 1) {
    return `Щодня, ${uniqueValues[0]}`;
  }
  return entries.slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ');
}

function Restaurant({ session, onOpenAuth }) {
  const { restaurantId } = useParams();
  return (
    <RestaurantContent
      key={restaurantId}
      restaurantId={restaurantId}
      session={session}
      onOpenAuth={onOpenAuth}
    />
  );
}

function RestaurantContent({ restaurantId, session, onOpenAuth }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'menu';
  const query = searchParams.get('query') || '';
  const categoryIdParam = searchParams.get('categoryId') || '';
  const selectedCategoryId = Number(categoryIdParam) > 0 ? Number(categoryIdParam) : null;
  const availableOnly = searchParams.get('availableOnly') === 'true';

  const ingredientIds = [...new Set(
    searchParams
      .getAll('ingredientIds')
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
  )].sort((a, b) => a - b);
  const ingredientKey = ingredientIds.join(',');

  const [restaurant, setRestaurant] = useState(null);
  const [options, setOptions] = useState({ categories: [], ingredients: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [debouncedQuery, setDebouncedQuery] = useState(() => query.trim());
  const [dishes, setDishes] = useState([]);
  const [heroPhoto, setHeroPhoto] = useState(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(null);
  const [prefs, setPrefs] = useState(readPreferences);

  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(PREFS_CHANGE_EVENT, sync);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, sync);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 280);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadRestaurant() {
      setIsLoading(true);
      setError('');
      try {
        const restaurantData = await restaurantsService.getRestaurantById(restaurantId);
        if (!isActive) return;
        if (!restaurantData) {
          setRestaurant(null);
          return;
        }
        const filterOptions = await searchService.getFilters(restaurantId, {
          signal: controller.signal,
        });
        if (isActive) {
          setRestaurant(restaurantData);
          setOptions(filterOptions);
        }
      } catch (failure) {
        if (isActive && failure?.code !== 'ERR_CANCELED') {
          setError(apiErrorMessage(failure, 'Не вдалося завантажити заклад.'));
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadRestaurant();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurant) return;
    let isActive = true;
    const controller = new AbortController();

    async function loadMenu() {
      setMenuLoading(true);
      setMenuError('');
      try {
        const result = await searchService.getMenu(
          restaurantId,
          {
            query: debouncedQuery,
            categoryId: selectedCategoryId || undefined,
            ingredientIds: ingredientKey
              ? ingredientKey.split(',').map(Number)
              : [],
          },
          { signal: controller.signal }
        );
        if (!isActive) return;
        setDishes(result);
        setHeroPhoto((prev) => prev || result.find((d) => d.imageUrl)?.imageUrl || null);
      } catch (failure) {
        if (isActive && failure?.code !== 'ERR_CANCELED') {
          setMenuError(apiErrorMessage(failure, 'Не вдалося завантажити меню.'));
        }
      } finally {
        if (isActive) setMenuLoading(false);
      }
    }

    loadMenu();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    restaurantId,
    restaurant,
    debouncedQuery,
    selectedCategoryId,
    ingredientKey,
    reloadKey,
  ]);

  const visibleDishes = useMemo(() => {
    if (!availableOnly) return dishes;
    return dishes.filter((dish) => dish.status === 'Available');
  }, [dishes, availableOnly]);

  // Estimate average check from real menu dishes loaded from DB
  const estimatedCheck = useMemo(() => {
    const validPrices = dishes
      .map((d) => Number(d.price))
      .filter((p) => Number.isFinite(p) && p > 0);
    if (validPrices.length === 0) return null;
    const avg = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;
    return Math.round((avg * 2) / 10) * 10;
  }, [dishes]);

  const hasFilters = Boolean(
    query.trim() || selectedCategoryId || ingredientIds.length > 0 || availableOnly
  );

  function setParam(key, value) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) {
        next.set(key, String(value));
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }

  function toggleIngredient(id) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      const selected = new Set(
        current
          .getAll('ingredientIds')
          .map(Number)
          .filter((value) => Number.isInteger(value) && value > 0)
      );
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      next.delete('ingredientIds');
      for (const ingredientId of [...selected].sort((a, b) => a - b)) {
        next.append('ingredientIds', String(ingredientId));
      }
      return next;
    }, { replace: true });
  }

  function clearFilters() {
    setDebouncedQuery('');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('query');
      next.delete('categoryId');
      next.delete('ingredientIds');
      next.delete('availableOnly');
      return next;
    }, { replace: true });
  }

  if (isLoading) {
    return (
      <main className="restaurant-page">
        <div className="restaurant-page__state" role="status">
          Завантажуємо заклад…
        </div>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="restaurant-page">
        <div className="restaurant-page__state restaurant-page__state--error">
          {error ? <p role="alert">{error}</p> : <h1>Заклад не знайдено</h1>}
          <Link to="/restaurants" className="restaurant-page__back-link">
            ← До списку закладів
          </Link>
        </div>
      </main>
    );
  }

  const bannerImage = restaurant.logoUrl || heroPhoto;
  const openNow = isRestaurantOpenNow(restaurant.openingHoursJson);
  const hoursSummary = formatHoursSummary(restaurant.openingHoursJson);
  const scheduleObject = parseOpeningHours(restaurant.openingHoursJson);
  const isWhitelisted = prefs.whitelistRestaurants.some(
    (r) => Number(r.id) === Number(restaurant.id)
  );
  const isBlacklisted = prefs.blacklistRestaurants.some(
    (r) => Number(r.id) === Number(restaurant.id)
  );

  return (
    <main className="restaurant-page">
      <div className="restaurant-page__topbar">
        <Link className="restaurant-page__back" to="/restaurants">
          ← До ресторанів
        </Link>
      </div>

      <section
        className={`restaurant-hero${bannerImage ? ' restaurant-hero--has-image' : ''}`}
        style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined}
      >
        <div className="restaurant-hero__overlay">
          <div className="restaurant-hero__inner">
            <span className="restaurant-hero__eyebrow">
              {restaurant.city || 'Авторська кухня'}
            </span>
            <h1>{restaurant.name}</h1>
            {restaurant.description?.trim() && (
              <p className="restaurant-hero__description">
                {restaurant.description}
              </p>
            )}

            <div className="restaurant-hero__meta">
              {restaurant.city && <span>◎ {restaurant.city}</span>}
              <span>{openNow === false ? 'Зачинено' : 'Відкрито'}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="restaurant-page__container">
        <section className="restaurant-summary" aria-label="Основна інформація">
          <div className="restaurant-summary__grid">
            <div className="restaurant-summary__item">
              <span>Години роботи</span>
              <strong>{hoursSummary}</strong>
            </div>

            {estimatedCheck != null && (
              <div className="restaurant-summary__item">
                <span>Середній чек</span>
                <strong>≈ {estimatedCheck} ₴ / особу</strong>
              </div>
            )}

            {restaurant.address && (
              <div className="restaurant-summary__item">
                <span>Адреса</span>
                <strong>
                  {restaurant.city ? `${restaurant.city}, ` : ''}
                  {restaurant.address}
                </strong>
              </div>
            )}
          </div>

          <div className="restaurant-summary__actions">
            <button
              type="button"
              className={
                isWhitelisted
                  ? 'restaurant-pref-btn restaurant-pref-btn--active'
                  : 'restaurant-pref-btn'
              }
              onClick={() => setPrefs(toggleWhitelistRestaurant(restaurant))}
            >
              {isWhitelisted ? '♥ У білому списку' : '♡ До білого списку'}
            </button>

            <button
              type="button"
              className={
                isBlacklisted
                  ? 'restaurant-pref-btn restaurant-pref-btn--danger restaurant-pref-btn--danger-active'
                  : 'restaurant-pref-btn restaurant-pref-btn--danger'
              }
              onClick={() => setPrefs(toggleBlacklistRestaurant(restaurant))}
            >
              {isBlacklisted ? 'Приховано' : 'Не показувати'}
            </button>
          </div>
        </section>

        <nav className="restaurant-tabs" role="tablist" aria-label="Розділи закладу">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            const suffix =
              tab.id === 'reviews' && reviewsCount !== null && reviewsCount > 0
                ? ` (${reviewsCount})`
                : '';
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={
                  isSelected
                    ? 'restaurant-tabs__btn restaurant-tabs__btn--active'
                    : 'restaurant-tabs__btn'
                }
                onClick={() => setParam('tab', tab.id === 'menu' ? '' : tab.id)}
              >
                {tab.label}{suffix}
              </button>
            );
          })}
        </nav>

        {activeTab === 'menu' && (
          <section className="restaurant-section" aria-label="Меню ресторану">
            <div className="restaurant-section__head">
              <div>
                <span className="sm-eyebrow">Меню ресторану</span>
                <h2>
                  {menuLoading
                    ? `Меню ${restaurant.name}`
                    : `${visibleDishes.length} страв від ${restaurant.name}`}
                </h2>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  className="restaurant-filter-reset"
                  onClick={clearFilters}
                >
                  Скинути фільтри ×
                </button>
              )}
            </div>

            <div className="restaurant-menu-controls">
              <div className="restaurant-menu-search">
                <span aria-hidden="true">⌕</span>
                <input
                  id="menu-search"
                  type="search"
                  maxLength={200}
                  aria-label="Пошук у меню цього ресторану"
                  placeholder="Пошук у меню цього ресторану"
                  value={query}
                  onChange={(event) => setParam('query', event.target.value)}
                />
              </div>

              {options.ingredients.length > 0 && (
                <details className="restaurant-ingredients">
                  <summary>
                    Інгредієнти
                    {ingredientIds.length > 0 && (
                      <span className="restaurant-ingredients__badge">
                        {ingredientIds.length}
                      </span>
                    )}
                  </summary>

                  <div className="restaurant-ingredients__panel">
                    <p>Страва має містити всі вибрані інгредієнти.</p>
                    <div className="restaurant-ingredients__list">
                      {options.ingredients.map((ingredient) => (
                        <label key={ingredient.id}>
                          <input
                            type="checkbox"
                            checked={ingredientIds.includes(ingredient.id)}
                            onChange={() => toggleIngredient(ingredient.id)}
                          />
                          <span>{ingredient.name}</span>
                        </label>
                      ))}
                    </div>
                    {ingredientIds.length > 0 && (
                      <button
                        type="button"
                        className="restaurant-ingredients__clear"
                        onClick={() => {
                          setSearchParams((current) => {
                            const next = new URLSearchParams(current);
                            next.delete('ingredientIds');
                            return next;
                          }, { replace: true });
                        }}
                      >
                        Очистити інгредієнти
                      </button>
                    )}
                  </div>
                </details>
              )}

              <label className="restaurant-available-pill">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) =>
                    setParam('availableOnly', event.target.checked ? 'true' : '')
                  }
                />
                <span>Доступні зараз</span>
              </label>
            </div>

            {options.categories.length > 0 && (
              <div className="restaurant-category-pills" role="group" aria-label="Категорії меню">
                <button
                  type="button"
                  className={
                    selectedCategoryId === null
                      ? 'restaurant-pill restaurant-pill--active'
                      : 'restaurant-pill'
                  }
                  onClick={() => setParam('categoryId', '')}
                >
                  Усі
                </button>
                {options.categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={
                      selectedCategoryId === category.id
                        ? 'restaurant-pill restaurant-pill--active'
                        : 'restaurant-pill'
                    }
                    onClick={() =>
                      setParam(
                        'categoryId',
                        selectedCategoryId === category.id ? '' : category.id
                      )
                    }
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            <div aria-busy={menuLoading}>
              {menuLoading ? (
                <div className="restaurant-page__state" role="status">
                  Оновлюємо меню…
                </div>
              ) : menuError ? (
                <div className="restaurant-page__state restaurant-page__state--error" role="alert">
                  <p>{menuError}</p>
                  <button
                    type="button"
                    className="restaurant-page__retry"
                    onClick={() => setReloadKey((current) => current + 1)}
                  >
                    Спробувати ще раз
                  </button>
                </div>
              ) : visibleDishes.length > 0 ? (
                <ul className="restaurant-dishes-grid">
                  {visibleDishes.map((dish) => (
                    <li key={dish.id}>
                      <MenuDish dish={dish} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="restaurant-page__state" role="status">
                  <h3 className="sm-serif">
                    {hasFilters
                      ? 'За цими умовами страв немає'
                      : 'Меню ще наповнюється'}
                  </h3>
                  <p>
                    {hasFilters
                      ? 'Спробуйте іншу назву, категорію або скиньте частину фільтрів.'
                      : 'Страви з’являться тут після додавання адміністратором закладу.'}
                  </p>
                  {hasFilters && (
                    <button
                      type="button"
                      className="restaurant-page__retry"
                      onClick={clearFilters}
                    >
                      Скинути фільтри
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'reviews' && (
          <section className="restaurant-section">
            <RestaurantReviews
              restaurantId={restaurantId}
              session={session}
              onCountChange={setReviewsCount}
              onOpenAuth={onOpenAuth}
            />
          </section>
        )}

        {activeTab === 'info' && (
          <section className="restaurant-section" aria-label="Детальна інформація про заклад">
            <div className="restaurant-section__head">
              <div>
                <span className="sm-eyebrow">Про заклад</span>
                <h2>Інформація</h2>
              </div>
            </div>

            <div className="restaurant-info-grid">
              <div className="restaurant-info-card">
                <span className="restaurant-info-card__label">Адреса</span>
                <p>
                  {restaurant.city ? `${restaurant.city}, ` : ''}
                  {restaurant.address || 'Не вказано'}
                </p>
              </div>

              <div className="restaurant-info-card">
                <span className="restaurant-info-card__label">Години роботи</span>
                {scheduleObject ? (
                  <dl className="restaurant-schedule-list">
                    {Object.entries(scheduleObject).map(([day, hours]) => (
                      <div key={day}>
                        <dt>{day}</dt>
                        <dd>{String(hours)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p>{hoursSummary}</p>
                )}
              </div>

              <div className="restaurant-info-card">
                <span className="restaurant-info-card__label">Телефон</span>
                {restaurant.phoneNumber ? (
                  <p>
                    <a href={`tel:${restaurant.phoneNumber}`}>{restaurant.phoneNumber}</a>
                  </p>
                ) : (
                  <p>Не вказано</p>
                )}
              </div>

              <div className="restaurant-info-card">
                <span className="restaurant-info-card__label">Кухня</span>
                <p>{restaurant.cuisine || 'Авторська кухня'}</p>
              </div>

              <div className="restaurant-info-card">
                <span className="restaurant-info-card__label">Приблизно на одну особу</span>
                <p>{estimatedCheck != null ? `≈ ${estimatedCheck} ₴` : 'Не вказано'}</p>
              </div>

              <div className="restaurant-info-card">
                <span className="restaurant-info-card__label">Статус</span>
                <p>
                  {openNow === false ? 'Зараз зачинено' : 'Відкрито зараз'}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default Restaurant;
