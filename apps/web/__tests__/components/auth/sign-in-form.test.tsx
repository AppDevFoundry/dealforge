import { SignInForm } from '@/components/auth/sign-in-form';
import { signIn } from '@/lib/auth-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../../utils/render';

// Get the mocked module
vi.mock('@/lib/auth-client', () => ({
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
  },
}));

// Mock useRouter more specifically for this test
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the email input field', () => {
      render(<SignInForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders the password input field', () => {
      render(<SignInForm />);

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders the sign in button', () => {
      render(<SignInForm />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders OAuth buttons for Google and GitHub', () => {
      render(<SignInForm />);

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('allows typing in the email field', async () => {
      const { user } = render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('allows typing in the password field', async () => {
      const { user } = render(<SignInForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('email sign in', () => {
    it('calls signIn.email with credentials on form submit', async () => {
      vi.mocked(signIn.email).mockResolvedValueOnce({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null,
      });

      const { user } = render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(signIn.email).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          callbackURL: '/dashboard',
        });
      });
    });

    it('redirects to dashboard on successful sign in', async () => {
      vi.mocked(signIn.email).mockResolvedValueOnce({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null,
      });

      const { user } = render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('displays error message on failed sign in', async () => {
      vi.mocked(signIn.email).mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const { user } = render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('displays generic error on unexpected exception', async () => {
      vi.mocked(signIn.email).mockRejectedValueOnce(new Error('Network error'));

      const { user } = render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading text while signing in', async () => {
      // Make signIn.email hang by returning a never-resolving promise
      vi.mocked(signIn.email).mockImplementation(() => new Promise(() => {}));

      const { user } = render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it('disables form fields while loading', async () => {
      vi.mocked(signIn.email).mockImplementation(() => new Promise(() => {}));

      const { user } = render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
        expect(screen.getByLabelText(/password/i)).toBeDisabled();
      });
    });

    it('disables OAuth buttons while loading', async () => {
      vi.mocked(signIn.email).mockImplementation(() => new Promise(() => {}));

      const { user } = render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /google/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /github/i })).toBeDisabled();
      });
    });
  });

  describe('OAuth sign in', () => {
    it('calls signIn.social for Google', async () => {
      vi.mocked(signIn.social).mockResolvedValueOnce({});

      const { user } = render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /google/i }));

      expect(signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    });

    it('calls signIn.social for GitHub', async () => {
      vi.mocked(signIn.social).mockResolvedValueOnce({});

      const { user } = render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /github/i }));

      expect(signIn.social).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/dashboard',
      });
    });

    it('displays error on OAuth failure', async () => {
      vi.mocked(signIn.social).mockRejectedValueOnce(new Error('OAuth failed'));

      const { user } = render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /google/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to initiate oauth/i)).toBeInTheDocument();
      });
    });
  });
});
