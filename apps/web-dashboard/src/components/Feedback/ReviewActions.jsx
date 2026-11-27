import { useState } from 'react';
import reviewService from '../../services/reviewService';
import { apiErrorMessage } from '../../services/apiError';
import './Feedback.css';

const MAX_REVIEW_LENGTH = 2000;

function ReviewActions({ review, session, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(review.text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!session || Number(review.userId) !== Number(session.user.id)) return null;

  async function save(event) {
    event.preventDefault();
    if (busy) return;

    const trimmed = text.trim();
    setError('');

    if (!trimmed) {
      setError('Вкажіть текст відгуку.');
      return;
    }

    if (trimmed.length > MAX_REVIEW_LENGTH) {
      setError(`Відгук не може перевищувати ${MAX_REVIEW_LENGTH} символів.`);
      return;
    }

    setBusy(true);
    try {
      await reviewService.updateReview(review.id, trimmed);
      setEditing(false);
      await onChanged();
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося змінити відгук.'));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
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

  return (
    <div className="feedback-item__actions">
      {error && (
        <p className="feedback-alert feedback-alert--error" role="alert" style={{ marginBottom: 10 }}>
          {error}
        </p>
      )}

      {editing ? (
        <form className="feedback-form" onSubmit={save} noValidate aria-busy={busy}>
          <div className="feedback-form__label-row">
            <label className="feedback-form__label" htmlFor={`edit-review-${review.id}`}>
              Редагування відгуку
            </label>
            <span className="feedback-form__counter">
              {text.length} / {MAX_REVIEW_LENGTH}
            </span>
          </div>

          <textarea
            id={`edit-review-${review.id}`}
            className={`feedback-form__textarea${error ? ' feedback-form__textarea--error' : ''}`}
            maxLength={MAX_REVIEW_LENGTH}
            value={text}
            disabled={busy}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError('');
            }}
          />

          <div className="feedback-item__action-row">
            <button type="submit" className="feedback-btn" disabled={busy}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <button
              type="button"
              className="feedback-btn feedback-btn--secondary"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setText(review.text);
                setError('');
              }}
            >
              Скасувати
            </button>
          </div>
        </form>
      ) : (
        <div className="feedback-item__action-row">
          <button
            type="button"
            className="feedback-btn feedback-btn--secondary"
            disabled={busy}
            onClick={() => {
              setText(review.text);
              setError('');
              setEditing(true);
            }}
          >
            Редагувати
          </button>
          <button
            type="button"
            className="feedback-btn feedback-btn--danger"
            disabled={busy}
            onClick={remove}
          >
            {busy ? 'Видалення…' : 'Видалити'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewActions;
