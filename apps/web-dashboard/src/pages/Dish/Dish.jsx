import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dishesService from '../../services/dishesService';
import searchService from '../../services/searchService';
import DishCard from '../../components/DishCard/DishCard';
import DishRating from '../../components/DishRating/DishRating';
import DishReviewForm from '../../components/Feedback/DishReviewForm';
import ReviewActions from '../../components/Feedback/ReviewActions';
import {
  PREFS_CHANGE_EVENT,
  readPreferences,
  toggleBlacklistDish,
  toggleWhitelistDish,
} from '../../services/preferencesStore';
import { apiErrorMessage } from '../../services/apiError';
import './Dish.css';

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dish({ session, onOpenAuth }) {
  const { restaurantId, dishId } = useParams();
  const navigate = useNavigate();

  const [dish, setDish] = useState(null);
  const [relatedDishes, setRelatedDishes] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [prefs, setPrefs] = useState(readPreferences);

  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(PREFS_CHANGE_EVENT, sync);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, sync);
  }, []);

  const refreshDish = useCallback(async () => {
    const result = await dishesService.getDishById(restaurantId, dishId);
    setDish(result);
  }, [restaurantId, dishId]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    async function loadDish() {
      setIsLoading(true);
      setError('');
      setDish(null);
      setRelatedDishes([]);
      setActivePhotoIndex(0);
      setImageFailed(false);

      try {
        const result = await dishesService.getDishById(restaurantId, dishId);
        if (!isActive) return;
        setDish(result);

        if (result) {
          try {
            const sameRestaurant = await searchService.searchDishes(
              restaurantId,
              { page: 1, pageSize: 8 },
              { signal: controller.signal }
            );
            if (isActive) {
              setRelatedDishes(
                sameRestaurant.items
                  .filter((item) => String(item.id) !== String(result.id))
                  .slice(0, 3)
                  .map((item) => ({ ...item, restaurantName: result.restaurantName }))
              );
            }
          } catch {
            // Optional recommendations must not block dish details (SRS NFR-R-3)
          }
        }
      } catch (failure) {
        if (isActive) {
          setError(apiErrorMessage(failure, 'Не вдалося завантажити страву.'));
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadDish();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [restaurantId, dishId]);

  const price = dish?.price == null
    ? null
    : new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: dish.currency || 'UAH',
        maximumFractionDigits: 2,
      }).format(dish.price);

  const photos = dish?.photos?.length > 0
    ? dish.photos
    : dish?.imageUrl
      ? [dish.imageUrl]
      : [];
  const currentPhoto = photos[activePhotoIndex] || null;
  const isUnavailable = dish?.status === 'Unavailable';

  const hasNutrition = dish && [
    dish.calories,
    dish.proteins,
    dish.fats,
    dish.carbohydrates,
  ].some((value) => value != null);

  return (
    <main className="dish-page-wrap">
      <div className="dish-page">
        <nav className="dish-page__nav" aria-label="Навігація сторінки страви">
          <button
            className="dish-page__back"
            type="button"
            onClick={() => navigate(-1)}
          >
            ← Повернутися до списку
          </button>
        </nav>

        {isLoading ? (
          <div className="dish-page__message" role="status">
            Завантажуємо деталі страви…
          </div>
        ) : error ? (
          <div className="dish-page__message dish-page__message--error" role="alert">
            {error}
          </div>
        ) : !dish ? (
          <div className="dish-page__message">
            <h1>Страву не знайдено</h1>
            <p>Можливо, її більше немає в актуальному меню.</p>
            <Link to="/dishes" className="dish-page__cta-link">
              До каталогу страв
            </Link>
          </div>
        ) : (
          <>
            <article className="dish-hero">
              <div className="dish-hero__media">
                <div className="dish-hero__photo-frame">
                  {currentPhoto && !imageFailed ? (
                    <img
                      src={currentPhoto}
                      alt={dish.title}
                      className="dish-hero__image"
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <div className="dish-hero__placeholder">
                      <span>Фото відсутнє</span>
                    </div>
                  )}

                  {dish.category && (
                    <span className="dish-hero__category-pill">{dish.category}</span>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="dish-hero__thumbs" role="group" aria-label="Фотографії страви">
                    {photos.map((photoUrl, index) => (
                      <button
                        key={photoUrl}
                        type="button"
                        className={
                          index === activePhotoIndex
                            ? 'dish-hero__thumb dish-hero__thumb--active'
                            : 'dish-hero__thumb'
                        }
                        onClick={() => {
                          setActivePhotoIndex(index);
                          setImageFailed(false);
                        }}
                      >
                        <img src={photoUrl} alt={`${dish.title} — фото ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="dish-hero__info">
                <Link
                  to={`/restaurants/${dish.restaurantId}`}
                  className="dish-hero__restaurant-link"
                >
                  {dish.restaurantName} →
                </Link>

                <h1 className="dish-hero__title">{dish.title}</h1>

                <div className="dish-hero__meta-row">
                  {dish.averageRating != null && dish.ratingCount > 0 ? (
                    <span className="dish-hero__rating-meta">
                      <span className="dish-hero__star" aria-hidden="true">★</span>{' '}
                      <strong>
                        {new Intl.NumberFormat('uk-UA', {
                          maximumFractionDigits: 2,
                        }).format(dish.averageRating)}
                      </strong>{' '}
                      із 5 · {dish.ratingCount} оцінок
                    </span>
                  ) : (
                    <span className="dish-hero__rating-meta">Оцінок поки немає</span>
                  )}

                  <span className="dish-hero__prep-time">
                    <ClockIcon />
                    <span>{dish.preparationTime || '15–25 хв'}</span>
                  </span>

                  {dish.weight != null && (
                    <span className="dish-hero__weight">{dish.weight} г</span>
                  )}
                </div>

                <span
                  className={`dish-hero__availability${
                    isUnavailable
                      ? ' dish-hero__availability--unavailable'
                      : ' dish-hero__availability--available'
                  }`}
                >
                  {isUnavailable ? 'Тимчасово недоступна' : 'Доступно зараз'}
                </span>

                <hr className="dish-hero__divider" />

                <p className="dish-hero__description">
                  {dish.description?.trim() || 'Опис страви ще не додано.'}
                </p>

                <section className="dish-ingredients-box">
                  <span className="dish-ingredients-box__label">Склад</span>
                  {dish.ingredients?.length > 0 ? (
                    <p className="dish-ingredients-box__text">
                      {dish.ingredients.join(', ')}
                    </p>
                  ) : (
                    <p className="dish-ingredients-box__empty">
                      Інформацію про склад ще не додано.
                    </p>
                  )}
                </section>

                {hasNutrition && (
                  <section className="dish-nutrition" aria-label="Харчові характеристики">
                    <h2>Харчова цінність (КБЖВ)</h2>
                    <dl className="dish-nutrition__grid">
                      {dish.calories != null && (
                        <div>
                          <dt>Калорійність</dt>
                          <dd>{dish.calories} ккал</dd>
                        </div>
                      )}
                      {dish.proteins != null && (
                        <div>
                          <dt>Білки</dt>
                          <dd>{dish.proteins} г</dd>
                        </div>
                      )}
                      {dish.fats != null && (
                        <div>
                          <dt>Жири</dt>
                          <dd>{dish.fats} г</dd>
                        </div>
                      )}
                      {dish.carbohydrates != null && (
                        <div>
                          <dt>Вуглеводи</dt>
                          <dd>{dish.carbohydrates} г</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}

                <div className="dish-price-block">
                  <div>
                    <span className="dish-price-block__label">Ціна страви</span>
                    <strong className="dish-price-block__value">
                      {price ?? 'Ціну не вказано'}
                    </strong>
                  </div>

                  <div className="dish-price-block__actions">
                    <button
                      type="button"
                      className="dish-price-block__whitelist-btn"
                      onClick={() => setPrefs(toggleWhitelistDish(dish))}
                    >
                      {prefs.whitelistDishes.some((d) => Number(d.id) === Number(dish.id))
                        ? '♥ У білому списку'
                        : '♡ До білого списку'}
                    </button>
                    <button
                      type="button"
                      className="dish-price-block__blacklist-btn"
                      onClick={() => setPrefs(toggleBlacklistDish(dish))}
                    >
                      {prefs.blacklistDishes.some((d) => Number(d.id) === Number(dish.id))
                        ? 'Приховано'
                        : 'Не показувати'}
                    </button>
                  </div>
                </div>

                <Link
                  to={`/restaurants/${dish.restaurantId}`}
                  className="dish-restaurant-card"
                >
                  <span className="dish-restaurant-card__avatar sm-serif" aria-hidden="true">
                    {(dish.restaurantName || 'S').charAt(0).toLocaleUpperCase('uk-UA')}
                  </span>
                  <div className="dish-restaurant-card__text">
                    <span>Готують у ресторані</span>
                    <strong>{dish.restaurantName}</strong>
                  </div>
                  <span className="dish-restaurant-card__arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </article>

            <section className="dish-reviews" aria-labelledby="dish-reviews-title">
              <div className="dish-reviews__header">
                <div>
                  <span className="sm-eyebrow">Ваші враження</span>
                  <h2 id="dish-reviews-title">Оцінки та відгуки</h2>
                </div>
              </div>

              <div className="dish-reviews__forms">
                <DishRating
                  dishId={dish.id}
                  session={session}
                  onChanged={refreshDish}
                  onOpenAuth={onOpenAuth}
                />

                <DishReviewForm
                  dishId={dish.id}
                  session={session}
                  onChanged={refreshDish}
                  onOpenAuth={onOpenAuth}
                />
              </div>

              {dish.reviews?.length > 0 ? (
                <ul className="feedback-list feedback-list--two-col">
                  {dish.reviews.map((review) => {
                    const author = review.authorName?.trim() || 'Гість';
                    const initial = author.charAt(0).toLocaleUpperCase('uk-UA');
                    const dateIso = review.editedAt || review.createdAt;
                    return (
                      <li key={review.id} className="feedback-item">
                        <div className="feedback-item__head">
                          <div className="feedback-item__author-wrap">
                            <span className="feedback-item__avatar" aria-hidden="true">
                              {initial}
                            </span>
                            <div>
                              <h3 className="feedback-item__author">{author}</h3>
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
                          </div>

                          {review.rating != null && (
                            <span
                              className="feedback-item__rating"
                              aria-label={`Оцінка автора: ${review.rating} з 5`}
                            >
                              <span aria-hidden="true">★</span> {review.rating}
                            </span>
                          )}
                        </div>

                        <p className="feedback-item__text">{review.text}</p>

                        <ReviewActions
                          review={review}
                          session={session}
                          onChanged={refreshDish}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="feedback-empty">
                  <h3 className="sm-serif">Відгуків поки немає</h3>
                  <p>Гості поки не поділилися враженнями про цю страву.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {!isLoading && dish && relatedDishes.length > 0 && (
        <div className="dish-related-band">
          <section className="dish-related" aria-labelledby="dish-related-title">
            <div className="dish-related__head">
              <span className="sm-eyebrow">У цьому ж місці</span>
              <h2 id="dish-related-title">Вам також може сподобатися</h2>
            </div>

            <div className="dish-related__grid">
              {relatedDishes.map((item) => (
                <DishCard key={item.id} dish={item} />
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default Dish;
