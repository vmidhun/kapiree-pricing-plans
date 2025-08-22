import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, useSearchParams, useNavigate } from 'react-router-dom';
import Renewal from '../pages/Renewal';
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

describe('Renewal Page', () => {
  const mockUseSearchParams = useSearchParams as jest.Mock;
  const mockUseNavigate = useNavigate as jest.Mock;
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(navigateMock);
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]); // Default empty params
  });

  test('renders default subscription plan', () => {
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );
    expect(screen.getByText('Renew Subscription')).toBeInTheDocument();
    expect(screen.getByText('Base Plan')).toBeInTheDocument();
    expect(screen.getByText('$10/month')).toBeInTheDocument();
    expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument();
  });

  test('renders subscription plan from URL parameters', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=Premium Plan&amount=$50&type=subscription')]);
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
  });

  test('renders credit pack from URL parameters', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=30 Credits&amount=$25&type=credits')]);
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );
    expect(screen.getByText('30 Credits')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
  });

  test('adds and removes credit pack quantity', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=30 Credits&amount=$25&type=credits')]);
    render(
      <BrowserRouter>
        <Renewal />
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
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=30 Credits&amount=$25&type=credits')]);
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );

    const trashButton = screen.getByRole('button', { name: /trash/i });
    fireEvent.click(trashButton);

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  test('adds available credit pack to cart', async () => {
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );

    const addToCartButton = screen.getAllByRole('button', { name: /add to cart/i })[0]; // First "Add to Cart" for 30 Credits
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(screen.getByText('30 Credits')).toBeInTheDocument();
      expect(screen.getByText('$25.00')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('$35.00')).toBeInTheDocument(); // Base Plan ($10) + 30 Credits ($25)
    });
  });

  test('adds available add-on to cart', async () => {
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );

    const addToCartButton = screen.getAllByRole('button', { name: /add to cart/i })[2]; // First "Add to Cart" for Extra Storage
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(screen.getByText('Extra Storage')).toBeInTheDocument();
      expect(screen.getByText('$5/month')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('$15.00')).toBeInTheDocument(); // Base Plan ($10) + Extra Storage ($5)
    });
  });

  test('navigates to checkout page on "Proceed to Checkout"', async () => {
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );

    const checkoutButton = screen.getByRole('button', { name: /proceed to checkout/i });
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/checkout?plan=Base%20Plan&amount=%2410%2Fmonth&type=subscription');
    });
  });

  test('navigates back to pricing page', () => {
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /back to pricing/i });
    fireEvent.click(backButton);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  test('displays "Signed in as demo@example.com" badge when authenticated', () => {
    render(
      <BrowserRouter>
        <Renewal />
      </BrowserRouter>
    );
    expect(screen.getByText('Signed in as demo@example.com')).toBeInTheDocument();
  });
});
