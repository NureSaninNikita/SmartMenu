import { useEffect, useRef, useState } from 'react';
import adminService from '../../services/adminService';
import { apiErrorMessage } from '../../services/apiError';

const roleLabels = {
  RegisteredUser: 'Користувач',
  RestaurantAdmin: 'Адміністратор закладу',
  SystemAdmin: 'Системний адміністратор',
};

function AccountAssignment({ account, restaurants, disabled, onAssign }) {
  const [restaurantId, setRestaurantId] = useState('');

  const availableRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.status !== 'Inactive' &&
      !account.restaurantIds.includes(restaurant.id)
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (!restaurantId || disabled) return;

    const saved = await onAssign(account.id, restaurantId);

    if (saved) setRestaurantId('');
  }

  if (availableRestaurants.length === 0) {
    return (
      <p className="admin-table__secondary">
        Немає закладів для призначення.
      </p>
    );
  }

  return (
    <form className="admin-assignment" onSubmit={handleSubmit}>
      <label className="admin-form__field">
        <span>Призначити заклад</span>

        <select
          required
          disabled={disabled}
          value={restaurantId}
          onChange={(event) => setRestaurantId(event.target.value)}
        >
          <option value="">Обери заклад</option>

          {availableRestaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name} · ID {restaurant.id}
            </option>
          ))}
        </select>
      </label>

      <button
        className="admin-button"
        type="submit"
        disabled={disabled || !restaurantId}
      >
        Призначити
      </button>
    </form>
  );
}

