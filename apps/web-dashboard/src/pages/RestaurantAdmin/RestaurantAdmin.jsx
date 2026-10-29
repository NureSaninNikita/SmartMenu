import { Link } from 'react-router-dom';

function RestaurantAdmin() {
  return (
    <main className="page-stub">
      <h1>Панель закладу</h1>

      <nav className="page-stub__links" aria-label="Керування закладом">
        <Link to="/">На головну</Link>
        <Link to="/restaurant-admin/categories">Категорії меню</Link>
        <Link to="/profile">До кабінету</Link>
      </nav>
    </main>
  );
}

export default RestaurantAdmin;