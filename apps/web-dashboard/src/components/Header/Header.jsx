import { NavLink } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header__container">
        <NavLink to="/" className="header__logo" aria-label="SmartMenu — на головну">
        <img
            src="/logo.png"
            alt="SmartMenu"
            className="header__logo-image"
        />
        </NavLink>

        <nav className="header__nav" aria-label="Основна навігація">
          <NavLink
            to="/restaurants"
            className={({ isActive }) =>
              isActive ? 'header__link header__link--active' : 'header__link'
            }
          >
            Заклади
          </NavLink>

          <div className="header__auth">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? 'header__link header__link--active' : 'header__link'
              }
            >
              Увійти
            </NavLink>

            <NavLink
              to="/register"
              className={({ isActive }) =>
                isActive ? 'header__button header__button--active' : 'header__button'
              }
            >
              Реєстрація
              <span aria-hidden="true">↗</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;