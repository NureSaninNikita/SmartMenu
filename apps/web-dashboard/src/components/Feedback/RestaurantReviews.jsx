import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import reviewService from '../../services/reviewService';
import { apiErrorMessage } from '../../services/apiError';

function RestaurantReviews({ restaurantId, session }) {
  const [reviews, setReviews] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadReviews = useCallback(async () => {
    setReviews(await reviewService.getRestaurantReviews(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    let active = true;
    reviewService.getRestaurantReviews(restaurantId)
      .then((result) => { if (active) setReviews(result); })
      .catch((failure) => {
        if (active) setError(apiErrorMessage(failure, 'Не вдалося завантажити відгуки.'));
      });
    return () => { active = false; };
  }, [restaurantId]);

  async function addReview(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await reviewService.createRestaurantReview(restaurantId, text.trim());
      setText('');
      await loadReviews();
      setMessage('Відгук додано.');
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося додати відгук.'));
    } finally {
      setBusy(false);
    }
  }

  return <section aria-label="Відгуки про заклад">
    <h2>Відгуки про заклад</h2>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {reviews.length === 0 ? <p>Відгуків поки немає.</p> : <ul>
      {reviews.map((review) => <li key={review.id}>
        <strong>{review.authorName}</strong>{' '}
        <time dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString('uk-UA')}
        </time>
        <p>{review.text}</p>
      </li>)}
    </ul>}
    {session ? <form onSubmit={addReview}>
      <label>Ваш відгук{' '}
        <textarea required maxLength={2000} value={text}
          onChange={(event) => setText(event.target.value)} />
      </label>{' '}
      <button type="submit" disabled={busy}>Додати відгук</button>
    </form> : <p><Link to="/login">Увійдіть</Link>, щоб написати відгук.</p>}
  </section>;
}

export default RestaurantReviews;
