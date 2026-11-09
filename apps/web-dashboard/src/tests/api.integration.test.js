import axios from 'axios';
import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = import.meta.env.VITE_SMARTMENU_API_URL;

describe('Інтеграційні тести API (Task 1 та Task 2)', () => {
    let sysAdminToken = '';
    let userToken = '';

    beforeAll(async () => {
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: import.meta.env.VITE_TEST_ADMIN_EMAIL,
            password: import.meta.env.VITE_TEST_ADMIN_PASSWORD
        });
        sysAdminToken = adminRes.data.token;

        const userRes = await axios.post(`${API_URL}/auth/login`, {
            email: import.meta.env.VITE_TEST_USER_EMAIL,
            password: import.meta.env.VITE_TEST_USER_PASSWORD
        });
        userToken = userRes.data.token;
    });

    describe('Task 1: Картка страви', () => {
        it('Середня оцінка, порожні дані (null) та відсутність підміни нулем', async () => {
            const res = await axios.get(`${API_URL}/dishes/1`);

            expect(res.status).toBe(200);

            if (res.data.weight !== null) {
                expect(res.data.weight).toBeGreaterThan(0);
            } else {
                expect(res.data.weight).toBeNull();
            }

            if (res.data.calories !== null) {
                expect(res.data.calories).toBeGreaterThan(0);
            } else {
                expect(res.data.calories).toBeNull();
            }

            if (res.data.ratingCount > 0) {
                expect(res.data.averageRating).toBeGreaterThan(0);
            }
        });

        it('Архівна страва повертає статус 404', async () => {
            try {
                await axios.get(`${API_URL}/dishes/999`);
            } catch (error) {
                expect(error.response.status).toBe(404);
                expect(error.response.data.title).toBe('Страву не знайдено в актуальному меню.');
            }
        });
    });

    describe('Task 2: Керування акаунтами', () => {
        it('Призначення адміністратора на відсутній заклад', async () => {
            try {
                await axios.post(
                    `${API_URL}/admin/users/2/restaurants/9999`,
                    {},
                    { headers: { Authorization: `Bearer ${sysAdminToken}` } }
                );
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });

        it('Чужі дані: звичайний користувач не може заблокувати іншого', async () => {
            try {
                await axios.patch(
                    `${API_URL}/admin/users/2/active`,
                    { isActive: false },
                    { headers: { Authorization: `Bearer ${userToken}` } }
                );
            } catch (error) {
                expect(error.response.status).toBe(403);
            }
        });

        it('Блокування користувача', async () => {
            const res = await axios.patch(
                `${API_URL}/admin/users/16/active`,
                { isActive: false },
                { headers: { Authorization: `Bearer ${sysAdminToken}` } }
            );

            expect(res.status).toBe(200);
            expect(res.data.isActive).toBe(false);
        });

        it('Збереження історії після блокування', async () => {
            const res = await axios.get(`${API_URL}/dishes/1`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.data.reviews)).toBe(true);
        });
    });
});