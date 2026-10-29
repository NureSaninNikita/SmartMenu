import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DishCard from '../../components/DishCard/DishCard';
import restaurantsService from '../../services/restaurantsService';
import dishesService from '../../services/dishesService';

function Restaurant() {
  const { restaurantId } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadRestaurant() {
      setIsLoading(true);
      setError('');
      setRestaurant(null);
      setDishes([]);

      try {
        const [restaurantData, dishesData] = await Promise.all([
          restaurantsService.getRestaurantById(restaurantId),
          dishesService.getDishesByRestaurantId(restaurantId),
        ]);

        if (isActive) {
          setRestaurant(restaurantData);
          setDishes(dishesData);
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

          <h2>Страви закладу</h2>

          {dishes.length > 0 ? (
            <div className="page-stub__grid">
              {dishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          ) : (
            <p>У меню поки немає страв.</p>
          )}
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