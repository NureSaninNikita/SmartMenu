import { useState } from 'react';
import { Link } from 'react-router-dom';
import './MenuDish.css';

function MenuDish({ dish }) {
  const [failedImage, setFailedImage] = useState(null);

  const hasImage = dish.imageUrl && failedImage !== dish.imageUrl;
  const isUnavailable = dish.status === 'Unavailable';

  const price = dish.price == null
    ? 'Ціну не вказано'
    : new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: dish.currency || 'UAH',
        maximumFractionDigits: 2,
      }).format(dish.price);

  return (
    <Link
      className={`menu-dish${isUnavailable ? ' menu-dish--unavailable' : ''}`}
      to={`/restaurants/${dish.restaurantId}/dishes/${dish.id}`}
    >
      <div className="menu-dish__image-container">
        {hasImage ? (
          <img
            className="menu-dish__image"
            src={dish.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setFailedImage(dish.imageUrl)}
          />
        ) : (
          <span className="menu-dish__placeholder" aria-label="Фото відсутнє">
            <span aria-hidden="true">🍽️</span>
          </span>
        )}
      </div>

      <div className="menu-dish__content">
        <h3 className="menu-dish__title">{dish.title}</h3>

        {dish.description?.trim() && (
          <p className="menu-dish__description">{dish.description}</p>
        )}

        {dish.weight != null && (
          <span className="menu-dish__weight">{dish.weight} г</span>
        )}

        {isUnavailable && (
          <span className="menu-dish__status">
            Тимчасово недоступна
          </span>
        )}
      </div>

      <div className="menu-dish__aside">
        <strong className="menu-dish__price">{price}</strong>
        <span className="menu-dish__arrow" aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}

export default MenuDish;