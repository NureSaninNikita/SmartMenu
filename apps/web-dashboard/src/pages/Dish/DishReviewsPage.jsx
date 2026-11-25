import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dishesService from '../../services/dishesService';
import DishReviewForm from '../../components/Feedback/DishReviewForm';
import ReviewActions from '../../components/Feedback/ReviewActions';
import { apiErrorMessage } from '../../services/apiError';

function DishReviewsPage({ session }) {
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

  return <main className="page-stub page-stub--functional">
    <p><Link to={`/restaurants/${restaurantId}/dishes/${dishId}`}>До страви</Link></p>
    <h1>Відгуки про страву</h1>
    {loading ? <p>Завантаження…</p> : error ? <p role="alert">{error}</p> :
      !dish ? <p>Страву не знайдено.</p> : <>
        <h2>{dish.title}</h2>
        <DishReviewForm dishId={dish.id} session={session} onChanged={loadDish} />
        {dish.reviews?.length > 0 ? <ul>
          {dish.reviews.map((review) => <li key={review.id}>
            <strong>{review.authorName}</strong>{' '}
            <time dateTime={review.editedAt || review.createdAt}>
              {new Date(review.editedAt || review.createdAt).toLocaleDateString('uk-UA')}
            </time>{' '}
            {review.editedAt && <span>(змінено)</span>}
            <p>{review.text}</p>
            <ReviewActions review={review} session={session} onChanged={loadDish} />
          </li>)}
        </ul> : <p>Відгуків поки немає.</p>}
      </>}
  </main>;
}

export default DishReviewsPage;
