import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { apiErrorMessage } from '../../services/apiError';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const session = await authService.login({ email, password });
      const destination = location.state?.from?.pathname ||
        (session.user.role === 'SystemAdmin' ? '/admin' :
          session.user.role === 'RestaurantAdmin' ? '/restaurant-admin' : '/profile');
      navigate(destination, { replace: true });
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося увійти.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-stub page-stub--functional">
      <h1>Вхід</h1>
      <form className="test-form" onSubmit={handleSubmit}>
        <label>Email <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Пароль <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button type="submit" disabled={submitting}>{submitting ? 'Входимо…' : 'Увійти'}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <nav className="page-stub__links" aria-label="Переходи зі сторінки входу">
        <Link to="/register">Зареєструватися</Link>
        <Link to="/">На головну</Link>
      </nav>
    </main>
  );
}

export default Login;
