import { Link } from 'react-router-dom';

function Register() {
  return (
    <main className="page-stub">
      <h1>Реєстрація</h1>

      <nav className="page-stub__links" aria-label="Переходи зі сторінки реєстрації">
        <Link to="/login">Увійти</Link>
        <Link to="/">На головну</Link>
        <Link to="/profile">До кабінету</Link>
      </nav>
    </main>
  );
}

export default Register;