import crypto from 'node:crypto';
import axios from 'axios';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = import.meta.env.VITE_SMARTMENU_API_URL;

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function expectHttpError(promise, expectedStatuses) {
  const allowed = Array.isArray(expectedStatuses)
    ? expectedStatuses
    : [expectedStatuses];

  try {
    await promise;
    expect.unreachable(`Expected request to fail with status ${allowed.join('/')}`);
  } catch (error) {
    expect(error.response).toBeDefined();
    expect(allowed).toContain(error.response.status);
    return error.response;
  }
}

describe('Task 3: Керування стравами (CRUD), валідація та права доступу', () => {
  let sysAdminToken = '';
  let userToken = '';
  let restaurantAdminToken = '';
  let ephemeralAdminId = null;

  let restaurantAId = null;
  let restaurantBId = null;
  let categoryAId = null;
  let foreignCategoryBId = null;
  let foreignDishBId = null;
  let existingIngredientIds = [];

  const createdDishIds = [];

  beforeAll(async () => {
    expect(API_URL, 'VITE_SMARTMENU_API_URL must be configured in .env.local').toBeTruthy();

    const [adminRes, userRes, restaurantsRes, ingredientsRes] = await Promise.all([
      axios.post(`${API_URL}/auth/login`, {
        email: import.meta.env.VITE_TEST_ADMIN_EMAIL,
        password: import.meta.env.VITE_TEST_ADMIN_PASSWORD,
      }),
      axios.post(`${API_URL}/auth/login`, {
        email: import.meta.env.VITE_TEST_USER_EMAIL,
        password: import.meta.env.VITE_TEST_USER_PASSWORD,
      }),
      axios.get(`${API_URL}/restaurants`),
      axios.get(`${API_URL}/ingredients`),
    ]);

    sysAdminToken = adminRes.data.token;
    userToken = userRes.data.token;
    existingIngredientIds = ingredientsRes.data.map((item) => item.id);

    const activeRestaurants = restaurantsRes.data;
    expect(activeRestaurants.length).toBeGreaterThanOrEqual(2);


    const restaurantMeta = await Promise.all(
      activeRestaurants.slice(0, 8).map(async (restaurant) => {
        const [filtersRes, dishesRes] = await Promise.all([
          axios.get(`${API_URL}/restaurants/${restaurant.id}/dish-filters`),
          axios.get(`${API_URL}/restaurants/${restaurant.id}/dishes`, {
            params: { page: 1, pageSize: 5 },
          }),
        ]);
        return {
          id: restaurant.id,
          categories: filtersRes.data.categories || [],
          dishes: dishesRes.data.items || [],
        };
      })
    );

    const withDishes = restaurantMeta.filter((r) => r.categories.length > 0 && r.dishes.length > 0);
    const first = withDishes[0] || restaurantMeta[0];
    const second = withDishes.find((r) => r.id !== first.id) || restaurantMeta.find((r) => r.id !== first.id);

    restaurantAId = first.id;
    restaurantBId = second.id;
    foreignCategoryBId = second.categories[0]?.id ?? null;
    foreignDishBId = second.dishes[0]?.id ?? null;

    const uniqueEmail = `qa.dish.${Date.now()}.${crypto.randomInt(1000, 9999)}@example.com`;
    const runtimeSecret = `Qa!${crypto.randomBytes(12).toString('hex')}`;

    const regRes = await axios.post(`${API_URL}/auth/register`, {
      firstName: 'QA',
      lastName: 'DishAdmin',
      email: uniqueEmail,
      password: runtimeSecret,
    });
    ephemeralAdminId = regRes.data.id;

    await axios.post(
      `${API_URL}/admin/users/${ephemeralAdminId}/restaurants/${restaurantAId}`,
      {},
      authHeaders(sysAdminToken)
    );

    const restAdminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: uniqueEmail,
      password: runtimeSecret,
    });
    restaurantAdminToken = restAdminLogin.data.token;


    const categoriesRes = await axios.get(
      `${API_URL}/admin/restaurants/${restaurantAId}/categories`,
      authHeaders(restaurantAdminToken)
    );
    if (categoriesRes.data.length > 0) {
      categoryAId = categoriesRes.data[0].id;
    } else {
      const createdCategory = await axios.post(
        `${API_URL}/admin/restaurants/${restaurantAId}/categories`,
        { name: `QA Категорія ${Date.now()}` },
        authHeaders(restaurantAdminToken)
      );
      categoryAId = createdCategory.data.id;
    }


    if (existingIngredientIds.length === 0) {
      const createdIngredient = await axios.post(
        `${API_URL}/ingredients`,
        { name: `QA Інгредієнт ${Date.now()}` },
        authHeaders(restaurantAdminToken)
      );
      existingIngredientIds = [createdIngredient.data.id];
    }
  }, 30000);

  afterAll(async () => {

    if (restaurantAdminToken && restaurantAId) {
      for (const dishId of createdDishIds) {
        await axios
          .patch(
            `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${dishId}/availability`,
            { isAvailable: false },
            authHeaders(restaurantAdminToken)
          )
          .catch(() => { });
      }
    }


    if (sysAdminToken && ephemeralAdminId) {
      if (restaurantAId) {
        await axios
          .delete(
            `${API_URL}/admin/users/${ephemeralAdminId}/restaurants/${restaurantAId}`,
            authHeaders(sysAdminToken)
          )
          .catch(() => { });
      }
      await axios
        .patch(
          `${API_URL}/admin/users/${ephemeralAdminId}/active`,
          { isActive: false },
          authHeaders(sysAdminToken)
        )
        .catch(() => { });
    }
  }, 20000);

  describe('1. Створення, редагування та збереження необовʼязкових полів (null без підміни нулями)', () => {
    let createdDishId = null;

    it('створює страву з необовʼязковими полями null і не підміняє їх нулями в адмін та публічному API', async () => {
      const dishName = `QA Тестова страва ${Date.now()}`;
      const createRes = await axios.post(
        `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
        {
          categoryId: categoryAId,
          name: `  ${dishName}  `,
          description: null,
          price: 185.5,
          weightGrams: null,
          calories: null,
          proteins: null,
          fats: null,
          carbohydrates: null,
          ingredientIds: existingIngredientIds.slice(0, 1),
        },
        authHeaders(restaurantAdminToken)
      );

      expect(createRes.status).toBe(201);
      createdDishId = createRes.data.id;
      createdDishIds.push(createdDishId);


      expect(createRes.data.restaurantId).toBe(restaurantAId);
      expect(createRes.data.categoryId).toBe(categoryAId);
      expect(createRes.data.name).toBe(dishName);
      expect(createRes.data.price).toBe(185.5);
      expect(createRes.data.status).toBe('Available');
      expect(createRes.data.description).toBeNull();
      expect(createRes.data.weightGrams).toBeNull();
      expect(createRes.data.calories).toBeNull();
      expect(createRes.data.proteins).toBeNull();
      expect(createRes.data.fats).toBeNull();
      expect(createRes.data.carbohydrates).toBeNull();
      expect(createRes.data.photos).toEqual([]);
      expect(createRes.data.ingredients.length).toBe(1);

      const publicRes = await axios.get(`${API_URL}/dishes/${createdDishId}`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.data.title).toBe(dishName);
      expect(publicRes.data.description).toBeNull();
      expect(publicRes.data.weight).toBeNull();
      expect(publicRes.data.calories).toBeNull();
      expect(publicRes.data.proteins).toBeNull();
      expect(publicRes.data.fats).toBeNull();
      expect(publicRes.data.carbohydrates).toBeNull();
      expect(publicRes.data.imageUrl).toBeNull();
      expect(publicRes.data.photos).toEqual([]);
    });

    it('редагує страву (ціна, склад, опис, КБЖВ), зберігає стабільний ID і підтримує очищення полів назад у null', async () => {
      expect(createdDishId).toBeTruthy();

      const updatedName = `QA Оновлена страва ${Date.now()}`;
      const updateRes = await axios.put(
        `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${createdDishId}`,
        {
          categoryId: categoryAId,
          name: updatedName,
          description: 'Авторський опис для QA-перевірки',
          price: 210.25,
          weightGrams: 320,
          calories: 450,
          proteins: 22.5,
          fats: 14.2,
          carbohydrates: 48.1,
          ingredientIds: existingIngredientIds.slice(0, 2),
        },
        authHeaders(restaurantAdminToken)
      );

      expect(updateRes.status).toBe(200);
      expect(updateRes.data.id).toBe(createdDishId);
      expect(updateRes.data.name).toBe(updatedName);
      expect(updateRes.data.price).toBe(210.25);
      expect(updateRes.data.weightGrams).toBe(320);
      expect(updateRes.data.calories).toBe(450);
      expect(updateRes.data.proteins).toBe(22.5);
      expect(updateRes.data.fats).toBe(14.2);
      expect(updateRes.data.carbohydrates).toBe(48.1);
      expect(updateRes.data.ingredients.length).toBe(Math.min(2, existingIngredientIds.length));


      const clearedRes = await axios.put(
        `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${createdDishId}`,
        {
          categoryId: categoryAId,
          name: updatedName,
          description: '   ',
          price: 199,
          weightGrams: null,
          calories: null,
          proteins: null,
          fats: null,
          carbohydrates: null,
          ingredientIds: [],
        },
        authHeaders(restaurantAdminToken)
      );

      expect(clearedRes.status).toBe(200);
      expect(clearedRes.data.description).toBeNull();
      expect(clearedRes.data.weightGrams).toBeNull();
      expect(clearedRes.data.calories).toBeNull();
      expect(clearedRes.data.proteins).toBeNull();
      expect(clearedRes.data.fats).toBeNull();
      expect(clearedRes.data.carbohydrates).toBeNull();
      expect(clearedRes.data.ingredients).toEqual([]);
    });
  });

  describe('2. Валідація ціни, складу (інгредієнтів) та категорії', () => {
    it('відхиляє відʼємну та порожню ціну (400 Bad Request)', async () => {
      await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
          {
            categoryId: categoryAId,
            name: 'Страва з відʼємною ціною',
            price: -50,
            ingredientIds: [],
          },
          authHeaders(restaurantAdminToken)
        ),
        400
      );

      await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
          {
            categoryId: categoryAId,
            name: 'Страва без ціни',
            price: null,
            ingredientIds: [],
          },
          authHeaders(restaurantAdminToken)
        ),
        400
      );
    });

    it('відхиляє некоректні інгредієнти: неіснуючі ID, дублікати та <= 0 (400 Bad Request)', async () => {
      const missingIngRes = await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
          {
            categoryId: categoryAId,
            name: 'Страва з неіснуючим інгредієнтом',
            price: 120,
            ingredientIds: [9999999],
          },
          authHeaders(restaurantAdminToken)
        ),
        400
      );
      expect(missingIngRes.data.title).toContain('інгредієнт');

      const validId = existingIngredientIds[0];
      await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
          {
            categoryId: categoryAId,
            name: 'Страва з дублікатами інгредієнтів',
            price: 120,
            ingredientIds: [validId, validId],
          },
          authHeaders(restaurantAdminToken)
        ),
        400
      );

      await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
          {
            categoryId: categoryAId,
            name: 'Страва з невалідним ID інгредієнта',
            price: 120,
            ingredientIds: [0],
          },
          authHeaders(restaurantAdminToken)
        ),
        400
      );
    });

    it('відхиляє відсутню, неіснуючу та чужу категорію іншого закладу (400 Bad Request)', async () => {
      await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
          {
            categoryId: null,
            name: 'Страва без категорії',
            price: 100,
            ingredientIds: [],
          },
          authHeaders(restaurantAdminToken)
        ),
        400
      );

      const unknownCatRes = await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
          {
            categoryId: 9999999,
            name: 'Страва з неіснуючою категорією',
            price: 100,
            ingredientIds: [],
          },
          authHeaders(restaurantAdminToken)
        ),
        400
      );
      expect(unknownCatRes.data.title).toContain('Категорія');

      if (foreignCategoryBId) {
        const foreignCatRes = await expectHttpError(
          axios.post(
            `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
            {
              categoryId: foreignCategoryBId,
              name: 'Страва з категорією іншого закладу',
              price: 100,
              ingredientIds: [],
            },
            authHeaders(restaurantAdminToken)
          ),
          400
        );
        expect(foreignCatRes.data.title).toContain('Категорія');
      }
    });
  });

  describe('3. Обробка відсутнього або некоректного фото страви', () => {
    it('відхиляє порожнє завантаження, позицію поза 1..3, невалідний формат і перевищення 5 МБ', async () => {
      const targetDishId = createdDishIds[0];
      expect(targetDishId).toBeTruthy();


      const emptyForm = new FormData();
      await expectHttpError(
        axios.put(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${targetDishId}/photos/1`,
          emptyForm,
          authHeaders(restaurantAdminToken)
        ),
        400
      );


      const invalidPosForm = new FormData();
      invalidPosForm.append(
        'file',
        new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' }),
        'photo.jpg'
      );
      await expectHttpError(
        axios.put(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${targetDishId}/photos/4`,
          invalidPosForm,
          authHeaders(restaurantAdminToken)
        ),
        400
      );


      const invalidFormatForm = new FormData();
      invalidFormatForm.append(
        'file',
        new Blob(['not a real image payload'], { type: 'image/jpeg' }),
        'fake.jpg'
      );
      const formatRes = await expectHttpError(
        axios.put(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${targetDishId}/photos/1`,
          invalidFormatForm,
          authHeaders(restaurantAdminToken)
        ),
        [400, 503]
      );
      if (formatRes.status === 400) {
        expect(formatRes.data.title).toContain('JPEG, PNG або WebP');
      }


      const oversizedBytes = new Uint8Array(5 * 1024 * 1024 + 1024);
      oversizedBytes[0] = 0xff;
      oversizedBytes[1] = 0xd8;
      oversizedBytes[2] = 0xff;
      const oversizedForm = new FormData();
      oversizedForm.append(
        'file',
        new Blob([oversizedBytes], { type: 'image/jpeg' }),
        'huge.jpg'
      );
      await expectHttpError(
        axios.put(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${targetDishId}/photos/1`,
          oversizedForm,
          authHeaders(restaurantAdminToken)
        ),
        [400, 413]
      );
    });
  });

  describe('4. Заборона зміни чужих страв та перевірка прав доступу (401/403/404)', () => {
    it('неавторизований користувач отримує 401 при спробі створити страву', async () => {
      await expectHttpError(
        axios.post(`${API_URL}/admin/restaurants/${restaurantAId}/dishes`, {
          categoryId: categoryAId,
          name: 'Анонімна страва',
          price: 100,
          ingredientIds: [],
        }),
        401
      );
    });

    it('звичайний користувач (RegisteredUser) отримує 403 при спробі створити, змінити страву або завантажити фото', async () => {
      const targetDishId = createdDishIds[0];

      await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes`,
          {
            categoryId: categoryAId,
            name: 'Несанкціонована страва',
            price: 100,
            ingredientIds: [],
          },
          authHeaders(userToken)
        ),
        403
      );

      await expectHttpError(
        axios.put(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${targetDishId}`,
          {
            categoryId: categoryAId,
            name: 'Зміна звичайним користувачем',
            price: 1,
            ingredientIds: [],
          },
          authHeaders(userToken)
        ),
        403
      );

      const form = new FormData();
      form.append(
        'file',
        new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' }),
        'photo.jpg'
      );
      await expectHttpError(
        axios.put(
          `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${targetDishId}/photos/1`,
          form,
          authHeaders(userToken)
        ),
        403
      );
    });

    it('адміністратор закладу А не може читати, створювати або редагувати страви іншого закладу Б (403/404)', async () => {

      await expectHttpError(
        axios.get(
          `${API_URL}/admin/restaurants/${restaurantBId}/dishes`,
          authHeaders(restaurantAdminToken)
        ),
        403
      );


      await expectHttpError(
        axios.post(
          `${API_URL}/admin/restaurants/${restaurantBId}/dishes`,
          {
            categoryId: foreignCategoryBId || categoryAId,
            name: 'Спроба створити в чужому закладі',
            price: 150,
            ingredientIds: [],
          },
          authHeaders(restaurantAdminToken)
        ),
        403
      );

      if (foreignDishBId) {

        await expectHttpError(
          axios.put(
            `${API_URL}/admin/restaurants/${restaurantBId}/dishes/${foreignDishBId}`,
            {
              categoryId: foreignCategoryBId || categoryAId,
              name: 'Спроба зламу чужої страви',
              price: 1,
              ingredientIds: [],
            },
            authHeaders(restaurantAdminToken)
          ),
          403
        );


        await expectHttpError(
          axios.put(
            `${API_URL}/admin/restaurants/${restaurantAId}/dishes/${foreignDishBId}`,
            {
              categoryId: categoryAId,
              name: 'Спроба підміни restaurantId у маршруті',
              price: 1,
              ingredientIds: [],
            },
            authHeaders(restaurantAdminToken)
          ),
          404
        );
      }
    });
  });
});
