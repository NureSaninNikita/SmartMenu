import { Link } from 'react-router-dom';

function RestaurantAdmin() {
  return (
    <main className="page-stub">
      <h1>Панель закладу</h1>

      <nav className="page-stub__links" aria-label="Керування закладом">
        <Link to="/">На головну</Link>
        <Link to="/restaurant-admin/categories">Категорії меню</Link>
        <Link to="/restaurant-admin/dishes">Страви та фото</Link>
        <Link to="/profile">До кабінету</Link>
        <Link to="/restaurant-admin/availability">Стоп-лист страв</Link>
      </nav>
    </main>
  );
}

export default RestaurantAdmin;
