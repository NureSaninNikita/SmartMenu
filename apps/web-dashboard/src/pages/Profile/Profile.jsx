import { Link } from 'react-router-dom';

function Profile() {
  return (
    <main className="page-stub">
      <h1>Особистий кабінет</h1>

      <p>------</p>

      <nav className="page-stub__links" aria-label="Розділи кабінету">
        <Link to="/restaurant-admin">Керування закладом</Link>
        <Link to="/">На головну</Link>
      </nav>
    </main>
  );
}

export default Profile;