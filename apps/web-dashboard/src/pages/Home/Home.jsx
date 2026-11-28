import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DishCard from '../../components/DishCard/DishCard';
import RestaurantCard from '../../components/RestaurantCard/RestaurantCard';
import dishesService from '../../services/dishesService';
import restaurantsService from '../../services/restaurantsService';
import searchService from '../../services/searchService';
import './Home.css';

function Home({ session, onOpenAuth }) {
  const navigate = useNavigate();

  const [searchMode, setSearchMode] = useState('dishes');
  const [searchQuery, setSearchQuery] = useState('');

  const [featuredDish, setFeaturedDish] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [catalogDishes, setCatalogDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadHomeData() {
      setIsLoading(true);
      setError('');

      try {
        const [randomResult, restaurantsResult] = await Promise.allSettled([
          dishesService.getRandomDish(),
          restaurantsService.getRestaurants(),
        ]);

        if (!isActive) return;

        const nextDish = randomResult.status === 'fulfilled' ? randomResult.value : null;
        const nextRestaurants = restaurantsResult.status === 'fulfilled' ? restaurantsResult.value : [];

        setFeaturedDish(nextDish);
        setRestaurants(nextRestaurants);

        if (nextRestaurants.length > 0) {
          try {
            const loadedDishes = await searchService.getCatalogDishes(
              nextRestaurants,
              {},
              { signal: controller.signal }
            );
            if (isActive) {
              setCatalogDishes(loadedDishes);
            }
          } catch (catalogFailure) {
            if (isActive && catalogFailure?.code !== 'ERR_CANCELED') {
              setCatalogDishes([]);
            }
          }
        }

        if (randomResult.status === 'rejected' && restaurantsResult.status === 'rejected') {
          setError('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadHomeData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    const params = trimmed ? `?${new URLSearchParams({ query: trimmed })}` : '';
    navigate(searchMode === 'dishes' ? `/dishes${params}` : `/restaurants${params}`);
  }

  const categoryCounts = new Map();
  for (const item of catalogDishes) {
    if (!item.category) continue;
    categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
  }
  const categories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const restaurantPreviewMap = new Map();
  for (const item of catalogDishes) {
    if (item.imageUrl && !restaurantPreviewMap.has(item.restaurantId)) {
      restaurantPreviewMap.set(item.restaurantId, item.imageUrl);
    }
  }

  const popularDishes = catalogDishes.slice(0, 4);
  const featuredRestaurants = restaurants.slice(0, 3).map((restaurant) => ({
    ...restaurant,
    previewImageUrl: restaurantPreviewMap.get(restaurant.id) || null,
  }));

  const userName = session?.user?.firstName?.trim();

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero__content">
          <span className="sm-eyebrow">Обирайте до смаку</span>

          <h1 className="home-hero__title">
            Їжа, яку ви
            <br />
            <span>дійсно</span> хочете
          </h1>

          <p className="home-hero__description">
            Знаходьте найкращі страви та ресторани міста — швидко, зрозуміло й з
            урахуванням ваших уподобань.
          </p>

          <form className="home-search" onSubmit={handleSearchSubmit}>
            <div className="home-search__tabs" role="tablist" aria-label="Тип пошуку">
              <button
                type="button"
                role="tab"
                aria-selected={searchMode === 'dishes'}
                className={`home-search__tab${searchMode === 'dishes' ? ' home-search__tab--active' : ''}`}
                onClick={() => setSearchMode('dishes')}
              >
                Страви
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={searchMode === 'restaurants'}
                className={`home-search__tab${searchMode === 'restaurants' ? ' home-search__tab--active' : ''}`}
                onClick={() => setSearchMode('restaurants')}
              >
                Ресторани
              </button>
            </div>

            <div className="home-search__bar">
              <span className="home-search__icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                className="home-search__input"
                aria-label={searchMode === 'dishes' ? 'Пошук страв' : 'Пошук ресторанів'}
                placeholder={
                  searchMode === 'dishes'
                    ? 'Яку страву ви шукаєте?'
                    : 'Який ресторан ви шукаєте?'
                }
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button type="submit" className="home-search__submit">
                Знайти
              </button>
            </div>
          </form>

          <p className="home-hero__stats">
            {catalogDishes.length > 0 && (
              <>
                <strong>{catalogDishes.length}</strong> страв ·{' '}
              </>
            )}
            {restaurants.length > 0 && (
              <>
                <strong>{restaurants.length}</strong> ресторанів ·{' '}
              </>
            )}
            Лише перевірені місця
          </p>
        </div>

        <div className="home-featured" aria-busy={isLoading}>
          <p className="home-featured__label">Можливо, ваша нова улюблена</p>

          {isLoading ? (
            <div className="home-featured__message" role="status">
              Завантажуємо щось смачне…
            </div>
          ) : error && !featuredDish ? (
            <div className="home-featured__message" role="alert">
              {error}
            </div>
          ) : featuredDish ? (
            <DishCard dish={featuredDish} featured />
          ) : (
            <div className="home-featured__message">
              Незабаром тут з’явиться щось смачне.
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="home-section" aria-labelledby="home-categories-title">
          <div className="home-section__head">
            <div>
              <span className="sm-eyebrow">Почніть з улюбленого</span>
              <h2 id="home-categories-title">Категорії страв</h2>
            </div>
            <Link to="/dishes" className="home-section__link">
              Усі страви →
            </Link>
          </div>

          <div className="home-categories__grid">
            {categories.map((category, index) => (
              <Link
                key={category.name}
                to={{
                  pathname: '/dishes',
                  search: `?${new URLSearchParams({ category: category.name })}`,
                }}
                className="home-category-card"
              >
                <span className="home-category-card__num sm-serif">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <strong className="home-category-card__name">{category.name}</strong>
                <div className="home-category-card__foot">
                  <span className="home-category-card__count">
                    {category.count} варіантів
                  </span>
                  <span className="home-category-card__arrow" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {popularDishes.length > 0 && (
        <div className="home-mint-band">
          <section className="home-section" aria-labelledby="home-popular-title">
            <div className="home-section__head">
              <div>
                <span className="sm-eyebrow">
                  {userName ? `Добірка для вас, ${userName}` : 'Обирають найчастіше'}
                </span>
                <h2 id="home-popular-title">
                  {userName ? 'На основі ваших уподобань' : 'Популярні страви'}
                </h2>
              </div>
              <Link to="/dishes" className="home-section__link">
                Переглянути всі →
              </Link>
            </div>

            <div className="home-dishes__grid">
              {popularDishes.map((item) => (
                <DishCard key={`${item.restaurantId}-${item.id}`} dish={item} />
              ))}
            </div>
          </section>
        </div>
      )}

      {featuredRestaurants.length > 0 && (
        <section className="home-section" aria-labelledby="home-restaurants-title">
          <div className="home-section__head">
            <div>
              <span className="sm-eyebrow">Варто завітати</span>
              <h2 id="home-restaurants-title">Рекомендовані ресторани</h2>
            </div>
            <Link to="/restaurants" className="home-section__link">
              Усі ресторани →
            </Link>
          </div>

          <div className="home-restaurants__grid">
            {featuredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}

      <section className="home-section home-section--banner">
        <div className="home-banner">
          <div className="home-banner__content">
            <span className="home-banner__eyebrow">Smart-добірка</span>
            <h2>Ваш смак — наш орієнтир</h2>
            <p>
              Увійдіть у профіль і відзначте улюблені кухні. Ми створимо
              персональну стрічку страв.
            </p>
          </div>

          {session ? (
            <Link to="/profile" className="home-banner__cta">
              Налаштувати вподобання →
            </Link>
          ) : onOpenAuth ? (
            <button
              type="button"
              className="home-banner__cta"
              onClick={() => onOpenAuth('login')}
            >
              Налаштувати вподобання →
            </button>
          ) : (
            <Link to="/login" className="home-banner__cta">
              Налаштувати вподобання →
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default Home;
