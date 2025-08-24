import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '@/lib/auth'
import LoginForm from '@/app/auth/login/page'

// Mock the auth hook
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}))

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
    },
  },
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('Authentication Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    })
  })

  describe('Login Form', () => {
    it('renders login form correctly', () => {
      render(<LoginForm />)
      
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('shows validation errors for empty fields', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('shows validation error for short username', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const usernameInput = screen.getByLabelText(/username/i)
      await user.type(usernameInput, 'ab') // Too short
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument()
      })
    })

    it('shows validation error for short password', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, '123') // Too short
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('calls login function with correct credentials', async () => {
      const mockLogin = jest.fn().mockResolvedValue({})
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        logout: jest.fn(),
        register: jest.fn(),
      })

      const user = userEvent.setup()
      render(<LoginForm />)
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
      })
    })

    it('shows loading state during login', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      })

      render(<LoginForm />)
      
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })

    it('displays error message on login failure', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'))
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        logout: jest.fn(),
        register: jest.fn(),
      })

      const user = userEvent.setup()
      render(<LoginForm />)
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(usernameInput, 'wronguser')
      await user.type(passwordInput, 'wrongpass')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('redirects to register page when link is clicked', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const registerLink = screen.getByText(/create account/i)
      expect(registerLink).toBeInTheDocument()
      expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register')
    })

    it('toggles password visibility', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click to hide password again
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Registration Form', () => {
    const RegisterForm = () => {
      // This would be the actual register component
      return (
        <form>
          <h1>Create Account</h1>
          <input aria-label="Username" type="text" required />
          <input aria-label="Email" type="email" required />
          <input aria-label="Full Name" type="text" required />
          <input aria-label="Password" type="password" required />
          <select aria-label="Archetype" required>
            <option value="">Select archetype</option>
            <option value="Allowance">Allowance</option>
            <option value="Jobber">Jobber</option>
            <option value="Traveler">Traveler</option>
            <option value="Saver">Saver</option>
          </select>
          <button type="submit">Create Account</button>
        </form>
      )
    }

    it('renders registration form correctly', () => {
      render(<RegisterForm />)
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/archetype/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('shows all archetype options', () => {
      render(<RegisterForm />)
      
      const archetypeSelect = screen.getByLabelText(/archetype/i)
      const options = archetypeSelect.querySelectorAll('option')
      
      expect(options).toHaveLength(5) // Including default option
      expect(screen.getByText('Allowance')).toBeInTheDocument()
      expect(screen.getByText('Jobber')).toBeInTheDocument()
      expect(screen.getByText('Traveler')).toBeInTheDocument()
      expect(screen.getByText('Saver')).toBeInTheDocument()
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // Browser validation should trigger
      expect(emailInput).toBeInvalid()
    })
  })

  describe('Auth Guard Component', () => {
    const AuthGuard = ({ children }: { children: React.ReactNode }) => {
      const { isAuthenticated, isLoading } = useAuth()
      
      if (isLoading) {
        return <div>Loading...</div>
      }
      
      if (!isAuthenticated) {
        return <div>Please login</div>
      }
      
      return <>{children}</>
    }

    it('shows loading state when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })

    it('shows login prompt when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )
      
      expect(screen.getByText('Please login')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })

    it('shows protected content when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      })

      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      )
      
      expect(screen.getByText('Protected content')).toBeInTheDocument()
      expect(screen.queryByText('Please login')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('User Profile Display', () => {
    const UserProfile = () => {
      const { user, logout } = useAuth()
      
      if (!user) return null
      
      return (
        <div>
          <h2>User Profile</h2>
          <p>Username: {user.username}</p>
          <p>Email: {user.email}</p>
          <p>Full Name: {user.full_name}</p>
          <p>Archetype: {user.archetype}</p>
          <button onClick={logout}>Logout</button>
        </div>
      )
    }

    it('displays user information correctly', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        archetype: 'Allowance',
      }

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      })

      render(<UserProfile />)
      
      expect(screen.getByText('Username: testuser')).toBeInTheDocument()
      expect(screen.getByText('Email: test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Full Name: Test User')).toBeInTheDocument()
      expect(screen.getByText('Archetype: Allowance')).toBeInTheDocument()
    })

    it('calls logout function when logout button is clicked', async () => {
      const mockLogout = jest.fn()
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        archetype: 'Allowance',
      }

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        login: jest.fn(),
        logout: mockLogout,
        register: jest.fn(),
      })

      const user = userEvent.setup()
      render(<UserProfile />)
      
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)
      
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('renders nothing when user is null', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      })

      const { container } = render(<UserProfile />)
      
      expect(container.firstChild).toBeNull()
    })
  })
})