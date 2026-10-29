import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import restaurantsService from '../../services/restaurantsService';

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadRestaurants() {
      try {
        const result = await restaurantsService.getRestaurants();

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
  }, []);

  return (
    <main className="page-stub">
      <h1>Заклади</h1>

      {isLoading ? (
        <p role="status">Завантажуємо заклади…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : restaurants.length > 0 ? (
        <ul>
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <Link to={`/restaurants/${restaurant.id}`}>
                {restaurant.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Закладів поки немає.</p>
      )}

      <nav className="page-stub__links" aria-label="Переходи зі списку закладів">
        <Link to="/">На головну</Link>
      </nav>
    </main>
  );
}

export default Restaurants;