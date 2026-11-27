import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import reviewService from '../../services/reviewService';
import { apiErrorMessage } from '../../services/apiError';
import './Feedback.css';

const MAX_REVIEW_LENGTH = 2000;

function DishReviewForm({ dishId, session, onChanged, onOpenAuth }) {
  const location = useLocation();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState(false);
  const [message, setMessage] = useState('');

  async function addReview(event) {
    event.preventDefault();
    if (busy) return;

    if (!session) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const trimmed = text.trim();
    setError('');
    setMessage('');
    setAuthError(false);

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
      await reviewService.createDishReview(dishId, trimmed);
      setText('');
      if (onChanged) {
        await onChanged();
      }
      setMessage('Відгук успішно опубліковано.');
    } catch (failure) {
      setAuthError(failure.response?.status === 401);
      setError(apiErrorMessage(failure, 'Не вдалося додати відгук.'));
    } finally {
      setBusy(false);
    }
  }

  const remainingExceeded = text.length > MAX_REVIEW_LENGTH;

  return (
    <div className="feedback-card">
      <form className="feedback-form" onSubmit={addReview} noValidate aria-busy={busy}>
        <div className="feedback-form__label-row">
          <label className="feedback-form__label" htmlFor={`dish-review-${dishId}`}>
            Написати відгук
          </label>
          <span
            className={`feedback-form__counter${remainingExceeded ? ' feedback-form__counter--limit' : ''}`}
          >
            {text.length} / {MAX_REVIEW_LENGTH}
          </span>
        </div>

        <textarea
          id={`dish-review-${dishId}`}
          className={`feedback-form__textarea${error ? ' feedback-form__textarea--error' : ''}`}
          maxLength={MAX_REVIEW_LENGTH}
          placeholder="Поділіться враженнями"
          value={text}
          disabled={busy}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError('');
            if (message) setMessage('');
          }}
        />

        {error && (
          <p className="feedback-alert feedback-alert--error" role="alert">
            {error}{' '}
            {authError && (
              onOpenAuth ? (
                <button type="button" className="feedback-inline-link" onClick={() => onOpenAuth('login')}>
                  Увійти знову
                </button>
              ) : (
                <Link to="/login" state={{ from: location }}>Увійти знову</Link>
              )
            )}
          </p>
        )}

        {message && (
          <p className="feedback-alert feedback-alert--success" role="status">
            {message}
          </p>
        )}

        <div className="feedback-form__actions">
          <button type="submit" className="feedback-btn" disabled={busy}>
            {busy ? 'Надсилання…' : 'Опублікувати відгук'}
          </button>

          {!session && (
            <span className="feedback-form__guest-hint">
              Щоб опублікувати відгук,{' '}
              {onOpenAuth ? (
                <>
                  <button type="button" className="feedback-inline-link" onClick={() => onOpenAuth('login')}>
                    увійдіть
                  </button>{' '}
                  або{' '}
                  <button type="button" className="feedback-inline-link" onClick={() => onOpenAuth('register')}>
                    зареєструйтеся
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" state={{ from: location }}>увійдіть</Link> або{' '}
                  <Link to="/register" state={{ from: location }}>зареєструйтеся</Link>
                </>
              )}
              . Чернетка збережеться.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default DishReviewForm;
