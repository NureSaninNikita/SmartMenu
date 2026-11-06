import { NavLink } from 'react-router-dom';
import './Header.css';

function Header({ session, onLogout }) {
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
            {session ? (
              <>
                <NavLink to="/profile" className="header__link">{session.user.firstName}</NavLink>
                {session.user.role === 'SystemAdmin' && <NavLink to="/admin" className="header__link">Адміністрування</NavLink>}
                <button type="button" onClick={onLogout}>Вийти</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="header__link">Увійти</NavLink>
                <NavLink to="/register" className="header__button">Реєстрація</NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
