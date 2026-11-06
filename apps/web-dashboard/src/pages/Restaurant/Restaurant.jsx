import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import restaurantsService from '../../services/restaurantsService';
import searchService from '../../services/searchService';
import { apiErrorMessage } from '../../services/apiError';

const emptyFilters = { query: '', categoryId: '', ingredientIds: [] };

function Restaurant() {
  const { restaurantId } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [options, setOptions] = useState({ categories: [], ingredients: [] });
  const [form, setForm] = useState(emptyFilters);
  const [applied, setApplied] = useState({ ...emptyFilters, page: 1 });
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadRestaurant() {
      setIsLoading(true);
      setError('');
      setRestaurant(null);

      try {
        const [restaurantData, filterOptions] = await Promise.all([
          restaurantsService.getRestaurantById(restaurantId),
          searchService.getFilters(restaurantId),
        ]);

        if (isActive) {
          setRestaurant(restaurantData);
          setOptions(filterOptions);
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

  useEffect(() => {
    let isActive = true;

    async function loadResults() {
      try {
        const page = await searchService.searchDishes(restaurantId, applied);
        if (isActive) {
          setResults(page);
          setSearchError('');
        }
      } catch (failure) {
        if (isActive) {
          setResults(null);
          setSearchError(apiErrorMessage(failure, 'Не вдалося знайти страви.'));
        }
      } finally {
        if (isActive) setSearchLoading(false);
      }
    }

    loadResults();
    return () => { isActive = false; };
  }, [restaurantId, applied]);

  function toggleIngredient(id) {
    setForm((current) => ({
      ...current,
      ingredientIds: current.ingredientIds.includes(id)
        ? current.ingredientIds.filter((value) => value !== id)
        : [...current.ingredientIds, id],
    }));
  }

  function submitSearch(event) {
    event.preventDefault();
    setSearchLoading(true);
    setApplied({ ...form, page: 1 });
  }

  function resetSearch() {
    setForm(emptyFilters);
    setSearchLoading(true);
    setApplied({ ...emptyFilters, page: 1 });
  }

  function movePage(page) {
    setSearchLoading(true);
    setApplied((current) => ({ ...current, page }));
  }

  return (
    <main className="page-stub page-stub--functional">
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
          <h2>Пошук страв</h2>
          <form className="test-form" onSubmit={submitSearch}>
            <label>Назва <input value={form.query} onChange={(event) => setForm({ ...form, query: event.target.value })} /></label>
            <label>Категорія
              <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">Усі категорії</option>
                {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <fieldset>
              <legend>Інгредієнти — страва має містити всі вибрані</legend>
              {options.ingredients.map((ingredient) => (
                <label key={ingredient.id}>
                  <input type="checkbox" checked={form.ingredientIds.includes(ingredient.id)} onChange={() => toggleIngredient(ingredient.id)} />
                  {' '}{ingredient.name}
                </label>
              ))}
            </fieldset>
            <div>
              <button type="submit">Знайти</button>{' '}
              <button type="button" onClick={resetSearch}>Скинути</button>
            </div>
          </form>
          {searchLoading ? <p role="status">Шукаємо страви…</p> : searchError ? (
            <p role="alert">{searchError}</p>
          ) : results?.items.length ? (
            <>
              <p>Знайдено: {results.total}</p>
              <ul>
                {results.items.map((dish) => (
                  <li key={dish.id}>
                    <Link to={`/restaurants/${restaurantId}/dishes/${dish.id}`}>{dish.title}</Link>
                    {' — '}{dish.price} грн, {dish.category}, {dish.status === 'Unavailable' ? 'тимчасово недоступна' : 'доступна'}
                  </li>
                ))}
              </ul>
              <div>
                <button type="button" disabled={results.page <= 1} onClick={() => movePage(results.page - 1)}>Назад</button>
                {' '}Сторінка {results.page}{' '}
                <button type="button" disabled={results.page * results.pageSize >= results.total} onClick={() => movePage(results.page + 1)}>Далі</button>
              </div>
            </>
          ) : <p>Страв за цими умовами немає.</p>}
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
