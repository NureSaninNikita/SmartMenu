import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import reviewService from '../../services/reviewService';
import { apiErrorMessage } from '../../services/apiError';
import ReviewActions from './ReviewActions';
import './Feedback.css';

const MAX_REVIEW_LENGTH = 2000;

function RestaurantReviews({ restaurantId, session, onCountChange, onOpenAuth }) {
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [authError, setAuthError] = useState(false);
  const [message, setMessage] = useState('');

  const loadReviews = useCallback(async () => {
    const result = await reviewService.getRestaurantReviews(restaurantId);
    setReviews(result);
    if (onCountChange) onCountChange(result.length);
  }, [restaurantId, onCountChange]);

  useEffect(() => {
    let active = true;

    async function fetchInitial() {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      setLoadError('');

      try {
        const result = await reviewService.getRestaurantReviews(restaurantId);
        if (!active) return;
        setReviews(result);
        if (onCountChange) onCountChange(result.length);
      } catch (failure) {
        if (active) {
          setLoadError(apiErrorMessage(failure, 'Не вдалося завантажити відгуки.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchInitial();
    return () => { active = false; };
  }, [restaurantId, onCountChange]);

  async function addReview(event) {
    event.preventDefault();
    if (busy) return;

    if (!session) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const trimmed = text.trim();
    setFormError('');
    setMessage('');
    setAuthError(false);

    if (!trimmed) {
      setFormError('Вкажіть текст відгуку.');
      return;
    }

    if (trimmed.length > MAX_REVIEW_LENGTH) {
      setFormError(`Відгук не може перевищувати ${MAX_REVIEW_LENGTH} символів.`);
      return;
    }

    setBusy(true);
    try {
      await reviewService.createRestaurantReview(restaurantId, trimmed);
      setText('');
      await loadReviews();
      setMessage('Відгук успішно опубліковано.');
    } catch (failure) {
      setAuthError(failure.response?.status === 401);
      setFormError(apiErrorMessage(failure, 'Не вдалося додати відгук.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="feedback-reviews-section" aria-label="Відгуки про заклад">
      <div className="feedback-reviews-section__head">
        <span className="sm-eyebrow">Думки гостей</span>
        <h2>Відгуки про ресторан</h2>
      </div>

      <div className="feedback-card">
        <form className="feedback-form" onSubmit={addReview} noValidate aria-busy={busy}>
          <div className="feedback-form__label-row">
            <label className="feedback-form__label" htmlFor={`restaurant-review-${restaurantId}`}>
              Написати відгук
            </label>
            <span
              className={`feedback-form__counter${text.length > MAX_REVIEW_LENGTH ? ' feedback-form__counter--limit' : ''}`}
            >
              {text.length} / {MAX_REVIEW_LENGTH}
            </span>
          </div>

          <textarea
            id={`restaurant-review-${restaurantId}`}
            className={`feedback-form__textarea${formError ? ' feedback-form__textarea--error' : ''}`}
            maxLength={MAX_REVIEW_LENGTH}
            placeholder="Поділіться враженнями"
            value={text}
            disabled={busy}
            aria-invalid={Boolean(formError)}
            onChange={(event) => {
              setText(event.target.value);
              if (formError) setFormError('');
              if (message) setMessage('');
            }}
          />

          {formError && (
            <p className="feedback-alert feedback-alert--error" role="alert">
              {formError}{' '}
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

      {loading ? (
        <div className="feedback-empty" role="status">
          <p>Завантажуємо відгуки…</p>
        </div>
      ) : loadError ? (
        <p className="feedback-alert feedback-alert--error" role="alert" style={{ marginTop: 18 }}>
          {loadError}
        </p>
      ) : reviews.length === 0 ? (
        <div className="feedback-empty">
          <h3 className="sm-serif">Відгуків поки немає</h3>
          <p>Станьте першим, хто поділиться враженнями про цей заклад.</p>
        </div>
      ) : (
        <ul className="feedback-list feedback-list--two-col">
          {reviews.map((review) => {
            const author = review.authorName?.trim() || 'Гість';
            const initial = author.charAt(0).toLocaleUpperCase('uk-UA');
            const dateIso = review.editedAt || review.createdAt;
            return (
              <li key={review.id} className="feedback-item">
                <div className="feedback-item__head">
                  <div className="feedback-item__author-wrap">
                    <span className="feedback-item__avatar" aria-hidden="true">
                      {initial}
                    </span>
                    <div>
                      <h3 className="feedback-item__author">{author}</h3>
                      <div className="feedback-item__meta">
                        <time dateTime={dateIso}>
                          {new Date(dateIso).toLocaleDateString('uk-UA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </time>
                        {review.editedAt && (
                          <span className="feedback-item__edited">змінено</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="feedback-item__text">{review.text}</p>

                <ReviewActions
                  review={review}
                  session={session}
                  onChanged={loadReviews}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default RestaurantReviews;
