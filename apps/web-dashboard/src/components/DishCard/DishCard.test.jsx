// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import DishCard from './DishCard';

describe('Task 1: DishCard UI', () => {
    it('відсутність підміни null нулем: показує "Ціну не вказано" і приховує вагу, якщо даних немає', () => {
        const mockDish = {
            id: 1,
            restaurantId: 1,
            restaurantName: 'Ресторан А',
            category: 'Супи',
            title: 'Борщ',
            price: null,
            weight: null,
            currency: 'UAH',
            imageUrl: null
        };

        render(
            <BrowserRouter>
                <DishCard dish={mockDish} />
            </BrowserRouter>
        );

        expect(screen.getByText('Ціну не вказано')).toBeInTheDocument();
        expect(screen.queryByText(/0 г/i)).not.toBeInTheDocument();
    });

    it('коректно форматує та виводить наявні ціну та вагу', () => {
        const mockDish = {
            id: 2,
            restaurantId: 1,
            restaurantName: 'Ресторан А',
            category: 'Десерти',
            title: 'Торт',
            price: 150.50,
            weight: 200,
            currency: 'UAH',
            imageUrl: null
        };

        render(
            <BrowserRouter>
                <DishCard dish={mockDish} />
            </BrowserRouter>
        );

        expect(screen.getByText('200 г')).toBeInTheDocument();
    });
});