import './DishCard.css';
import { Link } from 'react-router-dom';

function DishCard({ dish }) {
  const price = dish.price == null
    ? null
    : new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: dish.currency,
        maximumFractionDigits: 2,
      }).format(dish.price);

  return (
    <Link
        to={`/restaurants/${dish.restaurantId}/dishes/${dish.id}`}
        className="dish-card"
        >
      <div className="dish-card__heading">
        <span>{dish.restaurantName}</span>
        <span className="dish-card__category">{dish.category}</span>
      </div>

      <div className="dish-card__image-container">
        {dish.imageUrl ? (
          <img
            className="dish-card__image"
            src={dish.imageUrl}
            alt={dish.title}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : (
          <span className="dish-card__image-placeholder">Фото відсутнє</span>
        )}
      </div>

      <div className="dish-card__content">
        <h2 className="dish-card__title">{dish.title}</h2>

        {dish.description && (
          <p className="dish-card__description">{dish.description}</p>
        )}

        <div className="dish-card__bottom">
          <strong className="dish-card__price">
            {price ?? 'Ціну не вказано'}
          </strong>

          {dish.weight && (
            <span className="dish-card__weight">{dish.weight}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default DishCard;