function AdminAccounts({ currentUserId }) {
  const [page, setPage] = useState(1);
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState('');
  const [restaurantsReloadKey, setRestaurantsReloadKey] = useState(0);

  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [assignmentUserId, setAssignmentUserId] = useState(null);

  const operationInProgress = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      try {
        const result = await adminService.getUsers(page);

        if (active) {
          setAccounts(result);
          setLoadError('');
        }
      } catch (failure) {
        if (active) {
          setLoadError(
            apiErrorMessage(failure, 'Не вдалося завантажити акаунти.')
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAccounts();

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  useEffect(() => {
    let active = true;

    async function loadRestaurants() {
      try {
        const result = await adminService.getRestaurants();

        if (active) {
          setRestaurants(result);
          setRestaurantsError('');
        }
      } catch (failure) {
        if (active) {
          setRestaurantsError(
            apiErrorMessage(
              failure,
              'Не вдалося завантажити заклади для призначення.'
            )
          );
        }
      } finally {
        if (active) setRestaurantsLoading(false);
      }
    }

    loadRestaurants();

    return () => {
      active = false;
    };
  }, [restaurantsReloadKey]);

  async function perform(operation, successMessage) {
    if (operationInProgress.current) return false;

    operationInProgress.current = true;
    setPending(true);
    setActionError('');
    setMessage('');

    try {
      const updated = await operation();

      setAccounts((current) =>
        current
          ? {
              ...current,
              items: current.items.map((account) =>
                account.id === updated.id ? updated : account
              ),
            }
          : current
      );

      setMessage(successMessage);
      return true;
    } catch (failure) {
      setActionError(
        apiErrorMessage(failure, 'Не вдалося виконати дію.')
      );
      return false;
    } finally {
      operationInProgress.current = false;
      setPending(false);
    }
  }

  function changeActivity(account) {
    if (operationInProgress.current) return;

    const name =
      `${account.firstName} ${account.lastName}`.trim() ||
      account.email ||
      `ID ${account.id}`;

    const confirmed = window.confirm(
      account.isActive
        ? `Заблокувати акаунт «${name}»? Користувач втратить доступ до захищених дій.`
        : `Активувати акаунт «${name}»?`
    );

    if (!confirmed) return;

    perform(
      () => adminService.setUserActive(account.id, !account.isActive),
      account.isActive ? 'Акаунт заблоковано.' : 'Акаунт активовано.'
    );
  }

  async function assignRestaurant(userId, restaurantId) {
    const saved = await perform(
      () => adminService.assignRestaurant(userId, restaurantId),
      'Адміністратора закладу призначено.'
    );

    if (saved) setAssignmentUserId(null);

    return saved;
  }

  function removeAssignment(account, restaurantId) {
    if (operationInProgress.current) return;

    const restaurant = restaurants.find(
      (item) => item.id === restaurantId
    );

    const confirmed = window.confirm(
      `Скасувати призначення для закладу «${
        restaurant?.name || `ID ${restaurantId}`
      }»?`
    );

    if (!confirmed) return;

    perform(
      () => adminService.removeRestaurant(account.id, restaurantId),
      'Призначення адміністратора скасовано.'
    );
  }

  function movePage(nextPage) {
    if (pending || loading) return;

    setLoading(true);
    setLoadError('');
    setActionError('');
    setMessage('');
    setAssignmentUserId(null);
    setPage(nextPage);
  }

  function retryAccounts() {
    setLoading(true);
    setLoadError('');
    setReloadKey((current) => current + 1);
  }

  function retryRestaurants() {
    setRestaurantsLoading(true);
    setRestaurantsError('');
    setRestaurantsReloadKey((current) => current + 1);
  }

  const totalPages = accounts
    ? Math.max(1, Math.ceil(accounts.total / accounts.pageSize))
    : 1;

  return (
    <section
      className="admin-section"
      aria-labelledby="admin-accounts-title"
    >
      <header className="admin-section__heading">
        <div>
          <h2 id="admin-accounts-title">Акаунти</h2>
          <p>
            Доступ користувачів і призначення адміністраторів закладів.
          </p>
        </div>
      </header>

      {message && (
        <p className="admin-message admin-message--success" role="status">
          {message}
        </p>
      )}

      {actionError && (
        <p className="admin-message admin-message--error" role="alert">
          {actionError}
        </p>
      )}

      {restaurantsError && (
        <div className="admin-message admin-message--error" role="alert">
          <p>{restaurantsError}</p>

          <button
            className="admin-button"
            type="button"
            onClick={retryRestaurants}
            disabled={pending || restaurantsLoading}
          >
            Повторити завантаження закладів
          </button>
        </div>
      )}

      {loading ? (
        <p className="admin-message" role="status">
          Завантажуємо акаунти…
        </p>
      ) : loadError ? (
        <div className="admin-message admin-message--error" role="alert">
          <p>{loadError}</p>

          <button
            className="admin-button"
            type="button"
            onClick={retryAccounts}
          >
            Спробувати ще раз
          </button>
        </div>
      ) : accounts ? (
        <>
          <p className="admin-section__count">
            Усього акаунтів: {accounts.total}
          </p>

          {accounts.items.length > 0 ? (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <caption className="admin-table__caption">
                  Акаунти користувачів системи
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Користувач</th>
                    <th scope="col">Роль і стан</th>
                    <th scope="col">Заклади</th>
                    <th scope="col">Дії</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.items.map((account) => {
                    const isCurrentUser =
                      String(account.id) === String(currentUserId);

                    const assignmentOpen =
                      assignmentUserId === account.id;

                    return (
                      <tr key={account.id}>
                        <th scope="row">
                          <span className="admin-table__name">
                            <span className="admin-account__id">
                              #{account.id}
                            </span>
                            {' '}
                            {account.firstName} {account.lastName}
                            {isCurrentUser && ' · це ти'}
                          </span>

                          <span className="admin-table__secondary">
                            {account.email || 'Email не вказано'}
                          </span>
                        </th>

                        <td>
                          <div className="admin-account__role">
                            <span>
                              {roleLabels[account.role] || account.role}
                            </span>

                            <span
                              className={`admin-status admin-status--${
                                account.isActive ? 'active' : 'inactive'
                              }`}
                            >
                              {account.isActive
                                ? 'Активний'
                                : 'Заблокований'}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="admin-account__places">
                            {account.restaurantIds.length > 0 ? (
                              account.restaurantIds.map((restaurantId) => {
                                const restaurant = restaurants.find(
                                  (item) => item.id === restaurantId
                                );

                                return (
                                  <span
                                    className="admin-account__place"
                                    key={restaurantId}
                                  >
                                    <span>
                                      {restaurant?.name ||
                                        `Заклад #${restaurantId}`}
                                    </span>

                                    <button
                                      className="admin-account__remove"
                                      type="button"
                                      disabled={pending || isCurrentUser}
                                      aria-label={`Скасувати призначення для ${
                                        restaurant?.name ||
                                        `закладу ${restaurantId}`
                                      }`}
                                      onClick={() =>
                                        removeAssignment(
                                          account,
                                          restaurantId
                                        )
                                      }
                                    >
                                      ×
                                    </button>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="admin-table__secondary">
                                Немає призначень
                              </span>
                            )}
                          </div>

                          {assignmentOpen && (
                            <div
                              className="admin-account__assignment-panel"
                              id={`account-assignment-${account.id}`}
                            >
                              {restaurantsLoading ? (
                                <p
                                  className="admin-table__secondary"
                                  role="status"
                                >
                                  Завантажуємо заклади…
                                </p>
                              ) : restaurantsError ? (
                                <p className="admin-table__secondary">
                                  Список закладів недоступний.
                                  Повтори завантаження вище.
                                </p>
                              ) : (
                                <AccountAssignment
                                  account={account}
                                  restaurants={restaurants}
                                  disabled={
                                    pending ||
                                    !account.isActive ||
                                    isCurrentUser
                                  }
                                  onAssign={assignRestaurant}
                                />
                              )}
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="admin-table__actions">
                            {account.role !== 'SystemAdmin' && (
                              <button
                                className="admin-button"
                                type="button"
                                disabled={
                                  pending ||
                                  !account.isActive ||
                                  isCurrentUser
                                }
                                aria-expanded={assignmentOpen}
                                aria-controls={
                                  assignmentOpen
                                    ? `account-assignment-${account.id}`
                                    : undefined
                                }
                                onClick={() =>
                                  setAssignmentUserId((current) =>
                                    current === account.id
                                      ? null
                                      : account.id
                                  )
                                }
                              >
                                {assignmentOpen ? 'Закрити' : '+ Заклад'}
                              </button>
                            )}

                            <button
                              className={
                                account.isActive
                                  ? 'admin-button admin-button--danger'
                                  : 'admin-button'
                              }
                              type="button"
                              disabled={pending || isCurrentUser}
                              title={
                                isCurrentUser
                                  ? 'Власний акаунт заблокувати не можна'
                                  : undefined
                              }
                              onClick={() => changeActivity(account)}
                            >
                              {account.isActive
                                ? 'Заблокувати'
                                : 'Активувати'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-message">
              На цій сторінці акаунтів немає.
            </p>
          )}

          {totalPages > 1 && (
            <nav
              className="admin-pagination"
              aria-label="Сторінки акаунтів"
            >
              <button
                className="admin-button"
                type="button"
                disabled={pending || page <= 1}
                onClick={() => movePage(page - 1)}
              >
                Назад
              </button>

              <span>
                Сторінка {page} із {totalPages}
              </span>

              <button
                className="admin-button"
                type="button"
                disabled={pending || page >= totalPages}
                onClick={() => movePage(page + 1)}
              >
                Далі
              </button>
            </nav>
          )}
        </>
      ) : null}
    </section>
  );
}

export default AdminAccounts;