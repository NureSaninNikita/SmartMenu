import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dishesService from '../../services/dishesService';
import './Dish.css';

function Dish() {
  const { restaurantId, dishId } = useParams();

  const [dish, setDish] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadDish() {
      setIsLoading(true);
      setError('');
      setDish(null);
      setImageFailed(false);

      try {
        const result = await dishesService.getDishById(restaurantId, dishId);

        if (isActive) {
          setDish(result);
        }
      } catch {
        if (isActive) {
          setError('Не вдалося завантажити страву.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDish();

    return () => {
      isActive = false;
    };
  }, [restaurantId, dishId]);

  const price = dish?.price == null
    ? null
    : new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: dish.currency,
      maximumFractionDigits: 2,
    }).format(dish.price);

  return (
    <main className="dish-page">
      <nav className="dish-page__nav" aria-label="Навігація сторінки страви">
        <Link to={`/restaurants/${restaurantId}`}>← До закладу</Link>
        <Link to="/restaurants">Усі заклади</Link>
      </nav>

      {isLoading ? (
        <div className="dish-page__message" role="status">
          Завантажуємо щось смачне…
        </div>
      ) : error ? (
        <div className="dish-page__message" role="alert">
          {error}
        </div>
      ) : !dish ? (
        <div className="dish-page__message">
          <h1>Страву не знайдено</h1>
          <p>Можливо, її більше немає в актуальному меню.</p>
        </div>
      ) : (
        <article className="dish-details">
          <div className="dish-details__photo">
            {dish.imageUrl && !imageFailed ? (
              <img
                src={dish.imageUrl}
                alt={dish.title}
                className="dish-details__image"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="dish-details__placeholder">
                <span aria-hidden="true">🍽️</span>
                <p>Фото страви поки немає</p>
              </div>
            )}
          </div>

          <div className="dish-details__info">
            <Link
              to={`/restaurants/${dish.restaurantId}`}
              className="dish-details__restaurant"
            >
              {dish.restaurantName} ↗
            </Link>

            {dish.category && (
              <span className="dish-details__category">
                {dish.category}
              </span>
            )}

            <h1 className="dish-details__title">{dish.title}</h1>

            {dish.status === 'Unavailable' && (
              <p className="dish-details__unavailable">
                Тимчасово недоступна
              </p>
            )}

            <p className="dish-details__description">
              {dish.description?.trim() || 'Опис страви ще не додано.'}
            </p>

            <div className="dish-details__price-row">
              <strong className="dish-details__price">
                {price ?? 'Ціну не вказано'}
              </strong>

              {dish.weight != null && (
                <span className="dish-details__weight">
                  {dish.weight} г
                </span>
              )}
            </div>
            <section className="dish-details__section">
              <h2>Інгредієнти</h2>

              {dish.ingredients?.length > 0 ? (
                <ul className="dish-details__ingredients">
                  {dish.ingredients.map((ingredient) => (
                    <li key={ingredient}>{ingredient}</li>
                  ))}
                </ul>
              ) : (
                <p className="dish-details__empty">
                  Інформацію про інгредієнти ще не додано.
                </p>
              )}
            </section>

            <section className="dish-details__section">
              <h2>Харчові характеристики</h2>

              {[
                dish.calories,
                dish.proteins,
                dish.fats,
                dish.carbohydrates,
              ].some((value) => value != null) ? (
                <dl className="dish-details__nutrition">
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
              ) : (
                <p className="dish-details__empty">
                  Харчові характеристики ще не вказані.
                </p>
              )}
            </section>
          </div>
          <section className="dish-reviews" aria-labelledby="dish-reviews-title">
            <div className="dish-reviews__heading">
              <div>
                <span className="dish-reviews__label">Досвід інших гостей</span>
                <h2 id="dish-reviews-title">Оцінки та відгуки</h2>
              </div>

              {dish.averageRating != null && dish.ratingCount > 0 ? (
                <div className="dish-reviews__summary">
                  <span className="dish-reviews__score">
                    <span aria-hidden="true">★</span>
                    {' '}
                    {new Intl.NumberFormat('uk-UA', {
                      maximumFractionDigits: 2,
                    }).format(dish.averageRating)}
                    <span className="dish-reviews__scale"> / 5</span>
                  </span>

                  <span className="dish-reviews__count">
                    Кількість оцінок: {dish.ratingCount}
                  </span>
                </div>
              ) : (
                <p className="dish-details__empty">Оцінок поки немає.</p>
              )}
            </div>

            {dish.reviews?.length > 0 ? (
              <ul className="dish-reviews__list">
                {dish.reviews.map((review) => (
                  <li key={review.id} className="dish-review">
                    <div className="dish-review__heading">
                      <div>
                        <h3 className="dish-review__author">
                          {review.authorName?.trim() || 'Гість'}
                        </h3>

                        <time
                          className="dish-review__date"
                          dateTime={review.createdAt}
                        >
                          {new Date(review.createdAt).toLocaleDateString('uk-UA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </time>
                      </div>

                      {review.rating != null && (
                        <span
                          className="dish-review__rating"
                          aria-label={`Оцінка автора: ${review.rating} з 5`}
                        >
                          <span aria-hidden="true">★</span> {review.rating} / 5
                        </span>
                      )}
                    </div>

                    <p className="dish-review__text">{review.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dish-reviews__empty">
                <h3>Тут ще немає відгуків</h3>
                <p>Гості поки не поділилися враженнями про цю страву.</p>
              </div>
            )}
          </section>
        </article>
      )}
    </main>
  );
}

export default Dish;