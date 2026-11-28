import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PREFS_CHANGE_EVENT,
  readPreferences,
  toggleBlacklistDish,
  toggleWhitelistDish,
} from '../../services/preferencesStore';
import './DishCard.css';

function DishCard({ dish, variant = 'card', featured = false }) {
  const [failedImage, setFailedImage] = useState(null);
  const [prefs, setPrefs] = useState(readPreferences);

  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(PREFS_CHANGE_EVENT, sync);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, sync);
  }, []);

  const hasImage = Boolean(dish.imageUrl) && failedImage !== dish.imageUrl;
  const isUnavailable = dish.status === 'Unavailable';
  const isWhitelisted = prefs.whitelistDishes.some((d) => Number(d.id) === Number(dish.id));
  const isBlacklisted = prefs.blacklistDishes.some((d) => Number(d.id) === Number(dish.id));

  const price = dish.price == null
    ? null
    : new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: dish.currency || 'UAH',
        maximumFractionDigits: 2,
      }).format(dish.price);

  const cardClasses = [
    'dish-card',
    variant === 'list' ? 'dish-card--list' : '',
    featured ? 'dish-card--featured' : '',
    isUnavailable ? 'dish-card--unavailable' : '',
  ].filter(Boolean).join(' ');

  function handleHeartClick(event) {
    event.preventDefault();
    event.stopPropagation();
    setPrefs(toggleWhitelistDish(dish));
  }

  function handleHideClick(event) {
    event.preventDefault();
    event.stopPropagation();
    setPrefs(toggleBlacklistDish(dish));
  }

  return (
    <Link
      to={`/restaurants/${dish.restaurantId}/dishes/${dish.id}`}
      className={cardClasses}
    >
      {featured && (
        <div className="dish-card__featured-head">
          <span className="dish-card__featured-restaurant">{dish.restaurantName}</span>
          {dish.category && (
            <span className="dish-card__featured-pill">{dish.category}</span>
          )}
        </div>
      )}

      <div className="dish-card__image-container">
        {hasImage ? (
          <img
            className="dish-card__image"
            src={dish.imageUrl}
            alt={dish.title}
            loading="lazy"
            onError={() => setFailedImage(dish.imageUrl)}
          />
        ) : (
          <span className="dish-card__image-placeholder">Фото відсутнє</span>
        )}

        {!featured && (
          <button
            type="button"
            className={`dish-card__heart${isWhitelisted ? ' dish-card__heart--active' : ''}`}
            aria-label={isWhitelisted ? 'Прибрати з обраного' : 'До обраного'}
            aria-pressed={isWhitelisted}
            onClick={handleHeartClick}
          >
            {isWhitelisted ? '♥' : '♡'}
          </button>
        )}

        {isUnavailable && (
          <span className="dish-card__unavailable-badge">Недоступно</span>
        )}
      </div>

      <div className="dish-card__content">
        {!featured && dish.category && (
          <span className="dish-card__category">{dish.category}</span>
        )}

        <h3 className="dish-card__title">{dish.title}</h3>

        {!featured && dish.description && (
          <p className="dish-card__description">{dish.description}</p>
        )}

        {!featured && dish.restaurantName && (
          <span className="dish-card__restaurant">{dish.restaurantName}</span>
        )}

        <div className="dish-card__bottom">
          <div className="dish-card__price-wrap">
            <strong className="dish-card__price">
              {price ?? 'Ціну не вказано'}
            </strong>

            {dish.weight != null && (
              <span className="dish-card__weight">{dish.weight} г</span>
            )}
          </div>

          <div className="dish-card__meta-right">
            {dish.averageRating != null && dish.ratingCount > 0 && (
              <span className="dish-card__rating">
                <span aria-hidden="true">★</span>{' '}
                {new Intl.NumberFormat('uk-UA', {
                  maximumFractionDigits: 1,
                }).format(dish.averageRating)}
              </span>
            )}
          </div>
        </div>

        {variant === 'list' && !featured && (
          <div className="dish-card__list-actions">
            <button
              type="button"
              className="dish-card__text-action"
              onClick={handleHeartClick}
            >
              {isWhitelisted ? 'У білому списку' : 'До білого списку'}
            </button>
            <button
              type="button"
              className="dish-card__text-action dish-card__text-action--danger"
              onClick={handleHideClick}
            >
              {isBlacklisted ? 'У чорному списку' : 'Не показувати цю страву'}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}

export default DishCard;
