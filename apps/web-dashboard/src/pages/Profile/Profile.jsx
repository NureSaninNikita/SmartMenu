import { Link } from 'react-router-dom';

function Profile({ session }) {
  const user = session.user;
  return (
    <main className="page-stub page-stub--functional">
      <h1>Особистий кабінет</h1>
      <p>{user.firstName} {user.lastName}</p>
      <p>Email: {user.email || 'Не вказано'}</p>
      <p>Роль: {user.role}</p>
      {user.restaurantIds?.length > 0 && <p>Заклади: {user.restaurantIds.join(', ')}</p>}

      <nav className="page-stub__links" aria-label="Розділи кабінету">
        {user.role === 'RestaurantAdmin' && <Link to="/restaurant-admin">Керування закладом</Link>}
        {user.role === 'SystemAdmin' && <Link to="/admin">Адміністрування</Link>}
        <Link to="/">На головну</Link>
      </nav>
    </main>
  );
}

export default Profile;
