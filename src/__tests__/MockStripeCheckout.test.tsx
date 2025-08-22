import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, useSearchParams, useNavigate } from 'react-router-dom';
import MockStripeCheckout from '../pages/MockStripeCheckout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Mock hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

describe('MockStripeCheckout Page', () => {
  const mockUseSearchParams = useSearchParams as jest.Mock;
  const mockUseNavigate = useNavigate as jest.Mock;
  const mockUseToast = useToast as jest.Mock;
  const mockUseAuth = useAuth as jest.Mock;

  const navigateMock = jest.fn();
  const toastMock = jest.fn();
  const setUserMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(navigateMock);
    mockUseToast.mockReturnValue({ toast: toastMock });
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]); // Default empty params
    mockUseAuth.mockReturnValue({
      user: null,
      setUser: setUserMock,
    });

    // Mock fetch for credit update API
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url === 'http://localhost:3000/api/auth/update-credits') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Credits updated', user: { id: '1', credits: 100 } }),
        }) as Promise<Response>;
      }
      return Promise.reject(new Error('not found'));
    });
  });

  test('renders with default plan and amount', () => {
    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );
    expect(screen.getByText('Base Plan')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay \$10/i })).toBeInTheDocument();
  });

  test('renders with subscription plan from URL params', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=Premium Plan&amount=$50&type=subscription')]);
    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('Recurring monthly')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay \$50/i })).toBeInTheDocument();
  });

  test('renders with credit purchase plan from URL params', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=150 Credits&amount=$100&type=payment')]);
    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );
    expect(screen.getByText('150 Credits')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.queryByText('Recurring monthly')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay \$100/i })).toBeInTheDocument();
  });

  test('redirects to dashboard if authenticated user tries to access subscription checkout', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'test', email: 'test@example.com', credits: 50 },
      setUser: setUserMock,
    });
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=Premium Plan&amount=$50&type=subscription')]);

    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "Already logged in",
      }));
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('simulates successful subscription payment and navigates to payment success page', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=Premium Plan&amount=$50&type=subscription')]);
    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );

    const payButton = screen.getByRole('button', { name: /pay \$50/i });
    fireEvent.click(payButton);

    expect(payButton).toHaveTextContent('Processing...');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/payment-success');
    }, { timeout: 3500 }); // Wait for the setTimeout
  });

  test('handles successful credit purchase for authenticated user', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'test', email: 'test@example.com', credits: 50 },
      setUser: setUserMock,
    });
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=30 Credits&amount=$25&type=payment')]);

    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );

    const payButton = screen.getByRole('button', { name: /pay \$25/i });
    fireEvent.click(payButton);

    expect(payButton).toHaveTextContent('Processing...');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/update-credits',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ creditsToAdd: 30 }),
        })
      );
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "Credits purchased successfully!",
      }));
      expect(setUserMock).toHaveBeenCalledWith({ id: '1', credits: 100 });
      expect(navigateMock).toHaveBeenCalledWith('/payment-success');
    });
  });

  test('handles failed credit purchase', async () => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to update credits' }),
      }) as Promise<Response>
    );

    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'test', email: 'test@example.com', credits: 50 },
      setUser: setUserMock,
    });
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?plan=30 Credits&amount=$25&type=payment')]);

    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );

    const payButton = screen.getByRole('button', { name: /pay \$25/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "Credit purchase failed",
      }));
      expect(payButton).not.toHaveTextContent('Processing...');
    });
  });

  test('navigates back to home page', () => {
    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  test('email field is not rendered if user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'test', email: 'test@example.com', credits: 50 },
      setUser: setUserMock,
    });
    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  test('email field is rendered if user is not authenticated', () => {
    render(
      <BrowserRouter>
        <MockStripeCheckout />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
