import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SmartMenuMark } from '../../components/Header/Header';
import authService from '../../services/authService';
import { apiErrorMessage } from '../../services/apiError';
import './Register.css';

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

function Register({ isModal = false, onClose, onSwitchToLogin }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function closeDialog() {
    if (onClose) onClose();
    else navigate('/');
  }

  function updateValue(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError('');

    if (!values.firstName.trim() || !values.lastName.trim()) {
      setError('Вкажіть ім’я та прізвище.');
      return;
    }

    if (values.password.length < 8) {
      setError('Пароль повинен містити щонайменше 8 символів.');
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError('Паролі не збігаються.');
      return;
    }

    setSubmitting(true);

    try {
      await authService.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      setValues((current) => ({
        ...current,
        password: '',
        confirmPassword: '',
      }));

      setCreated(true);
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося зареєструватися.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={isModal ? 'auth-modal-backdrop' : 'auth-modal-backdrop auth-modal-backdrop--page'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <section className="register-card">
        <button
          type="button"
          className="register-card__close"
          aria-label="Закрити"
          onClick={closeDialog}
        >
          ×
        </button>

        <div className="register-card__brand">
          <SmartMenuMark />
          <span className="register-card__wordmark">
            Smart<span>Menu</span>
          </span>
        </div>

        {created ? (
          <>
            <span className="register-card__success-icon" aria-hidden="true">
              ✓
            </span>

            <p className="sm-eyebrow">Приємно познайомитися</p>
            <h1 id="register-title" className="sm-serif">Ваш акаунт готовий</h1>

            <p className="register-card__intro" role="status">
              Реєстрація успішна. Тепер увійдіть зі своїм email і паролем.
            </p>

            {onSwitchToLogin ? (
              <button
                type="button"
                className="register-card__submit"
                onClick={() => onSwitchToLogin(values.email.trim())}
              >
                Перейти до входу →
              </button>
            ) : (
              <Link
                className="register-card__submit register-card__login-link"
                to="/login"
                state={{ email: values.email.trim() }}
              >
                Перейти до входу →
              </Link>
            )}
          </>
        ) : (
          <>
            <p className="sm-eyebrow">Приємно познайомитися</p>
            <h1 id="register-title" className="sm-serif">Створити акаунт</h1>

            <p className="register-card__intro">
              Один крок до персональних рекомендацій.
            </p>

            <form
              className="register-form"
              onSubmit={handleSubmit}
              aria-busy={submitting}
            >
              <fieldset disabled={submitting}>
                <div className="register-form__names">
                  <div className="register-form__field">
                    <label htmlFor="register-first-name">Ім’я</label>
                    <input
                      id="register-first-name"
                      name="firstName"
                      autoComplete="given-name"
                      required
                      maxLength={100}
                      placeholder="Як до вас звертатися?"
                      value={values.firstName}
                      onChange={updateValue}
                    />
                  </div>

                  <div className="register-form__field">
                    <label htmlFor="register-last-name">Прізвище</label>
                    <input
                      id="register-last-name"
                      name="lastName"
                      autoComplete="family-name"
                      required
                      maxLength={100}
                      placeholder="Ваше прізвище"
                      value={values.lastName}
                      onChange={updateValue}
                    />
                  </div>
                </div>

                <div className="register-form__field">
                  <label htmlFor="register-phone">Номер телефону (необов’язково)</label>
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+380 67 123 45 67"
                    value={values.phone}
                    onChange={updateValue}
                  />
                </div>

                <div className="register-form__field">
                  <label htmlFor="register-email">Email</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={320}
                    placeholder="name@example.com"
                    value={values.email}
                    onChange={updateValue}
                  />
                </div>

                <div className="register-form__field">
                  <label htmlFor="register-password">Пароль</label>

                  <div className="register-form__password">
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Щонайменше 8 символів"
                      value={values.password}
                      onChange={updateValue}
                    />

                    <button
                      className="register-form__visibility"
                      type="button"
                      aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                      aria-controls="register-password register-confirm-password"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </div>

                <div className="register-form__field">
                  <label htmlFor="register-confirm-password">
                    Підтвердьте пароль
                  </label>
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Повторіть пароль"
                    value={values.confirmPassword}
                    onChange={updateValue}
                  />
                </div>

                {error && (
                  <p className="register-form__error" role="alert">
                    {error}
                  </p>
                )}

                <button className="register-card__submit" type="submit">
                  {submitting ? 'Створюємо акаунт…' : 'Зареєструватися'}
                </button>
              </fieldset>
            </form>

            <p className="register-card__footer">
              Вже маєте акаунт?{' '}
              {onSwitchToLogin ? (
                <button
                  type="button"
                  className="register-card__switch-btn"
                  onClick={() => onSwitchToLogin()}
                >
                  Увійти
                </button>
              ) : (
                <Link to="/login">Увійти</Link>
              )}
            </p>
          </>
        )}
      </section>
    </div>
  );
}

export default Register;
