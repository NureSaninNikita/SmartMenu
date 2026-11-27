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
            alt={dish.title}
            loading="lazy"
            onError={() => setFailedImage(dish.imageUrl)}
          />
        ) : (
          <span className="menu-dish__placeholder">Фото відсутнє</span>
        )}

        {isUnavailable && (
          <span className="menu-dish__unavailable-badge">Недоступно</span>
        )}
      </div>

      <div className="menu-dish__content">
        {dish.category && (
          <span className="menu-dish__category">{dish.category}</span>
        )}

        <h3 className="menu-dish__title">{dish.title}</h3>

        {dish.description?.trim() && (
          <p className="menu-dish__description">{dish.description}</p>
        )}

        <div className="menu-dish__bottom">
          <div className="menu-dish__price-wrap">
            <strong className="menu-dish__price">{price}</strong>
            {dish.weight != null && (
              <span className="menu-dish__weight">{dish.weight} г</span>
            )}
          </div>

          <span
            className={`menu-dish__status${
              isUnavailable ? ' menu-dish__status--unavailable' : ' menu-dish__status--available'
            }`}
          >
            {isUnavailable ? 'Тимчасово недоступна' : 'Доступно зараз'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default MenuDish;
