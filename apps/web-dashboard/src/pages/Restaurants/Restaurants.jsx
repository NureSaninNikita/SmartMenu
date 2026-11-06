import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RestaurantCard from '../../components/RestaurantCard/RestaurantCard';
import restaurantsService from '../../services/restaurantsService';
import './Restaurants.css';

function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();

  const city = searchParams.get('city')?.trim() || '';
  const search = searchParams.get('query') || '';

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const normalizedSearch = search.trim().toLocaleLowerCase('uk-UA');

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLocaleLowerCase('uk-UA').includes(normalizedSearch)
  );

  const allCitiesParams = new URLSearchParams(searchParams);
  allCitiesParams.delete('city');

  const allCitiesSearch = allCitiesParams.toString();

  function updateSearch(value) {
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        if (value) {
          nextParams.set('query', value);
        } else {
          nextParams.delete('query');
        }

        return nextParams;
      },
      { replace: true }
    );
  }

  useEffect(() => {
    let isActive = true;

    async function loadRestaurants() {
      setIsLoading(true);
      setError('');

      try {
        const result = await restaurantsService.getRestaurants(city);

        if (isActive) {
          setRestaurants(result);
        }
      } catch {
        if (isActive) {
          setError('Не вдалося завантажити заклади.');
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
    };
  }, [city, reloadKey]);

  return (
    <main className="restaurants-page">
      <header className="restaurants-page__header">
        <p className="restaurants-page__eyebrow">
          Нові місця — нові смаки
        </p>

        <h1>Тут може бути смачно тобі</h1>

        <p className="restaurants-page__intro">
          Знайомся із закладами, переглядай меню та обирай,
          що хочеться спробувати.
        </p>
      </header>

      <div className="restaurants-page__search">
        <label htmlFor="restaurant-search">Назва закладу</label>

        <input
          id="restaurant-search"
          type="search"
          placeholder="Який заклад тебе цікавить?"
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
        />
      </div>

      {city && (
        <div className="restaurants-page__filter">
          <span>Місто: {city}</span>

          <Link
            to={{
              pathname: '/restaurants',
              search: allCitiesSearch ? `?${allCitiesSearch}` : '',
            }}
          >
            Показати всі міста ×
          </Link>
        </div>
      )}

      {isLoading ? (
        <p className="restaurants-page__message" role="status">
          Завантажуємо заклади…
        </p>
      ) : error ? (
        <div className="restaurants-page__message" role="alert">
          <p>{error}</p>

          <button
            className="restaurants-page__clear"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Спробувати ще раз
          </button>
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <section aria-labelledby="restaurants-list-title">
          <div className="restaurants-page__list-heading">
            <h2 id="restaurants-list-title">
              {city ? `Заклади · ${city}` : 'Заклади'}
            </h2>

            <span role="status">
              Знайдено: {filteredRestaurants.length}
            </span>
          </div>

          <ul className="restaurants-page__grid">
            {filteredRestaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <RestaurantCard restaurant={restaurant} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="restaurants-page__message" role="status">
          <h2>
            {normalizedSearch
              ? 'За цією назвою нічого не знайшли'
              : city
                ? 'У цьому місті закладів поки немає'
                : 'Заклади ще попереду'}
          </h2>

          <p>
            {normalizedSearch
              ? 'Спробуй іншу назву або очисть пошук.'
              : city
                ? 'Переглянь заклади в інших містах.'
                : 'Щойно вони з’являться, тут можна буде переглянути їхні меню.'}
          </p>

          {normalizedSearch && (
            <button
              className="restaurants-page__clear"
              type="button"
              onClick={() => updateSearch('')}
            >
              Очистити пошук
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default Restaurants;