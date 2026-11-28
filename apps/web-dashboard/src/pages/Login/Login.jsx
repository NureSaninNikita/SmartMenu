import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SmartMenuMark } from '../../components/Header/Header';
import authService from '../../services/authService';
import { apiErrorMessage } from '../../services/apiError';
import './Login.css';

function EyeIcon({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.58 10.58A2 2 0 0013.42 13.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.88 5.09A10.9 10.9 0 0112 4.9c5 0 9.27 3.11 11 7.5a11.8 11.8 0 01-4.08 5.29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.61 6.61A11.8 11.8 0 001 12.4c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function Login({ isModal = false, initialEmail = '', onClose, onSwitchToRegister }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState(() => initialEmail || location.state?.email || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function closeDialog() {
    if (onClose) onClose();
    else navigate('/');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    if (loginMethod === 'phone') {
      setError('Вхід за номером телефону з’явиться у наступному оновленні. Будь ласка, увійдіть через Email.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Вкажіть email та пароль.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const session = await authService.login({
        email: trimmedEmail,
        password,
      });

      if (isModal && onClose) {
        onClose();
        if (session.user.role === 'SystemAdmin') navigate('/admin');
        else if (session.user.role === 'RestaurantAdmin') navigate('/restaurant-admin');
        return;
      }

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
      setError(apiErrorMessage(failure, 'Не вдалося увійти.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={isModal ? 'auth-modal-backdrop' : 'auth-modal-backdrop auth-modal-backdrop--page'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <section className="login-card">
        <button
          type="button"
          className="login-card__close"
          aria-label="Закрити"
          onClick={closeDialog}
        >
          ×
        </button>

        <div className="login-card__brand">
          <SmartMenuMark />
          <span className="login-card__wordmark">
            Smart<span>Menu</span>
          </span>
        </div>

        <p className="sm-eyebrow">З поверненням</p>

        <h1 id="login-title" className="sm-serif">Увійти до профілю</h1>

        <p className="login-card__intro">
          Ваші вподобання та добірки вже чекають на вас.
        </p>

        <div className="login-method-toggle" role="tablist" aria-label="Спосіб входу">
          <button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'email'}
            className={
              loginMethod === 'email'
                ? 'login-method-toggle__btn login-method-toggle__btn--active'
                : 'login-method-toggle__btn'
            }
            onClick={() => {
              setLoginMethod('email');
              setError('');
            }}
          >
            Email
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'phone'}
            className={
              loginMethod === 'phone'
                ? 'login-method-toggle__btn login-method-toggle__btn--active'
                : 'login-method-toggle__btn'
            }
            onClick={() => {
              setLoginMethod('phone');
              setError('');
            }}
          >
            Телефон
          </button>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
          aria-busy={submitting}
        >
          <fieldset disabled={submitting}>
            {loginMethod === 'email' ? (
              <div className="login-form__field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={320}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                />
              </div>
            ) : (
              <div className="login-form__field">
                <label htmlFor="login-phone">Номер телефону</label>
                <input
                  id="login-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+380 67 123 45 67"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setError('');
                  }}
                />
              </div>
            )}

            <div className="login-form__field">
              <label htmlFor="login-password">Пароль</label>

              <div className="login-form__password">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required={loginMethod === 'email'}
                  placeholder="Щонайменше 8 символів"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                />

                <button
                  className="login-form__visibility"
                  type="button"
                  aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                  aria-controls="login-password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <EyeIcon visible={showPassword} />
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
          Уперше в SmartMenu?{' '}
          {onSwitchToRegister ? (
            <button
              type="button"
              className="login-card__switch-btn"
              onClick={onSwitchToRegister}
            >
              Створити акаунт
            </button>
          ) : (
            <Link to="/register" state={{ from: location.state?.from }}>
              Створити акаунт
            </Link>
          )}
        </p>
      </section>
    </div>
  );
}

export default Login;
