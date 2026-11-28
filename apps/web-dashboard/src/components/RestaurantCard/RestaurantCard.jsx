import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isRestaurantOpenNow } from '../../services/restaurantsService';
import {
  PREFS_CHANGE_EVENT,
  readPreferences,
  toggleBlacklistRestaurant,
  toggleWhitelistRestaurant,
} from '../../services/preferencesStore';
import './RestaurantCard.css';

function RestaurantCard({ restaurant, distanceKm = null }) {
  const [failedImage, setFailedImage] = useState(false);
  const [prefs, setPrefs] = useState(readPreferences);

  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(PREFS_CHANGE_EVENT, sync);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, sync);
  }, []);

  const imageSrc = restaurant.logoUrl || restaurant.previewImageUrl || null;
  const hasImage = Boolean(imageSrc) && !failedImage;
  const openNow = isRestaurantOpenNow(restaurant.openingHoursJson);
  const isWhitelisted = prefs.whitelistRestaurants.some(
    (r) => Number(r.id) === Number(restaurant.id)
  );
  const isBlacklisted = prefs.blacklistRestaurants.some(
    (r) => Number(r.id) === Number(restaurant.id)
  );

  function handleHeart(event) {
    event.preventDefault();
    event.stopPropagation();
    setPrefs(toggleWhitelistRestaurant(restaurant));
  }

  function handleHide(event) {
    event.preventDefault();
    event.stopPropagation();
    setPrefs(toggleBlacklistRestaurant(restaurant));
  }

  return (
    <article className="restaurant-card">
      <div className="restaurant-card__media">
        {hasImage ? (
          <img
            src={imageSrc}
            alt={restaurant.name}
            className="restaurant-card__image"
            loading="lazy"
            onError={() => setFailedImage(true)}
          />
        ) : (
          <div className="restaurant-card__placeholder">
            <span>Фото відсутнє</span>
          </div>
        )}

        {restaurant.city && (
          <Link
            className="restaurant-card__city-badge"
            to={{
              pathname: '/restaurants',
              search: `?${new URLSearchParams({ city: restaurant.city })}`,
            }}
          >
            {restaurant.city}
          </Link>
        )}

        <button
          type="button"
          className={`restaurant-card__heart${isWhitelisted ? ' restaurant-card__heart--active' : ''}`}
          aria-label={isWhitelisted ? 'Прибрати заклад з обраного' : 'Додати заклад до обраного'}
          aria-pressed={isWhitelisted}
          onClick={handleHeart}
        >
          {isWhitelisted ? '♥' : '♡'}
        </button>
      </div>

      <div className="restaurant-card__body">
        <div className="restaurant-card__top-meta">
          <span className="restaurant-card__eyebrow">
            {restaurant.city || 'Заклад'}
          </span>
        </div>

        <h3 className="restaurant-card__name">
          <Link
            className="restaurant-card__link"
            to={`/restaurants/${restaurant.id}`}
          >
            {restaurant.name}
          </Link>
        </h3>

        {restaurant.address && (
          <p className="restaurant-card__address">
            {restaurant.city ? `${restaurant.city}, ` : ''}
            {restaurant.address}
          </p>
        )}

        <div className="restaurant-card__footer">
          <div className="restaurant-card__meta-left">
            {distanceKm != null && (
              <span className="restaurant-card__distance">◎ {distanceKm.toFixed(1)} км</span>
            )}
            <span
              className={`restaurant-card__status${
                openNow === false ? ' restaurant-card__status--closed' : ' restaurant-card__status--open'
              }`}
            >
              {openNow === false ? 'Зачинено' : 'Відкрито'}
            </span>
          </div>

          <div className="restaurant-card__footer-right">
            <button
              type="button"
              className="restaurant-card__hide-btn"
              onClick={handleHide}
            >
              {isBlacklisted ? 'Приховано' : 'Не показувати'}
            </button>
            <span className="restaurant-card__arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default RestaurantCard;
