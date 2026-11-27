import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import reviewService from '../../services/reviewService';
import ReviewActions from '../../components/Feedback/ReviewActions';
import {
  PREFS_CHANGE_EVENT,
  addBlacklistIngredient,
  readPreferences,
  removeBlacklistIngredient,
  toggleBlacklistDish,
  toggleBlacklistRestaurant,
  toggleWhitelistDish,
  toggleWhitelistRestaurant,
} from '../../services/preferencesStore';
import { apiErrorMessage } from '../../services/apiError';
import '../../components/Feedback/Feedback.css';
import './Profile.css';

const PROFILE_TABS = [
  { id: 'profile', label: 'Профіль' },
  { id: 'ratings', label: 'Мої оцінки' },
  { id: 'reviews', label: 'Мої відгуки' },
  { id: 'whitelist', label: 'Білий список' },
  { id: 'blacklist', label: 'Чорний список' },
];

function Profile({ session, onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = session.user;

  const tabParam = searchParams.get('tab');
  const activeTab = PROFILE_TABS.some((t) => t.id === tabParam) ? tabParam : 'profile';

  const [editName, setEditName] = useState(`${user.firstName || ''} ${user.lastName || ''}`.trim());
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [avatarFileName, setAvatarFileName] = useState('');
  const [profileNotice, setProfileNotice] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  const [prefs, setPrefs] = useState(readPreferences);
  const [listSearch, setListSearch] = useState('');
  const [newIngredient, setNewIngredient] = useState('');

  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(PREFS_CHANGE_EVENT, sync);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, sync);
  }, []);

  const loadMyReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError('');
    try {
      const result = await reviewService.getMyReviews();
      setReviews(result);
    } catch (failure) {
      setReviewsError(apiErrorMessage(failure, 'Не вдалося завантажити ваші відгуки.'));
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'reviews' && activeTab !== 'ratings') return undefined;
    let active = true;

    async function fetchInitial() {
      await Promise.resolve();
      if (!active) return;
      setReviewsLoading(true);
      setReviewsError('');
      try {
        const result = await reviewService.getMyReviews();
        if (active) setReviews(result);
      } catch (failure) {
        if (active) {
          setReviewsError(apiErrorMessage(failure, 'Не вдалося завантажити дані.'));
        }
      } finally {
        if (active) setReviewsLoading(false);
      }
    }

    fetchInitial();
    return () => { active = false; };
  }, [activeTab]);

  function setTab(tab) {
    setListSearch('');
    setSearchParams(
      tab === 'profile' ? new URLSearchParams() : new URLSearchParams({ tab }),
      { replace: true }
    );
  }

  function handleProfileSave(event) {
    event.preventDefault();
    setProfileNotice(
      'Збереження змін профілю та аватару на сервері буде активовано після додавання ендпоінту оновлення профілю у бекенді.'
    );
  }

  function handleAddBlacklistIngredient(event) {
    event.preventDefault();
    if (!newIngredient.trim()) return;
    setPrefs(addBlacklistIngredient(newIngredient));
    setNewIngredient('');
  }

  function handleLogout() {
    if (onLogout) onLogout();
    navigate('/', { replace: true });
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Користувач';
  const initial = (user.firstName || user.email || 'U').charAt(0).toLocaleUpperCase('uk-UA');
  const q = listSearch.trim().toLocaleLowerCase('uk-UA');

  const ratedReviews = reviews.filter((r) => r.rating != null);

  const filteredWhitelistDishes = prefs.whitelistDishes.filter(
    (item) =>
      !q ||
      item.title.toLocaleLowerCase('uk-UA').includes(q) ||
      (item.restaurantName || '').toLocaleLowerCase('uk-UA').includes(q)
  );
  const filteredWhitelistRestaurants = prefs.whitelistRestaurants.filter(
    (item) => !q || item.name.toLocaleLowerCase('uk-UA').includes(q)
  );

  const filteredBlacklistDishes = prefs.blacklistDishes.filter(
    (item) =>
      !q ||
      item.title.toLocaleLowerCase('uk-UA').includes(q) ||
      (item.restaurantName || '').toLocaleLowerCase('uk-UA').includes(q)
  );
  const filteredBlacklistRestaurants = prefs.blacklistRestaurants.filter(
    (item) => !q || item.name.toLocaleLowerCase('uk-UA').includes(q)
  );

  return (
    <main className="profile-page">
      <header className="profile-page__header">
        <div>
          <span className="sm-eyebrow">Особистий кабінет</span>
          <h1>Вітаємо, {user.firstName || 'користувачу'}</h1>
        </div>
        <p className="profile-page__intro">
          Налаштуйте вподобання, щоб SmartMenu точніше добирав страви для вас.
        </p>
      </header>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-sidebar__user">
            <span className="profile-sidebar__avatar sm-serif" aria-hidden="true">
              {initial}
            </span>
            <h2 className="profile-sidebar__name sm-serif">{fullName}</h2>
            <p className="profile-sidebar__email">{user.email || 'Email не вказано'}</p>
          </div>

          <nav className="profile-sidebar__nav" aria-label="Розділи профілю">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={
                  activeTab === tab.id
                    ? 'profile-nav-btn profile-nav-btn--active'
                    : 'profile-nav-btn'
                }
                onClick={() => setTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}

            {user.role === 'RestaurantAdmin' && (
              <Link to="/restaurant-admin" className="profile-nav-link">
                Керування закладом →
              </Link>
            )}

            {user.role === 'SystemAdmin' && (
              <Link to="/admin" className="profile-nav-link">
                Панель адміністратора →
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="profile-sidebar__logout"
            onClick={handleLogout}
          >
            Вийти з профілю
          </button>
        </aside>

        <section className="profile-panel">
          {activeTab === 'profile' && (
            <>
              <span className="sm-eyebrow">Особисті дані</span>
              <h2 className="profile-panel__title">Редагування профілю</h2>

              <form className="profile-edit-form" onSubmit={handleProfileSave}>
                <div className="profile-field">
                  <label htmlFor="profile-name">Ім’я</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={editName}
                    onChange={(event) => {
                      setEditName(event.target.value);
                      setProfileNotice('');
                    }}
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={editEmail}
                    onChange={(event) => {
                      setEditEmail(event.target.value);
                      setProfileNotice('');
                    }}
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-avatar">Аватар</label>
                  <label className="profile-avatar-upload" htmlFor="profile-avatar">
                    <input
                      id="profile-avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        setAvatarFileName(event.target.files?.[0]?.name || '');
                        setProfileNotice('');
                      }}
                    />
                    <span>{avatarFileName || 'Обрати зображення'}</span>
                  </label>
                </div>

                {profileNotice && (
                  <p className="profile-notice" role="status">
                    {profileNotice}
                  </p>
                )}

                <button type="submit" className="profile-save-btn">
                  Зберегти профіль
                </button>
              </form>

              {user.restaurantIds?.length > 0 && (
                <div className="profile-restaurants-box">
                  <span className="profile-restaurants-box__label">Закріплені заклади</span>
                  <div className="profile-restaurants-links">
                    {user.restaurantIds.map((id) => (
                      <Link key={id} to={`/restaurants/${id}`}>
                        Заклад №{id} ↗
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'ratings' && (
            <>
              <span className="sm-eyebrow">Ваша активність</span>
              <h2 className="profile-panel__title">Мої оцінки</h2>

              {reviewsLoading ? (
                <div className="profile-empty-box" role="status">
                  <p>Завантажуємо оцінки…</p>
                </div>
              ) : ratedReviews.length === 0 ? (
                <div className="profile-empty-box">
                  <span className="profile-empty-box__icon" aria-hidden="true">☆</span>
                  <h3 className="sm-serif">Оцінок поки немає</h3>
                  <p>Оцініть страви у меню ресторанів — вони з’являться тут.</p>
                </div>
              ) : (
                <ul className="feedback-list">
                  {ratedReviews.map((review) => (
                    <li key={review.id} className="feedback-item">
                      <div className="feedback-item__head">
                        <h3 className="feedback-item__author">Страва №{review.dishId}</h3>
                        <span className="feedback-item__rating">★ {review.rating} / 5</span>
                      </div>
                      <p className="feedback-item__text">{review.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {activeTab === 'reviews' && (
            <>
              <span className="sm-eyebrow">Ваша активність</span>
              <h2 className="profile-panel__title">Мої відгуки</h2>

              {reviewsLoading ? (
                <div className="profile-empty-box" role="status">
                  <p>Завантажуємо вашу історію відгуків…</p>
                </div>
              ) : reviewsError ? (
                <p className="feedback-alert feedback-alert--error" role="alert">
                  {reviewsError}
                </p>
              ) : reviews.length === 0 ? (
                <div className="profile-empty-box">
                  <span className="profile-empty-box__icon" aria-hidden="true">⌕</span>
                  <h3 className="sm-serif">Відгуків поки немає</h3>
                  <p>Ваші відгуки з’являться тут.</p>
                </div>
              ) : (
                <ul className="feedback-list">
                  {reviews.map((review) => {
                    const dateIso = review.editedAt || review.createdAt;
                    return (
                      <li key={review.id} className="feedback-item">
                        <div className="feedback-item__head">
                          <div>
                            <h3 className="feedback-item__author">
                              {review.dishId
                                ? `Відгук до страви №${review.dishId}`
                                : review.restaurantId
                                  ? `Відгук про заклад №${review.restaurantId}`
                                  : 'Відгук'}
                            </h3>
                            <div className="feedback-item__meta">
                              <time dateTime={dateIso}>
                                {new Date(dateIso).toLocaleDateString('uk-UA', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </time>
                              {review.editedAt && (
                                <span className="feedback-item__edited">змінено</span>
                              )}
                            </div>
                          </div>

                          {review.restaurantId && !review.dishId && (
                            <Link
                              to={`/restaurants/${review.restaurantId}?tab=reviews`}
                              className="profile-review-target-link"
                            >
                              До закладу →
                            </Link>
                          )}
                        </div>

                        <p className="feedback-item__text">{review.text}</p>

                        <ReviewActions
                          review={review}
                          session={session}
                          onChanged={loadMyReviews}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {activeTab === 'whitelist' && (
            <>
              <span className="sm-eyebrow">Постійні вподобання</span>
              <h2 className="profile-panel__title">Білий список</h2>
              <p className="profile-panel__sub">
                Обрані об’єкти мають пріоритет у видачі.
              </p>

              <div className="profile-list-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Знайти страву або ресторан"
                  value={listSearch}
                  onChange={(event) => setListSearch(event.target.value)}
                />
              </div>

              <div className="profile-list-group">
                <h3 className="sm-serif">Страви</h3>
                {filteredWhitelistDishes.length === 0 ? (
                  <p className="profile-list-empty">Поки що немає обраних страв.</p>
                ) : (
                  <ul className="profile-pref-list">
                    {filteredWhitelistDishes.map((item) => (
                      <li key={item.id}>
                        <Link to={`/restaurants/${item.restaurantId}/dishes/${item.id}`}>
                          <strong>{item.title}</strong>
                          {item.restaurantName && <span>{item.restaurantName}</span>}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPrefs(toggleWhitelistDish(item))}
                        >
                          Прибрати
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="profile-list-group">
                <h3 className="sm-serif">Ресторани</h3>
                {filteredWhitelistRestaurants.length === 0 ? (
                  <p className="profile-list-empty">Поки що немає обраних ресторанів.</p>
                ) : (
                  <ul className="profile-pref-list">
                    {filteredWhitelistRestaurants.map((item) => (
                      <li key={item.id}>
                        <Link to={`/restaurants/${item.id}`}>
                          <strong>{item.name}</strong>
                          {item.city && <span>{item.city}</span>}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPrefs(toggleWhitelistRestaurant(item))}
                        >
                          Прибрати
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {activeTab === 'blacklist' && (
            <>
              <span className="sm-eyebrow">Постійні вподобання</span>
              <h2 className="profile-panel__title">Чорний список</h2>
              <p className="profile-panel__sub">
                Приховані страви, ресторани та інгредієнти не відображатимуться у видачі.
              </p>

              <div className="profile-list-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Знайти страву або ресторан"
                  value={listSearch}
                  onChange={(event) => setListSearch(event.target.value)}
                />
              </div>

              <div className="profile-list-group">
                <h3 className="sm-serif">Страви</h3>
                {filteredBlacklistDishes.length === 0 ? (
                  <p className="profile-list-empty">Прихованих страв немає.</p>
                ) : (
                  <ul className="profile-pref-list">
                    {filteredBlacklistDishes.map((item) => (
                      <li key={item.id}>
                        <Link to={`/restaurants/${item.restaurantId}/dishes/${item.id}`}>
                          <strong>{item.title}</strong>
                          {item.restaurantName && <span>{item.restaurantName}</span>}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPrefs(toggleBlacklistDish(item))}
                        >
                          Повернути
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="profile-list-group">
                <h3 className="sm-serif">Ресторани</h3>
                {filteredBlacklistRestaurants.length === 0 ? (
                  <p className="profile-list-empty">Прихованих ресторанів немає.</p>
                ) : (
                  <ul className="profile-pref-list">
                    {filteredBlacklistRestaurants.map((item) => (
                      <li key={item.id}>
                        <Link to={`/restaurants/${item.id}`}>
                          <strong>{item.name}</strong>
                          {item.city && <span>{item.city}</span>}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPrefs(toggleBlacklistRestaurant(item))}
                        >
                          Повернути
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="profile-list-group">
                <h3 className="sm-serif">Інгредієнти та речовини</h3>
                <form className="profile-ingredient-add" onSubmit={handleAddBlacklistIngredient}>
                  <input
                    type="text"
                    placeholder="Наприклад, арахіс"
                    value={newIngredient}
                    onChange={(event) => setNewIngredient(event.target.value)}
                  />
                  <button type="submit">Додати</button>
                </form>

                {prefs.blacklistIngredients.length > 0 && (
                  <div className="profile-chips">
                    {prefs.blacklistIngredients.map((item) => (
                      <span key={item} className="profile-chip">
                        {item}
                        <button
                          type="button"
                          aria-label={`Видалити ${item}`}
                          onClick={() => setPrefs(removeBlacklistIngredient(item))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Profile;
