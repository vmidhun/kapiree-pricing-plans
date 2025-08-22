import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';

// Mock the useAuth hook
jest.mock('../hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock the useToast hook
jest.mock('../hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

describe('DashboardPage', () => {
  const mockNavigate = jest.fn();
  const mockSetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    jest.spyOn(localStorage, 'getItem').mockReturnValue('mockToken');
    jest.spyOn(localStorage, 'removeItem').mockImplementation(jest.fn());

    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '123', username: 'TestUser', email: 'test@example.com', credits: 100 },
      setUser: mockSetUser,
    });

    // Mock fetch for profile API
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url === 'http://localhost:3000/api/auth/profile') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: '123', username: 'TestUser', email: 'test@example.com', credits: 100 } }),
        }) as Promise<Response>;
      }
      return Promise.reject(new Error('not found'));
    });
  });

  test('renders dashboard content for authenticated users', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to your Dashboard, TestUser!')).toBeInTheDocument();
      expect(screen.getByText('Available Credits:')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });


  test('logout button clears local storage and navigates to landing page', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('navigation buttons work correctly', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    expect(mockNavigate).toHaveBeenCalledWith('/settings');

    const subscriptionButton = screen.getByRole('button', { name: /subscription/i });
    fireEvent.click(subscriptionButton);
    expect(mockNavigate).toHaveBeenCalledWith('/subscription');
  });
});
