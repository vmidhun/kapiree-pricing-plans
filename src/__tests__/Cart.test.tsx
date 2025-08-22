import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for custom matchers
import { BrowserRouter, useSearchParams, useNavigate } from 'react-router-dom';
import Cart from '../pages/Cart';
import { AuthModal } from '@/components/AuthModal';

// Mock the AuthModal component
jest.mock('@/components/AuthModal', () => ({
  AuthModal: jest.fn(({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="auth-modal">
        Auth Modal
        <button onClick={onSuccess}>Mock Login Success</button>
        <button onClick={onClose}>Mock Close</button>
      </div>
    );
  }),
}));

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
}));

describe('Cart Page', () => {
  const mockUseSearchParams = useSearchParams as jest.Mock;
  const mockUseNavigate = useNavigate as jest.Mock;
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(navigateMock);
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]); // Default empty params
  });

  test('renders empty cart message when no items are present', () => {
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeDisabled();
  });

  test('renders items added via URL parameters (subscription)', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=Premium Plan&amount=$50&type=subscription')]);
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('Subscription Plan')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  test('renders items added via URL parameters (credits)', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=30 Credits&amount=$25&type=payment')]);
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );
    expect(screen.getByText('30 Credits')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
    expect(screen.getByText('Credit Packs')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  test('adds and removes credit pack quantity', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=30 Credits&amount=$25&type=payment')]);
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    const plusButton = screen.getByRole('button', { name: /plus/i });
    fireEvent.click(plusButton);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // 2 * $25

    const minusButton = screen.getByRole('button', { name: /minus/i });
    fireEvent.click(minusButton);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument(); // 1 * $25

    fireEvent.click(minusButton); // Reduce to 0, should remove item
    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  test('removes item using trash icon', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=30 Credits&amount=$25&type=payment')]);
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    const trashButton = screen.getByRole('button', { name: /trash/i });
    fireEvent.click(trashButton);

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  test('shows AuthModal on checkout if not authenticated', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=Premium Plan&amount=$50&type=subscription')]);
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    const checkoutButton = screen.getByRole('button', { name: /sign in & checkout/i });
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });
  });

  test('proceeds to checkout after successful authentication', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=Premium Plan&amount=$50&type=subscription')]);
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    const checkoutButton = screen.getByRole('button', { name: /sign in & checkout/i });
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    const mockLoginSuccessButton = screen.getByRole('button', { name: /mock login success/i });
    fireEvent.click(mockLoginSuccessButton);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/checkout?plan=Premium%20Plan&amount=%2450&type=subscription');
    });
  });

  test('navigates back to pricing page', () => {
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /back to pricing/i });
    fireEvent.click(backButton);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  test('displays "First month free" for Base Plan', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=Base Plan&amount=$10&type=subscription')]);
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );
    expect(screen.getByText('First month free. Renews at $10 from the next billing cycle.')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument(); // Strikethrough price
  });

});
