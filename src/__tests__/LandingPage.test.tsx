import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '../pages/Index';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';

// Mock the AuthModal component
jest.mock('../components/AuthModal', () => ({
  AuthModal: jest.fn(({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="auth-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Simulate Login Success</button>
      </div>
    );
  }),
}));

// Mock useAuth hook
jest.mock('../hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock useToast hook
jest.mock('../hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

describe('LandingPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    (AuthModal as jest.Mock).mockClear();
  });

  test('renders pricing sections and login button for unauthenticated users', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    expect(screen.getByText('Kapiree Pricing')).toBeInTheDocument();
    expect(screen.getByText('Base Plan')).toBeInTheDocument();
    expect(screen.getByText('Credit Packs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('login button opens AuthModal', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    expect(AuthModal).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      {}
    );
  });


  test('AuthModal onSuccess navigates to dashboard', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    // Simulate AuthModal calling onSuccess
    const authModalProps = (AuthModal as jest.Mock).mock.calls[0][0];
    authModalProps.onSuccess();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
