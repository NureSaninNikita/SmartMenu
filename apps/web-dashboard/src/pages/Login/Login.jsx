import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { apiErrorMessage } from '../../services/apiError';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const session = await authService.login({
        email: email.trim(),
        password,
      });

      const from = location.state?.from;
      const pathname = from?.pathname;

      const canReturn =
        typeof pathname === 'string' &&
        pathname.startsWith('/') &&
        !pathname.startsWith('//') &&
        pathname !== '/login' &&
        pathname !== '/register';

      const defaultDestination =
        session.user.role === 'SystemAdmin'
          ? '/admin'
          : session.user.role === 'RestaurantAdmin'
            ? '/restaurant-admin'
            : '/profile';

      const destination = canReturn
        ? {
            pathname,
            search: from.search || '',
            hash: from.hash || '',
          }
        : defaultDestination;

      navigate(destination, { replace: true });
    } catch (failure) {
      setError(
        apiErrorMessage(failure, 'Не вдалося увійти.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="login-card__eyebrow">Раді бачити знову</p>

        <h1 id="login-title">Повертаємося до смачного?</h1>

        <p className="login-card__intro">
          Увійди у свій акаунт SmartMenu.
        </p>

        <form
          className="login-form"
          onSubmit={handleSubmit}
          aria-busy={submitting}
        >
          <fieldset disabled={submitting}>
            <div className="login-form__field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={320}
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
              />
            </div>

            <div className="login-form__field">
              <label htmlFor="login-password">Пароль</label>

              <div className="login-form__password">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                />

                <button
                  className="login-form__visibility"
                  type="button"
                  aria-controls="login-password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Сховати' : 'Показати'}
                </button>
              </div>
            </div>

            {error && (
              <p className="login-form__error" role="alert">
                {error}
              </p>
            )}

            <button className="login-card__submit" type="submit">
              {submitting ? 'Входимо…' : 'Увійти'}
            </button>
          </fieldset>
        </form>

        <p className="login-card__footer">
          Ще немає акаунта?{' '}
          <Link to="/register" state={{ from: location.state?.from }}>
            Зареєструватися
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;