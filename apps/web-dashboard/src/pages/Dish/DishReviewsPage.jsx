import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dishesService from '../../services/dishesService';
import DishReviewForm from '../../components/Feedback/DishReviewForm';
import ReviewActions from '../../components/Feedback/ReviewActions';
import { apiErrorMessage } from '../../services/apiError';
import '../../components/Feedback/Feedback.css';
import './Dish.css';

function DishReviewsPage({ session, onOpenAuth }) {
  const { restaurantId, dishId } = useParams();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDish = useCallback(async () => {
    setDish(await dishesService.getDishById(restaurantId, dishId));
  }, [restaurantId, dishId]);

  useEffect(() => {
    let active = true;
    dishesService.getDishById(restaurantId, dishId)
      .then((result) => { if (active) setDish(result); })
      .catch((failure) => {
        if (active) setError(apiErrorMessage(failure, 'Не вдалося завантажити відгуки.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [restaurantId, dishId]);

  return (
    <main className="dish-page">
      <nav className="dish-page__nav">
        <Link className="dish-page__back" to={`/restaurants/${restaurantId}/dishes/${dishId}`}>
          ← До картки страви
        </Link>
      </nav>

      <div className="dish-reviews__header">
        <div>
          <span className="sm-eyebrow">Думки гостей</span>
          <h1>Відгуки про страву</h1>
        </div>
      </div>

      {loading ? (
        <div className="dish-page__message" role="status">Завантаження…</div>
      ) : error ? (
        <div className="dish-page__message dish-page__message--error" role="alert">{error}</div>
      ) : !dish ? (
        <div className="dish-page__message">Страву не знайдено.</div>
      ) : (
        <>
          <h2 style={{ marginBottom: 20 }}>{dish.title}</h2>
          <DishReviewForm dishId={dish.id} session={session} onChanged={loadDish} onOpenAuth={onOpenAuth} />

          {dish.reviews?.length > 0 ? (
            <ul className="feedback-list">
              {dish.reviews.map((review) => {
                const author = review.authorName?.trim() || 'Гість';
                const dateIso = review.editedAt || review.createdAt;
                return (
                  <li key={review.id} className="feedback-item">
                    <div className="feedback-item__head">
                      <div className="feedback-item__author-wrap">
                        <span className="feedback-item__avatar" aria-hidden="true">
                          {author.charAt(0).toLocaleUpperCase('uk-UA')}
                        </span>
                        <div>
                          <h3 className="feedback-item__author">{author}</h3>
                          <div className="feedback-item__meta">
                            <time dateTime={dateIso}>
                              {new Date(dateIso).toLocaleDateString('uk-UA')}
                            </time>
                            {review.editedAt && (
                              <span className="feedback-item__edited">змінено</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {review.rating != null && (
                        <span className="feedback-item__rating">★ {review.rating} / 5</span>
                      )}
                    </div>
                    <p className="feedback-item__text">{review.text}</p>
                    <ReviewActions review={review} session={session} onChanged={loadDish} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="feedback-empty">
              <h3>Відгуків поки немає</h3>
              <p>Поділіться своїми враженнями першим.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default DishReviewsPage;
