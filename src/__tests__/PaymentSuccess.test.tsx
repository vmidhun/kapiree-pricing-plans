import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import PaymentSuccess from '../pages/PaymentSuccess';

// Mock useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('PaymentSuccess Page', () => {
  const mockUseNavigate = useNavigate as jest.Mock;
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(navigateMock);
  });

  test('renders payment success message and order details', () => {
    render(
      <BrowserRouter>
        <PaymentSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByText('Thank you for your purchase. Your payment has been processed successfully.')).toBeInTheDocument();
    expect(screen.getByText('Order ID:')).toBeInTheDocument();
    expect(screen.getByText('#KAP-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Amount:')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  test('renders "What\'s next?" section', () => {
    render(
      <BrowserRouter>
        <PaymentSuccess />
      </BrowserRouter>
    );

    expect(screen.getByText("What's next?")).toBeInTheDocument();
    expect(screen.getByText('Your account has been activated')).toBeInTheDocument();
    expect(screen.getByText('10 credits have been added to your account')).toBeInTheDocument();
    expect(screen.getByText('A confirmation email has been sent')).toBeInTheDocument();
  });

  test('navigates to dashboard when "Go to Dashboard" button is clicked', () => {
    render(
      <BrowserRouter>
        <PaymentSuccess />
      </BrowserRouter>
    );

    const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
    fireEvent.click(dashboardButton);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  test('calls window.print when download button is clicked', () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});
    
    render(
      <BrowserRouter>
        <PaymentSuccess />
      </BrowserRouter>
    );

    const downloadButton = screen.getByRole('button', { name: /download/i });
    fireEvent.click(downloadButton);
    expect(printSpy).toHaveBeenCalledTimes(1);
    
    printSpy.mockRestore();
  });
});
