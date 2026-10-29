import { Link } from 'react-router-dom';

function Login() {
  return (
    <main className="page-stub">
      <h1>Вхід</h1>

      <nav className="page-stub__links" aria-label="Переходи зі сторінки входу">
        <Link to="/register">Зареєструватися</Link>
        <Link to="/">На головну</Link>
        <Link to="/profile">До кабінету</Link>
      </nav>
    </main>
  );
}

export default Login;