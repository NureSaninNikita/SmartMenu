import { Link, useSearchParams } from 'react-router-dom';
import AdminRestaurants from './AdminRestaurants';
import AdminAccounts from './AdminAccounts';
import './SystemAdmin.css';

function SystemAdmin({ currentUserId }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const section = searchParams.get('section') === 'accounts'
    ? 'accounts'
    : 'restaurants';

  function changeSection(nextSection) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (nextSection === 'accounts') {
        next.set('section', 'accounts');
      } else {
        next.delete('section');
      }

      return next;
    });
  }

  return (
    <main className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Керування SmartMenu</p>
          <h1>Системна панель</h1>
          <p className="admin-page__intro">
            Заклади, користувачі та доступ до платформи.
          </p>
        </div>

        <Link className="admin-button" to="/profile">
          До кабінету ↗
        </Link>
      </header>

      <nav className="admin-page__navigation" aria-label="Розділи адміністрування">
        <button
          className={`admin-page__section-button${
            section === 'restaurants'
              ? ' admin-page__section-button--active'
              : ''
          }`}
          type="button"
          aria-current={section === 'restaurants' ? 'page' : undefined}
          onClick={() => changeSection('restaurants')}
        >
          Заклади
        </button>

        <button
          className={`admin-page__section-button${
            section === 'accounts'
              ? ' admin-page__section-button--active'
              : ''
          }`}
          type="button"
          aria-current={section === 'accounts' ? 'page' : undefined}
          onClick={() => changeSection('accounts')}
        >
          Акаунти
        </button>
      </nav>

      {section === 'restaurants' ? (
        <AdminRestaurants />
      ) : (
        <AdminAccounts currentUserId={currentUserId} />
      )}
    </main>
  );
}

export default SystemAdmin;