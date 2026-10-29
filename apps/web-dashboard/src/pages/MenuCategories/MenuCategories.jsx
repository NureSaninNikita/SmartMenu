import { Link } from 'react-router-dom';

function MenuCategories() {
  return (
    <main className="page-stub">
      <h1>Категорії меню</h1>

      <nav className="page-stub__links" aria-label="Переходи з категорій меню">
        <Link to="/restaurant-admin">До панелі закладу</Link>
      </nav>
    </main>
  );
}

export default MenuCategories;