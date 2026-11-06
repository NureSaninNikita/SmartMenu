import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { apiErrorMessage } from '../../services/apiError';

function Register() {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateValue(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authService.register(values);
      setCreated(true);
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Не вдалося зареєструватися.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-stub page-stub--functional">
      <h1>Реєстрація</h1>
      {created ? (
        <p role="status">Акаунт створено. <Link to="/login">Увійти</Link></p>
      ) : (
        <form className="test-form" onSubmit={handleSubmit}>
          <label>Ім&apos;я <input name="firstName" required maxLength="100" value={values.firstName} onChange={updateValue} /></label>
          <label>Прізвище <input name="lastName" required maxLength="100" value={values.lastName} onChange={updateValue} /></label>
          <label>Email <input name="email" type="email" autoComplete="email" required maxLength="320" value={values.email} onChange={updateValue} /></label>
          <label>Пароль <input name="password" type="password" autoComplete="new-password" required minLength="8" maxLength="128" value={values.password} onChange={updateValue} /></label>
          <button type="submit" disabled={submitting}>{submitting ? 'Зберігаємо…' : 'Зареєструватися'}</button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      <nav className="page-stub__links" aria-label="Переходи зі сторінки реєстрації">
        <Link to="/login">Увійти</Link>
        <Link to="/">На головну</Link>
      </nav>
    </main>
  );
}

export default Register;
