import { useState } from 'react';
import { Link } from 'react-router-dom';
import reviewService from '../../services/reviewService';
import { apiErrorMessage } from '../../services/apiError';

function DishReviewForm({ dishId, session, onChanged }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function addReview(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await reviewService.createDishReview(dishId, text.trim());
      setText('');
      setMessage('Відгук додано.');
      onChanged();
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося додати відгук.'));
    } finally {
      setBusy(false);
    }
  }

  if (!session) return <p><Link to="/login">Увійдіть</Link>, щоб написати відгук.</p>;

  return <div>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <form onSubmit={addReview}>
      <label>Ваш відгук{' '}
        <textarea required maxLength={2000} value={text}
          onChange={(event) => setText(event.target.value)} />
      </label>{' '}
      <button type="submit" disabled={busy}>Додати відгук</button>
    </form>
  </div>;
}

export default DishReviewForm;
