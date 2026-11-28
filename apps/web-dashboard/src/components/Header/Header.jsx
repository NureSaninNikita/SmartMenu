import { NavLink, useNavigate } from 'react-router-dom';
import './Header.css';

export function SmartMenuMark({ inverted = false }) {
  return (
    <svg
      className="sm-brand-mark"
      width="32"
      height="32"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="17"
        cy="19"
        r="12.5"
        stroke={inverted ? '#ffffff' : '#006d77'}
        strokeWidth="2.6"
      />
      <path
        d="M21.2 14.3C20.2 13.3 18.7 12.8 17 12.8C14.7 12.8 13.1 13.9 13.1 15.6C13.1 17.4 14.6 18.1 17.2 18.7C19.8 19.3 21.4 20.1 21.4 22.1C21.4 24 19.6 25.3 17 25.3C15 25.3 13.3 24.6 12.2 23.4"
        stroke={inverted ? '#ffffff' : '#006d77'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M27.5 4.5L28.7 7.8L32 9L28.7 10.2L27.5 13.5L26.3 10.2L23 9L26.3 7.8L27.5 4.5Z"
        fill="#f26b4f"
      />
    </svg>
  );
}

function Header({ session, onLogout, onOpenAuth }) {
  const navigate = useNavigate();

  const user = session?.user;
  const name = user?.firstName?.trim() || 'Кабінет';
  const initial = name.charAt(0).toLocaleUpperCase('uk-UA');

  function linkClass({ isActive }) {
    return isActive
      ? 'header__link header__link--active'
      : 'header__link';
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
          <SmartMenuMark />
          <span className="header__wordmark">
            Smart<span>Menu</span>
          </span>
        </NavLink>

        <nav className="header__nav" aria-label="Основна навігація">
          <NavLink to="/dishes" className={linkClass}>
            Страви
          </NavLink>

          <NavLink to="/restaurants" className={linkClass}>
            Ресторани
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
        </nav>

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
          ) : onOpenAuth ? (
            <button
              type="button"
              className="header__login-btn"
              onClick={() => onOpenAuth('login')}
            >
              Увійти
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive
                  ? 'header__login-btn header__login-btn--active'
                  : 'header__login-btn'
              }
            >
              Увійти
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
