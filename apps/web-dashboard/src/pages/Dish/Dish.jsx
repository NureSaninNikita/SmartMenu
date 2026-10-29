import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dishesService from '../../services/dishesService';

function Dish() {
  const { restaurantId, dishId } = useParams();

  const [dish, setDish] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadDish() {
      setIsLoading(true);
      setError('');
      setDish(null);

      try {
        const result = await dishesService.getDishById(restaurantId, dishId);

        if (isActive) {
          setDish(result);
        }
      } catch {
        if (isActive) {
          setError('Не вдалося завантажити страву.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDish();

    return () => {
      isActive = false;
    };
  }, [restaurantId, dishId]);

  return (
    <main className="page-stub">
      {isLoading ? (
        <p role="status">Завантажуємо страву…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : dish ? (
        <>
          <h1>{dish.title}</h1>
          <p>Заклад: {dish.restaurantName}</p>
        </>
      ) : (
        <h1>Страву не знайдено</h1>
      )}

      <nav className="page-stub__links" aria-label="Переходи зі сторінки страви">
        <Link to={`/restaurants/${restaurantId}`}>До закладу</Link>
        <Link to="/restaurants">Усі заклади</Link>
        <Link to="/">На головну</Link>
      </nav>
    </main>
  );
}

export default Dish;