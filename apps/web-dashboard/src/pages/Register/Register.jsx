import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { apiErrorMessage } from '../../services/apiError';
import './Register.css';

function Register() {
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateValue(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError('');

    if (!values.firstName.trim() || !values.lastName.trim()) {
      setError('Вкажи ім’я та прізвище.');
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
      setError(
        apiErrorMessage(failure, 'Не вдалося зареєструватися.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      <section
        className="register-card"
        aria-labelledby="register-title"
      >
        {created ? (
          <>
            <span className="register-card__success-icon" aria-hidden="true">
              ✓
            </span>

            <p className="register-card__eyebrow">Приємно познайомитися</p>
            <h1 id="register-title">Твій акаунт готовий</h1>

            <p className="register-card__intro" role="status">
              Реєстрація успішна. Тепер увійди зі своїм email і паролем.
            </p>

            <Link
              className="register-card__submit register-card__login-link"
              to="/login"
              state={{ email: values.email.trim() }}
            >
              Перейти до входу ↗
            </Link>
          </>
        ) : (
          <>
            <p className="register-card__eyebrow">Смаки починаються з тебе</p>
            <h1 id="register-title">Познайомимось?</h1>

            <p className="register-card__intro">
              Створи акаунт SmartMenu — попереду ще багато смачних відкриттів.
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
                      value={values.lastName}
                      onChange={updateValue}
                    />
                  </div>
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
                    placeholder="you@example.com"
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
                      aria-describedby="register-password-hint"
                      value={values.password}
                      onChange={updateValue}
                    />

                    <button
                      className="register-form__visibility"
                      type="button"
                      aria-controls="register-password register-confirm-password"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? 'Сховати' : 'Показати'}
                    </button>
                  </div>

                  <p
                    className="register-form__hint"
                    id="register-password-hint"
                  >
                    Від 8 до 128 символів.
                  </p>
                </div>

                <div className="register-form__field">
                  <label htmlFor="register-confirm-password">
                    Повтори пароль
                  </label>
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
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
              Уже маєш акаунт? <Link to="/login">Увійти</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default Register;