import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dishAvailabilityService from '../../services/dishAvailabilityService';
import { apiErrorMessage } from '../../services/apiError';

function DishAvailability({ session }) {
  const restaurantIds = session.user.restaurantIds || [];
  const [restaurantId, setRestaurantId] = useState(restaurantIds[0] || '');
  const [dishes, setDishes] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadDishes = useCallback(async () => {
    if (!restaurantId) return;
    setDishes(await dishAvailabilityService.getDishes(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    let active = true;
    if (!restaurantId) return undefined;
    dishAvailabilityService.getDishes(restaurantId)
      .then((result) => { if (active) setDishes(result); })
      .catch((failure) => {
        if (active) setError(apiErrorMessage(failure, 'Не вдалося завантажити страви.'));
      });
    return () => { active = false; };
  }, [restaurantId]);

  async function changeAvailability(dish) {
    setBusyId(dish.id);
    setError('');
    setMessage('');
    try {
      await dishAvailabilityService.setAvailability(
        restaurantId, dish.id, dish.status !== 'Available'
      );
      await loadDishes();
      setMessage('Доступність страви змінено.');
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося змінити доступність страви.'));
    } finally {
      setBusyId(null);
    }
  }

  return <main className="page-stub page-stub--functional">
    <h1>Стоп-лист страв</h1>
    <p><Link to="/restaurant-admin">До панелі закладу</Link></p>
    {restaurantIds.length === 0 ? <p>За вами не закріплено жодного закладу.</p> : <>
      <p><label>Заклад{' '}
        <select value={restaurantId} onChange={(event) => {
          setRestaurantId(event.target.value);
          setDishes([]);
          setError('');
          setMessage('');
        }}>
          {restaurantIds.map((id) => <option key={id} value={id}>Заклад №{id}</option>)}
        </select>
      </label></p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {dishes.length === 0 ? <p>Страв немає.</p> : <ul>
        {dishes.map((dish) => <li key={dish.id}>
          {dish.name} — {dish.status}{' '}
          {dish.status !== 'Archived' && <button type="button"
            disabled={busyId !== null} onClick={() => changeAvailability(dish)}>
            {dish.status === 'Available' ? 'Додати до стоп-листа' : 'Повернути в меню'}
          </button>}
        </li>)}
      </ul>}
    </>}
  </main>;
}

export default DishAvailability;
