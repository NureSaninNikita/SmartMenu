import { useState } from 'react';
import reviewService from '../../services/reviewService';
import { apiErrorMessage } from '../../services/apiError';

function ReviewActions({ review, session, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(review.text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!session || Number(review.userId) !== Number(session.user.id)) return null;

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await reviewService.updateReview(review.id, text.trim());
      setEditing(false);
      await onChanged();
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося змінити відгук.'));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Видалити ваш відгук?')) return;
    setBusy(true);
    setError('');
    try {
      await reviewService.deleteReview(review.id);
      await onChanged();
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося видалити відгук.'));
    } finally {
      setBusy(false);
    }
  }

  return <div>
    {error && <p role="alert">{error}</p>}
    {editing ? <form onSubmit={save}>
      <label>Текст відгуку{' '}
        <textarea required maxLength={2000} value={text}
          onChange={(event) => setText(event.target.value)} />
      </label>{' '}
      <button type="submit" disabled={busy}>Зберегти</button>{' '}
      <button type="button" disabled={busy} onClick={() => setEditing(false)}>Скасувати</button>
    </form> : <>
      <button type="button" disabled={busy} onClick={() => setEditing(true)}>Редагувати</button>{' '}
      <button type="button" disabled={busy} onClick={remove}>Видалити</button>
    </>}
  </div>;
}

export default ReviewActions;
