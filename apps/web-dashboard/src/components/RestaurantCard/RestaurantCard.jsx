import { Link } from 'react-router-dom';
import './RestaurantCard.css';

function RestaurantCard({ restaurant }) {
  return (
    <article className="restaurant-card">
      <div className="restaurant-card__heading">
        <span className="restaurant-card__icon" aria-hidden="true">
          🍽️
        </span>

        {restaurant.city && (
          <Link
            className="restaurant-card__city"
            to={{
              pathname: '/restaurants',
              search: `?${new URLSearchParams({
                city: restaurant.city,
              })}`,
            }}
          >
            {restaurant.city}
          </Link>
        )}
      </div>

      <h3 className="restaurant-card__name">
        <Link
          className="restaurant-card__link"
          to={`/restaurants/${restaurant.id}`}
        >
          {restaurant.name}
        </Link>
      </h3>

      <p className="restaurant-card__description">
        {restaurant.description?.trim() ||
          'Познайомся із закладом та його меню.'}
      </p>

      {restaurant.address && (
        <p className="restaurant-card__address">
          {restaurant.address}
        </p>
      )}

      <div className="restaurant-card__footer" aria-hidden="true">
        <span>Переглянути меню</span>
        <span>↗</span>
      </div>
    </article>
  );
}

export default RestaurantCard;