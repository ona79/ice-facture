import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewInvoice from '../pages/NewInvoice';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mocks
vi.mock('axios');
vi.mock('react-hot-toast');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock Scanner (can be tricky, just mock the lib)
vi.mock('html5-qrcode', () => ({
    Html5Qrcode: vi.fn().mockImplementation(() => ({
        start: vi.fn(),
        stop: vi.fn().mockResolvedValue(true),
    })),
}));

// Mock Audio for beep
window.AudioContext = vi.fn().mockImplementation(() => ({
    createOscillator: () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), type: '', frequency: { value: 0 } }),
    createGain: () => ({ connect: vi.fn(), gain: { value: 0 } }),
    destination: {},
}));

describe('NewInvoice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default online
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        // Default profile check OK
        axios.get.mockImplementation((url) => {
            if (url.includes('/profile')) return Promise.resolve({ data: { address: 'Dakar', phone: '770000000' } });
            if (url.includes('/products')) return Promise.resolve({
                data: [
                    { _id: '1', name: 'Produit Test', price: 1000, stock: 10, barcode: '123' }
                ]
            });
            return Promise.resolve({ data: {} });
        });
    });

    it('renders correctly', async () => {
        render(
            <BrowserRouter>
                <NewInvoice />
            </BrowserRouter>
        );
        expect(screen.getByPlaceholderText('RECHERCHER UN PRODUIT...')).toBeInTheDocument();
    });

    it('adds item to cart and validates online', async () => {
        render(
            <BrowserRouter>
                <NewInvoice />
            </BrowserRouter>
        );

        // Wait for products to load
        await waitFor(() => expect(screen.getByText('Produit Test')).toBeInTheDocument());

        // Add item
        fireEvent.click(screen.getByText('Produit Test'));

        // Switch to cart view (simulated by state change or seeing cart button on mobile? logic handles desktop split view)
        // In desktop view (default test env?), cart IS visible.

        // Fill customer info
        const nameInput = screen.getByPlaceholderText('NOM...');
        fireEvent.change(nameInput, { target: { value: 'Moussa' } });

        // Click Validate
        const validateBtn = screen.getByText('Valider');
        fireEvent.click(validateBtn);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('handles offline checkout correctly', async () => {
        // Simulate Offline
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        render(
            <BrowserRouter>
                <NewInvoice />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Produit Test')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Produit Test'));

        const nameInput = screen.getByPlaceholderText('NOM...');
        fireEvent.change(nameInput, { target: { value: 'Moussa Offline' } });

        const validateBtn = screen.getByText('Valider');
        fireEvent.click(validateBtn);

        await waitFor(() => {
            // Should NOT call axios post
            expect(axios.post).not.toHaveBeenCalled();
            // Should navigate
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        }, { timeout: 2000 }); // Wait longer for premium effects delay
    });
});
