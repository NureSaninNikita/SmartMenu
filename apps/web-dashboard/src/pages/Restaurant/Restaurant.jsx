import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import MenuDish from '../../components/MenuDish/MenuDish';
import restaurantsService from '../../services/restaurantsService';
import searchService from '../../services/searchService';
import { apiErrorMessage } from '../../services/apiError';
import './Restaurant.css';

function Restaurant() {
  const { restaurantId } = useParams();

  return <RestaurantContent key={restaurantId} restaurantId={restaurantId} />;
}

function RestaurantContent({ restaurantId }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('query') || '';

  const ingredientIds = [...new Set(
    searchParams
      .getAll('ingredientIds')
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
  )].sort((a, b) => a - b);

  const ingredientKey = ingredientIds.join(',');

  const [restaurant, setRestaurant] = useState(null);
  const [options, setOptions] = useState({
    categories: [],
    ingredients: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [debouncedQuery, setDebouncedQuery] = useState(() => query.trim());

  const [dishes, setDishes] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);

  const sectionRefs = useRef(new Map());
  const categoriesRef = useRef(null);
  const scrollRestored = useRef(false);

  const scrollStorageKey = `smartmenu:menu-scroll:${JSON.stringify([
    restaurantId,
    query.trim(),
    ingredientKey,
  ])}`;

  const groups = options.categories
    .map((category) => ({
      ...category,
      dishes: dishes.filter((dish) => dish.categoryId === category.id),
    }))
    .filter((category) => category.dishes.length > 0);

  const hasFilters = Boolean(query.trim() || ingredientIds.length);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadRestaurant() {
      try {
        const restaurantData =
          await restaurantsService.getRestaurantById(restaurantId);

        if (!isActive || !restaurantData) return;

        const filterOptions = await searchService.getFilters(
          restaurantId,
          { signal: controller.signal }
        );

        if (isActive) {
          setRestaurant(restaurantData);
          setOptions(filterOptions);
        }
      } catch (failure) {
        if (isActive) {
          setError(
            apiErrorMessage(failure, 'Не вдалося завантажити заклад.')
          );
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
      await Promise.resolve();

      if (!isActive) return;

      setMenuLoading(true);
      setMenuError('');

      try {
        const result = await searchService.getMenu(
          restaurantId,
          {
            query: debouncedQuery,
            ingredientIds: ingredientKey
              ? ingredientKey.split(',').map(Number)
              : [],
          },
          { signal: controller.signal }
        );

        if (isActive) {
          setDishes(result);
        }
      } catch (failure) {
        if (isActive) {
          setMenuError(
            apiErrorMessage(failure, 'Не вдалося завантажити меню.')
          );
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
    ingredientKey,
    reloadKey,
  ]);

  useLayoutEffect(() => {
    if (isLoading || menuLoading || !restaurant || menuError) return;
    if (scrollRestored.current) return;

    scrollRestored.current = true;

    try {
      const savedPosition = sessionStorage.getItem(scrollStorageKey);

      if (savedPosition !== null) {
        const top = Number(savedPosition);

        if (Number.isFinite(top) && top >= 0) {
          window.scrollTo({
            top,
            left: 0,
            behavior: 'instant',
          });
        }
      }
    } catch {
      // Відсутність доступу до сховища не блокує меню.
    }
  }, [
    isLoading,
    menuLoading,
    restaurant,
    menuError,
    scrollStorageKey,
  ]);

  useEffect(() => {
    function savePosition() {
      if (!scrollRestored.current || menuLoading) return;
      if (query.trim() !== debouncedQuery) return;

      try {
        sessionStorage.setItem(
          scrollStorageKey,
          String(window.scrollY)
        );
      } catch {
        // Збереження позиції не повинно заважати навігації.
      }
    }

    window.addEventListener('scroll', savePosition, { passive: true });
    window.addEventListener('pagehide', savePosition);

    // Зберігаємо також перед переходом за посиланням.
    document.addEventListener('click', savePosition, true);

    return () => {
      window.removeEventListener('scroll', savePosition);
      window.removeEventListener('pagehide', savePosition);
      document.removeEventListener('click', savePosition, true);
    };
  }, [
    scrollStorageKey,
    menuLoading,
    query,
    debouncedQuery,
  ]);

  useEffect(() => {
    if (menuLoading || menuError) return;

    let frameId;

    function updateActiveCategory() {
      const sections = [...sectionRefs.current.entries()]
        .filter(([, element]) => element)
        .sort(
          (a, b) =>
            a[1].getBoundingClientRect().top -
            b[1].getBoundingClientRect().top
        );

      if (!sections.length) {
        setActiveCategory(null);
        return;
      }

      const page = document.querySelector('.restaurant-menu-page');
      const stickyTop = page
        ? Number.parseFloat(
          window.getComputedStyle(page).getPropertyValue('--menu-sticky-top')
        )
        : 90;

      const offset = (Number.isFinite(stickyTop) ? stickyTop : 90) + 24;
      let currentId = sections[0][0];

      for (const [id, element] of sections) {
        if (element.getBoundingClientRect().top <= offset) {
          currentId = id;
        }
      }

      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 4;

      if (atBottom) {
        currentId = sections[sections.length - 1][0];
      }

      setActiveCategory(currentId);
    }

    function scheduleUpdate() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateActiveCategory);
    }

    scheduleUpdate();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [dishes, menuLoading, menuError]);

  useEffect(() => {
    const navigation = categoriesRef.current;
    const activeLink = navigation?.querySelector(
      '[aria-current="location"]'
    );

    if (!activeLink) return;

    const sidebar = navigation.closest('.restaurant-menu__sidebar');
    const list = navigation.querySelector('ul');

    if (!sidebar || !list) return;

    const isMobile = window.innerWidth <= 760;
    const container = isMobile ? list : sidebar;

    const containerRect = container.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const padding = 12;

    if (isMobile) {
      if (linkRect.left < containerRect.left + padding) {
        container.scrollLeft +=
          linkRect.left - containerRect.left - padding;
      } else if (linkRect.right > containerRect.right - padding) {
        container.scrollLeft +=
          linkRect.right - containerRect.right + padding;
      }
    } else {
      if (linkRect.top < containerRect.top + padding) {
        container.scrollTop +=
          linkRect.top - containerRect.top - padding;
      } else if (linkRect.bottom > containerRect.bottom - padding) {
        container.scrollTop +=
          linkRect.bottom - containerRect.bottom + padding;
      }
    }
  }, [activeCategory, menuLoading]);

  function updateQuery(value) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (value) {
        next.set('query', value);
      } else {
        next.delete('query');
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

      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }

      next.delete('ingredientIds');

      for (const ingredientId of [...selected].sort((a, b) => a - b)) {
        next.append('ingredientIds', String(ingredientId));
      }

      return next;
    }, { replace: true });
  }

  function clearIngredients() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('ingredientIds');
      return next;
    }, { replace: true });
  }

  function clearFilters() {
    setDebouncedQuery('');

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('query');
      next.delete('ingredientIds');
      return next;
    }, { replace: true });
  }

  function goToCategory(event, categoryId) {
    event.preventDefault();

    const section = sectionRefs.current.get(categoryId);

    if (!section) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    section.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    setActiveCategory(categoryId);
  }

  if (isLoading) {
    return (
      <main className="restaurant-menu-page">
        <p className="restaurant-menu__message" role="status">
          Завантажуємо заклад…
        </p>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="restaurant-menu-page">
        <div className="restaurant-menu__message">
          {error ? (
            <p role="alert">{error}</p>
          ) : (
            <h1>Заклад не знайдено</h1>
          )}

          <Link to="/restaurants">До списку закладів</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="restaurant-menu-page">
      <aside className="restaurant-menu__sidebar">
        <header className="restaurant-menu__restaurant">
          <Link className="restaurant-menu__back" to="/restaurants">
            ← Усі заклади
          </Link>

          <p className="restaurant-menu__eyebrow">Меню закладу</p>
          <h1>{restaurant.name}</h1>

          {restaurant.description?.trim() && (
            <p className="restaurant-menu__description">
              {restaurant.description}
            </p>
          )}

          <div className="restaurant-menu__contacts">
            {restaurant.city && (
              <Link
                to={{
                  pathname: '/restaurants',
                  search: `?${new URLSearchParams({
                    city: restaurant.city,
                  })}`,
                }}
              >
                {restaurant.city}
              </Link>
            )}

            {restaurant.address && <p>{restaurant.address}</p>}

            {restaurant.phoneNumber && (
              <a href={`tel:${restaurant.phoneNumber}`}>
                {restaurant.phoneNumber}
              </a>
            )}

            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`}>
                {restaurant.email}
              </a>
            )}
          </div>
        </header>

        {groups.length > 0 && !menuLoading && !menuError && (
          <nav
            ref={categoriesRef}
            className="restaurant-menu__categories"
            aria-label="Категорії меню"
          >
            <h2>Категорії</h2>

            <ul>
              {groups.map((category) => (
                <li key={category.id}>
                  <a
                    href={`#menu-category-${category.id}`}
                    className={
                      activeCategory === category.id
                        ? 'restaurant-menu__category restaurant-menu__category--active'
                        : 'restaurant-menu__category'
                    }
                    aria-current={
                      activeCategory === category.id
                        ? 'location'
                        : undefined
                    }
                    onClick={(event) => goToCategory(event, category.id)}
                  >
                    <span>{category.name}</span>
                    <span>{category.dishes.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </aside>

      <div className="restaurant-menu__main">
        <div className="restaurant-menu__toolbar">
          <div className="restaurant-menu__search">
            <label htmlFor="menu-search">
              Що хочеться спробувати?
            </label>

            <input
              id="menu-search"
              type="search"
              maxLength={200}
              placeholder="Назва страви"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
            />
          </div>

          {options.ingredients.length > 0 && (
            <details className="restaurant-menu__ingredients">
              <summary>
                Інгредієнти
                {ingredientIds.length > 0 && (
                  <span>{ingredientIds.length}</span>
                )}
              </summary>

              <div className="restaurant-menu__ingredient-panel">
                <p>Страва має містити всі вибрані інгредієнти.</p>

                <div className="restaurant-menu__ingredient-list">
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
                  <button type="button" onClick={clearIngredients}>
                    Очистити інгредієнти
                  </button>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="restaurant-menu__results-heading">
          <h2>Меню</h2>

          {hasFilters && (
            <button type="button" onClick={clearFilters}>
              Скинути фільтри ×
            </button>
          )}

          {!menuLoading && !menuError && (
            <span role="status">Страв: {dishes.length}</span>
          )}
        </div>

        <div aria-busy={menuLoading}>
          {menuLoading ? (
            <p className="restaurant-menu__message" role="status">
              Оновлюємо меню…
            </p>
          ) : menuError ? (
            <div className="restaurant-menu__message" role="alert">
              <p>{menuError}</p>

              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                Спробувати ще раз
              </button>
            </div>
          ) : groups.length > 0 ? (
            groups.map((category) => (
              <section
                className="restaurant-menu__section"
                id={`menu-category-${category.id}`}
                key={category.id}
                aria-labelledby={`menu-category-title-${category.id}`}
                ref={(element) => {
                  if (element) {
                    sectionRefs.current.set(category.id, element);
                  } else {
                    sectionRefs.current.delete(category.id);
                  }
                }}
              >
                <h2 id={`menu-category-title-${category.id}`}>
                  {category.name}
                </h2>

                <ul>
                  {category.dishes.map((dish) => (
                    <li key={dish.id}>
                      <MenuDish dish={dish} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <div className="restaurant-menu__message" role="status">
              <h3>
                {hasFilters
                  ? 'За цими умовами страв немає'
                  : 'Меню ще наповнюється'}
              </h3>

              <p>
                {hasFilters
                  ? 'Спробуй іншу назву або прибери частину інгредієнтів.'
                  : 'Страви з’являться тут після додавання закладом.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default Restaurant;