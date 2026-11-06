import { useState } from 'react';

function RestaurantForm({ restaurant = null, pending, onSave, onCancel }) {
  const isEditing = restaurant !== null;

  const [values, setValues] = useState({
    name: restaurant?.name || '',
    address: restaurant?.address || '',
    city: restaurant?.city || '',
    description: restaurant?.description || '',
    phoneNumber: restaurant?.phoneNumber || '',
    email: restaurant?.email || '',
    status: restaurant?.status || 'Pending',
  });

  const [error, setError] = useState('');

  function updateValue(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (pending) return;

    if (!values.name.trim() || !values.address.trim()) {
      setError('Вкажи назву та адресу закладу.');
      return;
    }

    const statusChangedToInactive =
      isEditing &&
      restaurant.status !== 'Inactive' &&
      values.status === 'Inactive';

    if (
      statusChangedToInactive &&
      !window.confirm(
        `Деактивувати заклад «${values.name.trim()}»? ` +
        'Він стане недоступним для гостей.'
      )
    ) {
      return;
    }

    onSave({
      name: values.name.trim(),
      address: values.address.trim(),
      city: values.city.trim() || null,
      description: values.description.trim() || null,
      phoneNumber: values.phoneNumber.trim() || null,
      email: values.email.trim() || null,
      status: values.status,

      // Зберігаємо поля, які ця форма поки не редагує.
      latitude: restaurant?.latitude ?? null,
      longitude: restaurant?.longitude ?? null,
      logoUrl: restaurant?.logoUrl ?? null,
      openingHoursJson: restaurant?.openingHoursJson ?? null,
    });
  }

  return (
    <section
      className="admin-editor"
      aria-labelledby="restaurant-form-title"
    >
      <header className="admin-editor__heading">
        <div>
          <p className="admin-page__eyebrow">
            {isEditing ? 'Редагування' : 'Новий заклад'}
          </p>

          <h2 id="restaurant-form-title">
            {isEditing ? restaurant.name : 'Додати заклад'}
          </h2>
        </div>
      </header>

      <form
        className="admin-form"
        onSubmit={handleSubmit}
        aria-busy={pending}
      >
        <fieldset disabled={pending}>
          <div className="admin-form__grid">
            <div className="admin-form__field">
              <label htmlFor="restaurant-name">Назва *</label>
              <input
                id="restaurant-name"
                name="name"
                required
                value={values.name}
                onChange={updateValue}
              />
            </div>

            <div className="admin-form__field">
              <label htmlFor="restaurant-city">Місто</label>
              <input
                id="restaurant-city"
                name="city"
                value={values.city}
                onChange={updateValue}
              />
            </div>

            <div className="admin-form__field admin-form__field--wide">
              <label htmlFor="restaurant-address">Адреса *</label>
              <input
                id="restaurant-address"
                name="address"
                required
                value={values.address}
                onChange={updateValue}
              />
            </div>

            <div className="admin-form__field">
              <label htmlFor="restaurant-phone">Телефон</label>
              <input
                id="restaurant-phone"
                name="phoneNumber"
                type="tel"
                value={values.phoneNumber}
                onChange={updateValue}
              />
            </div>

            <div className="admin-form__field">
              <label htmlFor="restaurant-email">Email</label>
              <input
                id="restaurant-email"
                name="email"
                type="email"
                value={values.email}
                onChange={updateValue}
              />
            </div>

            <div className="admin-form__field admin-form__field--wide">
              <label htmlFor="restaurant-description">Опис</label>
              <textarea
                id="restaurant-description"
                name="description"
                rows={4}
                value={values.description}
                onChange={updateValue}
              />
            </div>

            <div className="admin-form__field">
              <label htmlFor="restaurant-status">Статус</label>
              <select
                id="restaurant-status"
                name="status"
                value={values.status}
                onChange={updateValue}
              >
                <option value="Pending">Очікує активації</option>
                <option value="Active">Активний</option>
                <option value="Inactive">Неактивний</option>
              </select>
            </div>
          </div>

          <p className="admin-form__hint">* Обов’язкові поля.</p>

          {error && (
            <p className="admin-message admin-message--error" role="alert">
              {error}
            </p>
          )}

          <div className="admin-form__actions">
            <button className="admin-button admin-button--primary" type="submit">
              {pending
                ? 'Зберігаємо…'
                : isEditing
                  ? 'Зберегти зміни'
                  : 'Створити заклад'}
            </button>

            <button
              className="admin-button"
              type="button"
              onClick={onCancel}
            >
              Скасувати
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}

export default RestaurantForm;