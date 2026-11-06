import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { apiErrorMessage } from '../../services/apiError';

function RestaurantEditor({ restaurant, pending, onSave }) {
  const [values, setValues] = useState({
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city || '',
    status: restaurant.status,
  });

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave(restaurant.id, { ...restaurant, ...values });
  }

  return (
    <form className="test-form" onSubmit={submit}>
      <label>Назва <input name="name" required value={values.name} onChange={update} /></label>
      <label>Адреса <input name="address" required value={values.address} onChange={update} /></label>
      <label>Місто <input name="city" value={values.city} onChange={update} /></label>
      <label>Статус
        <select name="status" value={values.status} onChange={update}>
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </label>
      <button type="submit" disabled={pending}>Зберегти заклад</button>
    </form>
  );
}

function SystemAdmin({ currentUserId }) {
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accounts, setAccounts] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [assignment, setAssignment] = useState({ userId: '', restaurantId: '' });
  const [newRestaurant, setNewRestaurant] = useState({ name: '', address: '', city: '' });

  useEffect(() => {
    let active = true;
    Promise.all([adminService.getUsers(page), adminService.getRestaurants()])
      .then(([users, places]) => {
        if (active) {
          setAccounts(users);
          setRestaurants(places);
          setError('');
        }
      })
      .catch((failure) => {
        if (active) setError(apiErrorMessage(failure, 'Не вдалося завантажити дані адміністратора.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, refreshKey]);

  async function perform(operation, success) {
    setPending(true);
    setError('');
    setMessage('');
    try {
      await operation();
      setMessage(success);
      setRefreshKey((value) => value + 1);
      return true;
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося виконати дію.'));
      return false;
    } finally {
      setPending(false);
    }
  }

  async function createRestaurant(event) {
    event.preventDefault();
    const created = await perform(
      () => adminService.createRestaurant(newRestaurant),
      'Заклад створено зі статусом Pending.',
    );
    if (created) setNewRestaurant({ name: '', address: '', city: '' });
  }

  async function assignRestaurant(event) {
    event.preventDefault();
    const assigned = await perform(
      () => adminService.assignRestaurant(assignment.userId, assignment.restaurantId),
      'Адміністратора призначено.',
    );
    if (assigned) setAssignment({ userId: '', restaurantId: '' });
  }

  function deactivateRestaurant(id) {
    if (window.confirm('Деактивувати заклад?')) {
      perform(() => adminService.deactivateRestaurant(id), 'Заклад деактивовано.');
    }
  }

  return (
    <main className="page-stub page-stub--functional">
      <h1>Системне адміністрування</h1>
      <p><Link to="/profile">До кабінету</Link></p>
      {loading && <p role="status">Завантажуємо дані…</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <h2>Акаунти</h2>
      {accounts && (
        <>
          <p>Усього: {accounts.total}</p>
          <ul>
            {accounts.items.map((account) => (
              <li key={account.id}>
                #{account.id} {account.firstName} {account.lastName} ({account.email || 'без email'}) — {account.role}, {account.isActive ? 'активний' : 'заблокований'}
                {' '}<button type="button" disabled={pending || account.id === currentUserId} onClick={() => perform(
                  () => adminService.setUserActive(account.id, !account.isActive),
                  account.isActive ? 'Акаунт заблоковано.' : 'Акаунт активовано.',
                )}>{account.isActive ? 'Заблокувати' : 'Активувати'}</button>
                {account.restaurantIds.map((restaurantId) => (
                  <span key={restaurantId}>
                    {' '}Заклад #{restaurantId}{' '}
                    <button type="button" disabled={pending} onClick={() => perform(
                      () => adminService.removeRestaurant(account.id, restaurantId),
                      'Прив’язку знято.',
                    )}>Зняти прив’язку</button>
                  </span>
                ))}
              </li>
            ))}
          </ul>
          <button type="button" disabled={page <= 1} onClick={() => { setLoading(true); setPage(page - 1); }}>Назад</button>
          {' '}Сторінка {page}{' '}
          <button type="button" disabled={page * accounts.pageSize >= accounts.total} onClick={() => { setLoading(true); setPage(page + 1); }}>Далі</button>
        </>
      )}

      <h3>Призначити адміністратора закладу</h3>
      <form className="test-form" onSubmit={assignRestaurant}>
        <label>Користувач
          <select required value={assignment.userId} onChange={(event) => setAssignment({ ...assignment, userId: event.target.value })}>
            <option value="">Виберіть користувача</option>
            {accounts?.items.filter((account) => account.role !== 'SystemAdmin').map((account) => (
              <option key={account.id} value={account.id}>#{account.id} {account.firstName} {account.lastName}</option>
            ))}
          </select>
        </label>
        <label>Заклад
          <select required value={assignment.restaurantId} onChange={(event) => setAssignment({ ...assignment, restaurantId: event.target.value })}>
            <option value="">Виберіть заклад</option>
            {restaurants.filter((restaurant) => restaurant.status !== 'Inactive').map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>#{restaurant.id} {restaurant.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending}>Призначити</button>
      </form>

      <h2>Заклади</h2>
      <h3>Створити заклад</h3>
      <form className="test-form" onSubmit={createRestaurant}>
        <label>Назва <input required value={newRestaurant.name} onChange={(event) => setNewRestaurant({ ...newRestaurant, name: event.target.value })} /></label>
        <label>Адреса <input required value={newRestaurant.address} onChange={(event) => setNewRestaurant({ ...newRestaurant, address: event.target.value })} /></label>
        <label>Місто <input value={newRestaurant.city} onChange={(event) => setNewRestaurant({ ...newRestaurant, city: event.target.value })} /></label>
        <button type="submit" disabled={pending}>Створити</button>
      </form>
      <ul>
        {restaurants.map((restaurant) => (
          <li key={restaurant.id}>
            <details>
              <summary>#{restaurant.id} {restaurant.name} — {restaurant.status}</summary>
              <RestaurantEditor key={`${restaurant.id}-${refreshKey}`} restaurant={restaurant} pending={pending} onSave={(id, values) => perform(
                () => adminService.updateRestaurant(id, values), 'Заклад оновлено.',
              )} />
              {restaurant.status !== 'Inactive' && (
                <button type="button" disabled={pending} onClick={() => deactivateRestaurant(restaurant.id)}>Деактивувати</button>
              )}
            </details>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default SystemAdmin;
