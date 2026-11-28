import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import dishRatingService from '../../services/dishRatingService';
import { apiErrorMessage } from '../../services/apiError';
import '../Feedback/Feedback.css';

const STARS = [1, 2, 3, 4, 5];

function StarSvg({ filled }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5l2.92 5.92 6.53.95-4.72 4.6 1.11 6.5L12 17.4l-5.84 3.07 1.11-6.5-4.72-4.6 6.53-.95L12 2.5z"
        fill={filled ? '#eaa42a' : 'none'}
        stroke={filled ? '#eaa42a' : '#aeb9b7'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DishRating({ dishId, session, onChanged, onOpenAuth }) {
  const location = useLocation();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadMine() {
      await Promise.resolve();
      if (!active) return;
      setError('');
      setMessage('');
      setAuthError(false);

      if (!session) {
        setRating(0);
        return;
      }

      try {
        const result = await dishRatingService.getMine(dishId);
        if (active) setRating(Number(result.value) || 0);
      } catch (failure) {
        if (!active) return;
        setAuthError(failure.response?.status === 401);
        setError(apiErrorMessage(failure, 'Не вдалося завантажити вашу оцінку.'));
      }
    }

    loadMine();
    return () => { active = false; };
  }, [dishId, session]);

  async function saveRating(event) {
    event.preventDefault();
    if (busy) return;

    if (!session) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    setError('');
    setMessage('');
    setAuthError(false);

    const numericValue = Number(rating);
    if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 5) {
      setError('Оберіть оцінку від 1 до 5.');
      return;
    }

    setBusy(true);
    try {
      await dishRatingService.setMine(dishId, numericValue);
      setMessage('Оцінку збережено.');
      if (onChanged) {
        await onChanged();
      }
    } catch (failure) {
      setAuthError(failure.response?.status === 401);
      setError(apiErrorMessage(failure, 'Не вдалося зберегти оцінку.'));
    } finally {
      setBusy(false);
    }
  }

  const displayValue = hovered || rating;
  const isReady = rating > 0;

  return (
    <div className="feedback-rating-inline">
      <form className="feedback-rating-inline__form" onSubmit={saveRating} noValidate aria-busy={busy}>
        <span className="feedback-rating-inline__label">Ваша оцінка</span>

        <div className="feedback-rating-inline__stars" role="radiogroup" aria-label="Оцінка від 1 до 5">
          {STARS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} з 5`}
              className="feedback-star-icon-btn"
              disabled={busy}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => {
                setRating(value);
                setError('');
                setMessage('');
              }}
            >
              <StarSvg filled={value <= displayValue} />
            </button>
          ))}
        </div>

        <button
          type="submit"
          className={`feedback-rating-inline__submit${isReady ? ' feedback-rating-inline__submit--ready' : ''}`}
          disabled={busy || (Boolean(session) && !isReady)}
        >
          {busy ? 'Збереження…' : 'Зберегти оцінку'}
        </button>
      </form>

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
    </div>
  );
}

export default DishRating;
