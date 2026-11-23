import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dishManagementService from '../../services/dishManagementService';
import { apiErrorMessage } from '../../services/apiError';
import { imageUrl } from '../../services/dishesService';

const emptyForm = {
  categoryId: '', name: '', description: '', price: '', weightGrams: '',
  calories: '', proteins: '', fats: '', carbohydrates: '', ingredientIds: [],
};

const numericFields = [
  ['weightGrams', 'Вага, г'], ['calories', 'Калорійність'],
  ['proteins', 'Білки, г'], ['fats', 'Жири, г'],
  ['carbohydrates', 'Вуглеводи, г'],
];

function RestaurantDishes({ session }) {
  const restaurantIds = session.user.restaurantIds || [];
  const [restaurantId, setRestaurantId] = useState(restaurantIds[0] || '');
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [ingredientName, setIngredientName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPosition, setPhotoPosition] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    const [nextCategories, nextIngredients, nextDishes] = await Promise.all([
      dishManagementService.getCategories(restaurantId),
      dishManagementService.getIngredients(),
      dishManagementService.getDishes(restaurantId),
    ]);
    setCategories(nextCategories);
    setIngredients(nextIngredients);
    setDishes(nextDishes);
  }, [restaurantId]);

  useEffect(() => {
    let active = true;
    if (!restaurantId) return undefined;
    Promise.all([
      dishManagementService.getCategories(restaurantId),
      dishManagementService.getIngredients(),
      dishManagementService.getDishes(restaurantId),
    ]).then(([nextCategories, nextIngredients, nextDishes]) => {
      if (!active) return;
      setCategories(nextCategories);
      setIngredients(nextIngredients);
      setDishes(nextDishes);
    }).catch((failure) => {
      if (active) setError(apiErrorMessage(failure, 'Не вдалося завантажити меню.'));
    });
    return () => { active = false; };
  }, [restaurantId]);

  async function run(action, success) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      await loadData();
      setMessage(success);
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося виконати дію.'));
    } finally {
      setBusy(false);
    }
  }

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEditing(dish) {
    setEditingId(dish.id);
    setForm({
      categoryId: String(dish.categoryId), name: dish.name,
      description: dish.description || '', price: String(dish.price),
      weightGrams: dish.weightGrams ?? '', calories: dish.calories ?? '',
      proteins: dish.proteins ?? '', fats: dish.fats ?? '',
      carbohydrates: dish.carbohydrates ?? '',
      ingredientIds: dish.ingredients.map((ingredient) => ingredient.id),
    });
    setPhotoFile(null);
    setPhotoPosition('1');
  }

  function saveDish(event) {
    event.preventDefault();
    const values = {
      ...form,
      categoryId: Number(form.categoryId),
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      ingredientIds: form.ingredientIds,
    };
    for (const [field] of numericFields) {
      values[field] = form[field] === '' ? null : Number(form[field]);
    }
    run(async () => {
      if (editingId) {
        await dishManagementService.updateDish(restaurantId, editingId, values);
      } else {
        await dishManagementService.createDish(restaurantId, values);
      }
      setEditingId(null);
      setForm(emptyForm);
    }, 'Страву збережено.');
  }

  const selectedDish = dishes.find((dish) => dish.id === editingId);

  return (
    <main className="page-stub page-stub--functional">
      <h1>Керування стравами</h1>
      <p><Link to="/restaurant-admin">До панелі закладу</Link></p>
      {restaurantIds.length === 0 ? <p>За вами не закріплено жодного закладу.</p> : <>
        <p><label>Заклад{' '}
          <select value={restaurantId} onChange={(event) => {
            setRestaurantId(event.target.value);
            setCategories([]);
            setDishes([]);
            setEditingId(null);
            setForm(emptyForm);
            setError('');
          }}>
            {restaurantIds.map((id) => <option key={id} value={id}>Заклад №{id}</option>)}
          </select>
        </label></p>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <h2>Страви</h2>
        {dishes.length === 0 ? <p>Страв немає.</p> : <ul>
          {dishes.map((dish) => <li key={dish.id}>
            {dish.name} — {dish.price} грн — {dish.status}{' '}
            <button type="button" disabled={busy || dish.status === 'Archived'}
              onClick={() => startEditing(dish)}>Редагувати</button>{' '}
            <Link to={`/restaurants/${restaurantId}/dishes/${dish.id}`}>Сторінка страви</Link>
          </li>)}
        </ul>}

        <form onSubmit={saveDish}>
          <h2>{editingId ? `Редагувати страву №${editingId}` : 'Додати страву'}</h2>
          <p><label>Категорія{' '}
            <select required value={form.categoryId}
              onChange={(event) => setField('categoryId', event.target.value)}>
              <option value="">Оберіть категорію</option>
              {categories.map((category) => <option key={category.id} value={category.id}>
                {category.name}
              </option>)}
            </select>
          </label>{' '}<Link to="/restaurant-admin/categories">Керувати категоріями</Link></p>
          <p><label>Назва{' '}
            <input required maxLength={200} value={form.name}
              onChange={(event) => setField('name', event.target.value)} />
          </label></p>
          <p><label>Опис{' '}
            <textarea maxLength={5000} value={form.description}
              onChange={(event) => setField('description', event.target.value)} />
          </label></p>
          <p><label>Ціна, грн{' '}
            <input type="number" required min="0" max="99999999.99" step="0.01"
              value={form.price} onChange={(event) => setField('price', event.target.value)} />
          </label></p>
          {numericFields.map(([field, label]) => <p key={field}><label>{label}{' '}
            <input type="number" min="0" max="999999.99" step="0.01"
              value={form[field]} onChange={(event) => setField(field, event.target.value)} />
          </label></p>)}
          <fieldset>
            <legend>Інгредієнти</legend>
            {ingredients.map((ingredient) => <label key={ingredient.id}>
              <input type="checkbox" checked={form.ingredientIds.includes(ingredient.id)}
                onChange={() => setField('ingredientIds', form.ingredientIds.includes(ingredient.id)
                  ? form.ingredientIds.filter((id) => id !== ingredient.id)
                  : [...form.ingredientIds, ingredient.id])} />
              {ingredient.name}{' '}
            </label>)}
          </fieldset>
          <button type="submit" disabled={busy || categories.length === 0}>Зберегти страву</button>{' '}
          {editingId && <button type="button" onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
          }}>Нова страва</button>}
        </form>

        <form onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            await dishManagementService.createIngredient(ingredientName.trim());
            setIngredientName('');
          }, 'Інгредієнт додано.');
        }}>
          <h2>Додати інгредієнт</h2>
          <input required maxLength={120} value={ingredientName}
            onChange={(event) => setIngredientName(event.target.value)} />{' '}
          <button type="submit" disabled={busy}>Додати</button>
        </form>

        {selectedDish && <section>
          <h2>Фото страви №{selectedDish.id}</h2>
          {selectedDish.photos.length === 0 ? <p>Фото немає.</p> : <ul>
            {selectedDish.photos.map((photo) => <li key={photo.id}>
              Позиція {photo.position}:{' '}
              <a href={imageUrl(photo.imageUrl)} target="_blank" rel="noreferrer">Відкрити фото</a>{' '}
              <button type="button" disabled={busy} onClick={() => run(
                () => dishManagementService.deletePhoto(restaurantId, selectedDish.id, photo.position),
                'Фото видалено.'
              )}>Видалити</button>
            </li>)}
          </ul>}
          <form onSubmit={(event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            if (!photoFile) return;
            run(async () => {
              await dishManagementService.uploadPhoto(
                restaurantId, selectedDish.id, photoPosition, photoFile
              );
              setPhotoFile(null);
              formElement.reset();
            }, 'Фото завантажено.');
          }}>
            <label>Позиція{' '}
              <select value={photoPosition} onChange={(event) => setPhotoPosition(event.target.value)}>
                {[1, 2, 3].map((position) => <option key={position} value={position}>{position}</option>)}
              </select>
            </label>{' '}
            <label>Фото{' '}
              <input type="file" accept="image/jpeg,image/png,image/webp" required
                onChange={(event) => setPhotoFile(event.target.files?.[0] || null)} />
            </label>{' '}
            <button type="submit" disabled={busy || !photoFile}>Завантажити</button>
          </form>
        </section>}
      </>}
    </main>
  );
}

export default RestaurantDishes;
