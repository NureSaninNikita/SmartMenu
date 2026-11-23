import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import menuManagementService from '../../services/menuManagementService';
import { apiErrorMessage } from '../../services/apiError';

function MenuCategories({ session }) {
  const restaurantIds = session.user.restaurantIds || [];
  const [restaurantId, setRestaurantId] = useState(restaurantIds[0] || '');
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadCategories = useCallback(async () => {
    if (!restaurantId) return;
    const result = await menuManagementService.getCategories(restaurantId, true);
    setCategories(result);
  }, [restaurantId]);

  useEffect(() => {
    let active = true;
    if (!restaurantId) return undefined;
    menuManagementService.getCategories(restaurantId, true)
      .then((result) => { if (active) setCategories(result); })
      .catch((failure) => {
        if (active) setError(apiErrorMessage(failure, 'Не вдалося завантажити категорії.'));
      });
    return () => { active = false; };
  }, [restaurantId]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
  }

  async function run(action, success) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      await loadCategories();
      setMessage(success);
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося зберегти зміни.'));
    } finally {
      setBusy(false);
    }
  }

  function saveCategory(event) {
    event.preventDefault();
    const values = { name: name.trim(), description: description.trim() || null };
    run(async () => {
      if (editingId) {
        await menuManagementService.updateCategory(restaurantId, editingId, values);
      } else {
        await menuManagementService.createCategory(restaurantId, values);
      }
      resetForm();
    }, 'Категорію збережено.');
  }

  function moveCategory(categoryId, direction) {
    const active = categories.filter((category) => category.isActive);
    const index = active.findIndex((category) => category.id === categoryId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= active.length) return;
    const ids = active.map((category) => category.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => menuManagementService.reorderCategories(restaurantId, ids),
      'Порядок категорій збережено.');
  }

  return (
    <main className="page-stub page-stub--functional">
      <h1>Категорії меню</h1>
      <Link to="/restaurant-admin">До панелі закладу</Link>
      {restaurantIds.length === 0 ? <p>За вами не закріплено жодного закладу.</p> : (
        <>
          <p><label>Заклад{' '}
            <select value={restaurantId} onChange={(event) => {
              setRestaurantId(event.target.value);
              setCategories([]);
              setError('');
              resetForm();
            }}>
              {restaurantIds.map((id) => <option key={id} value={id}>Заклад №{id}</option>)}
            </select>
          </label></p>
          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          <form onSubmit={saveCategory}>
            <h2>{editingId ? 'Редагувати категорію' : 'Додати категорію'}</h2>
            <p><label>Назва{' '}
              <input value={name} onChange={(event) => setName(event.target.value)}
                required maxLength={150} />
            </label></p>
            <p><label>Опис{' '}
              <textarea value={description} onChange={(event) => setDescription(event.target.value)}
                maxLength={2000} />
            </label></p>
            <button type="submit" disabled={busy}>Зберегти</button>{' '}
            {editingId && <button type="button" onClick={resetForm}>Скасувати</button>}
          </form>
          <h2>Список категорій</h2>
          {categories.length === 0 ? <p>Категорій немає.</p> : (
            <ul>
              {categories.map((category) => (
                <li key={category.id}>
                  {category.name} {category.isActive ? '' : '(неактивна)'}{' '}
                  {category.isActive && <>
                    <button type="button" disabled={busy} onClick={() => {
                      setEditingId(category.id);
                      setName(category.name);
                      setDescription(category.description || '');
                    }}>Редагувати</button>{' '}
                    <button type="button" disabled={busy} onClick={() => moveCategory(category.id, -1)}
                      aria-label={`Підняти категорію ${category.name}`}>↑</button>{' '}
                    <button type="button" disabled={busy} onClick={() => moveCategory(category.id, 1)}
                      aria-label={`Опустити категорію ${category.name}`}>↓</button>{' '}
                  </>}
                  <button type="button" disabled={busy} onClick={() => {
                    if (window.confirm(`Видалити категорію «${category.name}»?`)) {
                      run(() => menuManagementService.deleteCategory(restaurantId, category.id),
                        'Категорію видалено.');
                    }
                  }}>Видалити</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

export default MenuCategories;
