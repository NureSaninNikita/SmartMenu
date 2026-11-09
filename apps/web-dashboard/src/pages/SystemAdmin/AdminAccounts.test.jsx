// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminAccounts from './AdminAccounts';
import adminService from '../../services/adminService';

vi.mock('../../services/adminService');

describe('Task 2: AdminAccounts UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm = vi.fn(() => true);
    });

    afterEach(() => {
        cleanup();
    });

    it('перевірка блокування: викликає API деактивації при кліку', async () => {

        adminService.getUsers.mockResolvedValue({
            total: 1,
            pageSize: 20,
            items: [
                { id: 2, firstName: 'Іван', lastName: 'Тестер', isActive: true, role: 'RegisteredUser', restaurantIds: [] }
            ]
        });
        adminService.getRestaurants.mockResolvedValue([]);

        adminService.setUserActive.mockResolvedValue({
            id: 2,
            firstName: 'Іван',
            lastName: 'Тестер',
            isActive: false,
            role: 'RegisteredUser',
            restaurantIds: []
        });

        render(<AdminAccounts currentUserId={1} />);


        const blockButton = await screen.findByRole('button', { name: /Заблокувати/i });

        fireEvent.click(blockButton);

        await waitFor(() => {
            expect(adminService.setUserActive).toHaveBeenCalledWith(2, false);
        });
    });

    it('перевірка відсутнього закладу: показує помилку, якщо API повертає збій', async () => {
        adminService.getUsers.mockResolvedValue({
            total: 1,
            pageSize: 20,
            items: [
                { id: 2, firstName: 'Іван', lastName: 'Тестер', isActive: true, role: 'RegisteredUser', restaurantIds: [] }
            ]
        });
        adminService.getRestaurants.mockResolvedValue([
            { id: 9999, name: 'Відсутній заклад', status: 'Active' }
        ]);

        adminService.assignRestaurant.mockRejectedValue({
            response: { status: 404, data: { title: 'Заклад не знайдено' } }
        });

        render(<AdminAccounts currentUserId={1} />);

        const assignOpenButton = await screen.findByRole('button', { name: /\+ Заклад/i });
        fireEvent.click(assignOpenButton);

        const select = await screen.findByRole('combobox');
        fireEvent.change(select, { target: { value: '9999' } });

        const submitButton = screen.getByRole('button', { name: /Призначити/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });
    });
});