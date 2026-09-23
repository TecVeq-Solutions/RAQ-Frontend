import React from 'react';
import { render, screen } from '@testing-library/react';
import { LicenseExpiryBanner } from '../LicenseExpiryBanner';
import { useTenantContext } from '@/context/TenantContext';

// Mock the context hook
jest.mock('@/context/TenantContext', () => ({
  useTenantContext: jest.fn(),
}));

describe('LicenseExpiryBanner', () => {
  const mockRefreshTenantContext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockContext = (licenseOverrides = {}) => {
    (useTenantContext as jest.Mock).mockReturnValue({
      loading: false,
      package: { name: 'Pro SaaS' },
      refreshTenantContext: mockRefreshTenantContext,
      license: {
        is_valid: true,
        status: 'active',
        grace_period: false,
        days_remaining: 10,
        is_expiring_soon: false,
        expires_at: '2026-10-10',
        ...licenseOverrides,
      },
    });
  };

  it('renders nothing when there is no license or loading is true', () => {
    (useTenantContext as jest.Mock).mockReturnValue({
      loading: true,
      license: null,
    });
    const { container } = render(<LicenseExpiryBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when license has more than 7 days remaining (e.g., 8 days)', () => {
    setupMockContext({ days_remaining: 8, is_expiring_soon: false });
    const { container } = render(<LicenseExpiryBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 7-day warning correctly when exactly 7 days remain', () => {
    setupMockContext({ days_remaining: 7, is_expiring_soon: false });
    render(<LicenseExpiryBanner />);
    expect(screen.getByText(/License Expiring Soon:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your subscription will expire in/i)
    ).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(
      screen.getByText(/Please renew your subscription to continue using the service./i)
    ).toBeInTheDocument();
  });

  it('renders 1-day warning correctly with singular "day" text when 1 day remains', () => {
    setupMockContext({ days_remaining: 1, is_expiring_soon: true });
    render(<LicenseExpiryBanner />);
    expect(screen.getByText(/License Expiring Soon:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your subscription will expire in/i)
    ).toBeInTheDocument();
    expect(screen.getByText('1 day')).toBeInTheDocument();
  });

  it('renders expired grace period warning correctly', () => {
    setupMockContext({ grace_period: true, status: 'grace_period', days_remaining: 0 });
    render(<LicenseExpiryBanner />);
    expect(screen.getByText(/License in Grace Period:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your subscription has expired and is operating under a temporary grace period/i)
    ).toBeInTheDocument();
  });

  it('renders terminal restriction message correctly when license is suspended', () => {
    setupMockContext({ is_valid: false, status: 'suspended', validation_message: 'License suspended due to non-payment' });
    render(<LicenseExpiryBanner />);
    expect(screen.getByText(/Subscription Access Restricted:/i)).toBeInTheDocument();
    expect(screen.getByText(/License suspended due to non-payment/i)).toBeInTheDocument();
  });
});
