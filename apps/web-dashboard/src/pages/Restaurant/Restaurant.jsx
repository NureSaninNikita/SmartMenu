import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import restaurantsService from '../../services/restaurantsService';

function Restaurant() {
  const { restaurantId } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadRestaurant() {
      setIsLoading(true);
      setError('');
      setRestaurant(null);

      try {
        const restaurantData = await restaurantsService.getRestaurantById(restaurantId);

        if (isActive) {
          setRestaurant(restaurantData);
        }
      } catch {
        if (isActive) {
          setError('Не вдалося завантажити заклад.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadRestaurant();

    return () => {
      isActive = false;
    };
  }, [restaurantId]);

  return (
    <main className="page-stub">
      {isLoading ? (
        <p role="status">Завантажуємо заклад…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !restaurant ? (
        <h1>Заклад не знайдено</h1>
      ) : (
        <>
          <h1>{restaurant.name}</h1>
          <h2>Дані закладу</h2>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {JSON.stringify(restaurant, null, 2)}
          </pre>
        </>
      )}

      <nav className="page-stub__links" aria-label="Переходи зі сторінки закладу">
        <Link to="/restaurants">Усі заклади</Link>
        <Link to="/">На головну</Link>
      </nav>
    </main>
  );
}

export default Restaurant;
