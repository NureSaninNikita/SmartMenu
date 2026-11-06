import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { apiErrorMessage } from '../../services/apiError';
import RestaurantForm from './RestaurantForm';

const statusLabels = {
  Pending: 'Очікує активації',
  Active: 'Активний',
  Inactive: 'Неактивний',
};

function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [editor, setEditor] = useState(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  const operationInProgress = useRef(false);
  const editorRef = useRef(null);

  const normalizedSearch = search.trim().toLocaleLowerCase('uk-UA');

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesStatus = !status || restaurant.status === status;

    const matchesSearch = [
      restaurant.name,
      restaurant.city,
      restaurant.address,
    ].some((value) =>
      (value || '').toLocaleLowerCase('uk-UA').includes(normalizedSearch)
    );

    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    let active = true;

    async function loadRestaurants() {
      try {
        const result = await adminService.getRestaurants();

        if (active) {
          setRestaurants(result);
          setLoadError('');
        }
      } catch (failure) {
        if (active) {
          setLoadError(
            apiErrorMessage(failure, 'Не вдалося завантажити заклади.')
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRestaurants();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!editor) return;

    const frameId = window.requestAnimationFrame(() => {
      editorRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editor]);

  function openEditor(restaurant = null) {
    setActionError('');
    setMessage('');

    setEditor(
      restaurant
        ? { mode: 'edit', restaurant }
        : { mode: 'create', restaurant: null }
    );
  }

  function closeEditor() {
    if (operationInProgress.current) return;

    setEditor(null);
    setActionError('');
  }

  function reloadRestaurants() {
    setLoading(true);
    setLoadError('');
    setReloadKey((current) => current + 1);
  }

  async function saveRestaurant(values) {
    if (!editor || operationInProgress.current) return;

    operationInProgress.current = true;
    setPending(true);
    setActionError('');
    setMessage('');

    try {
      if (editor.mode === 'edit') {
        const updated = await adminService.updateRestaurant(
          editor.restaurant.id,
          values
        );

        setRestaurants((current) =>
          current.map((restaurant) =>
            restaurant.id === updated.id ? updated : restaurant
          )
        );

        setMessage(`Зміни закладу «${updated.name}» збережено.`);
      } else {
        const created = await adminService.createRestaurant(values);

        setRestaurants((current) => [...current, created]);
        setMessage(`Заклад «${created.name}» створено.`);
      }

      setEditor(null);
    } catch (failure) {
      setActionError(
        apiErrorMessage(failure, 'Не вдалося зберегти заклад.')
      );
    } finally {
      operationInProgress.current = false;
      setPending(false);
    }
  }

  async function deactivateRestaurant(restaurant) {
    if (operationInProgress.current) return;

    const confirmed = window.confirm(
      `Деактивувати заклад «${restaurant.name}»? ` +
      'Він стане недоступним для гостей. ' +
      'Меню, оцінки та відгуки залишаться збереженими.'
    );

    if (!confirmed) return;

    operationInProgress.current = true;
    setPending(true);
    setActionError('');
    setMessage('');

    try {
      await adminService.deactivateRestaurant(restaurant.id);

      setRestaurants((current) =>
        current.map((item) =>
          item.id === restaurant.id
            ? { ...item, status: 'Inactive' }
            : item
        )
      );

      setMessage(`Заклад «${restaurant.name}» деактивовано.`);
    } catch (failure) {
      setActionError(
        apiErrorMessage(failure, 'Не вдалося деактивувати заклад.')
      );
    } finally {
      operationInProgress.current = false;
      setPending(false);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-restaurants-title">
      <header className="admin-section__heading">
        <div>
          <h2 id="admin-restaurants-title">Заклади</h2>
          <p>Додавання, редагування та керування доступністю закладів.</p>
        </div>

        <button
          className="admin-button admin-button--primary"
          type="button"
          disabled={loading || pending || Boolean(editor)}
          onClick={() => openEditor()}
        >
          + Додати заклад
        </button>
      </header>

      {message && (
        <p className="admin-message admin-message--success" role="status">
          {message}
        </p>
      )}

      {editor && (
        <div
          className="admin-section__editor"
          ref={editorRef}
          tabIndex={-1}
        >
          <RestaurantForm
            key={
              editor.mode === 'create'
                ? 'create'
                : `edit-${editor.restaurant.id}`
            }
            restaurant={editor.restaurant}
            pending={pending}
            onSave={saveRestaurant}
            onCancel={closeEditor}
          />
        </div>
      )}

      {actionError && (
        <p className="admin-message admin-message--error" role="alert">
          {actionError}
        </p>
      )}

      <div className="admin-toolbar">
        <div className="admin-form__field">
          <label htmlFor="admin-restaurant-search">Пошук закладу</label>
          <input
            id="admin-restaurant-search"
            type="search"
            placeholder="Назва, місто або адреса"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="admin-form__field">
          <label htmlFor="admin-restaurant-status">Статус</label>
          <select
            id="admin-restaurant-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Усі статуси</option>
            <option value="Pending">Очікує активації</option>
            <option value="Active">Активний</option>
            <option value="Inactive">Неактивний</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="admin-message" role="status">
          Завантажуємо заклади…
        </p>
      ) : loadError ? (
        <div className="admin-message admin-message--error" role="alert">
          <p>{loadError}</p>

          <button
            className="admin-button"
            type="button"
            onClick={reloadRestaurants}
          >
            Спробувати ще раз
          </button>
        </div>
      ) : (
        <>
          <p className="admin-section__count" role="status">
            Показано: {filteredRestaurants.length} із {restaurants.length}
          </p>

          {filteredRestaurants.length > 0 ? (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <caption className="admin-table__caption">
                  Перелік закладів системи
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Заклад</th>
                    <th scope="col">Місто та адреса</th>
                    <th scope="col">Статус</th>
                    <th scope="col">Дії</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRestaurants.map((restaurant) => (
                    <tr key={restaurant.id}>
                      <th scope="row">
                        <span className="admin-table__name">
                          {restaurant.name}
                        </span>
                        <span className="admin-table__secondary">
                          ID: {restaurant.id}
                        </span>
                      </th>

                      <td>
                        <span>{restaurant.city || 'Місто не вказано'}</span>
                        <span className="admin-table__secondary">
                          {restaurant.address}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-status admin-status--${restaurant.status.toLowerCase()}`}
                        >
                          {statusLabels[restaurant.status] || restaurant.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-table__actions">
                          {restaurant.status === 'Active' && (
                            <Link
                              className="admin-button"
                              to={`/restaurants/${restaurant.id}`}
                            >
                              Меню ↗
                            </Link>
                          )}

                          <button
                            className="admin-button"
                            type="button"
                            disabled={pending || Boolean(editor)}
                            onClick={() => openEditor(restaurant)}
                          >
                            Редагувати
                          </button>

                          {restaurant.status !== 'Inactive' && (
                            <button
                              className="admin-button admin-button--danger"
                              type="button"
                              disabled={pending || Boolean(editor)}
                              onClick={() => deactivateRestaurant(restaurant)}
                            >
                              Деактивувати
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-message">
              <p>
                {restaurants.length === 0
                  ? 'Закладів поки немає. Додай перший заклад.'
                  : 'За обраними умовами закладів не знайдено.'}
              </p>

              {(search || status) && (
                <button
                  className="admin-button"
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                  }}
                >
                  Скинути фільтри
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminRestaurants;