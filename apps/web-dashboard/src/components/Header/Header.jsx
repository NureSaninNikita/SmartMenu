import { NavLink, useNavigate } from 'react-router-dom';
import './Header.css';

function Header({ session, onLogout }) {
  const navigate = useNavigate();

  const user = session?.user;
  const name = user?.firstName?.trim() || 'Кабінет';
  const initial = name.charAt(0).toLocaleUpperCase('uk-UA');

  function linkClass({ isActive }) {
    return isActive
      ? 'header__link header__link--active'
      : 'header__link';
  }

  function buttonClass({ isActive }) {
    return isActive
      ? 'header__button header__button--active'
      : 'header__button';
  }

  function handleLogout() {
    onLogout();
    navigate('/', { replace: true });
  }

  return (
    <header className="header">
      <div className="header__container">
        <NavLink
          to="/"
          className="header__logo"
          aria-label="SmartMenu — на головну"
        >
          <img
            src="/logo.png"
            alt="SmartMenu"
            className="header__logo-image"
          />
        </NavLink>

        <nav className="header__nav" aria-label="Основна навігація">
          <NavLink to="/restaurants" className={linkClass}>
            Заклади
          </NavLink>

          {user?.role === 'SystemAdmin' && (
            <NavLink to="/admin" className={linkClass}>
              Адміністрування
            </NavLink>
          )}

          {user?.role === 'RestaurantAdmin' && (
            <NavLink to="/restaurant-admin" className={linkClass}>
              Керування закладом
            </NavLink>
          )}

          <div className="header__auth">
            {user ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    isActive
                      ? 'header__profile header__profile--active'
                      : 'header__profile'
                  }
                  aria-label={`Особистий кабінет: ${name}`}
                >
                  <span className="header__avatar" aria-hidden="true">
                    {initial}
                  </span>
                  <span className="header__user-name">{name}</span>
                </NavLink>

                <button
                  className="header__logout"
                  type="button"
                  onClick={handleLogout}
                >
                  Вийти
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Увійти
                </NavLink>

                <NavLink to="/register" className={buttonClass}>
                  Реєстрація
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;