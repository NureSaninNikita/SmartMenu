import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dishRatingService from '../../services/dishRatingService';
import { apiErrorMessage } from '../../services/apiError';

function DishRating({ dishId, session, onChanged }) {
  const [rating, setRating] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!session) return undefined;
    dishRatingService.getMine(dishId)
      .then((result) => { if (active) setRating(result.value ?? ''); })
      .catch((failure) => {
        if (active) setError(apiErrorMessage(failure, 'Не вдалося завантажити вашу оцінку.'));
      });
    return () => { active = false; };
  }, [dishId, session]);

  async function saveRating(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await dishRatingService.setMine(dishId, Number(rating));
      setMessage('Оцінку збережено.');
      onChanged();
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося зберегти оцінку.'));
    } finally {
      setBusy(false);
    }
  }

  if (!session) return <p><Link to="/login">Увійдіть</Link>, щоб оцінити страву.</p>;

  return <div>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <form onSubmit={saveRating}>
      <label>Ваша оцінка{' '}
        <select required value={rating} onChange={(event) => setRating(event.target.value)}>
          <option value="">Оберіть оцінку</option>
          {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>{' '}
      <button type="submit" disabled={busy}>Зберегти оцінку</button>
    </form>
  </div>;
}

export default DishRating;
