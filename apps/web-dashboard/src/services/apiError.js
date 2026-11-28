export function apiErrorMessage(error, fallback) {
  if (!error) return fallback;

  if (!error.response) {
    if (error.code === 'ERR_CANCELED') {
      return '';
    }
    return 'Немає з’єднання із сервером. Перевірте інтернет та спробуйте ще раз.';
  }

  const { status, data: details } = error.response;
  const fieldErrors = details?.errors
    ? Object.values(details.errors).flat().filter(Boolean)
    : [];

  if (fieldErrors.length > 0) {
    return fieldErrors.join(' ');
  }

  if (details?.title) {
    return details.title;
  }

  if (status === 400) {
    return 'Перевірте коректність введених даних.';
  }
  if (status === 401) {
    return 'Потрібна авторизація. Увійдіть у свій акаунт і повторіть спробу.';
  }
  if (status === 403) {
    return 'У вас недостатньо прав для виконання цієї дії.';
  }
  if (status === 404) {
    return 'Запитуваний ресурс не знайдено.';
  }
  if (status === 409) {
    return 'Операція неможлива через поточний стан даних.';
  }
  if (status === 410) {
    return 'Заклад або страва наразі недоступні.';
  }
  if (status >= 500) {
    return 'Помилка на сервері. Спробуйте пізніше.';
  }

  return fallback;
}
