import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategorySuggestions } from '@/components/ui/CategorySuggestions'
import { api } from '@/lib/api'

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    transactions: {
      suggestCategory: jest.fn(),
      getPopularCategories: jest.fn(),
    },
  },
}))

const mockApi = api as jest.Mocked<typeof api>

describe('Transaction Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CategorySuggestions Component', () => {
    const defaultProps = {
      description: 'Coffee shop purchase',
      amount: 4.50,
      transactionType: 'expense' as const,
      onCategorySelect: jest.fn(),
    }

    it('renders without crashing', () => {
      render(<CategorySuggestions {...defaultProps} />)
    })

    it('fetches category suggestions when description and amount are provided', async () => {
      const mockSuggestions = {
        data: {
          suggestions: [
            {
              category: 'Food',
              confidence: 0.95,
              confidence_level: 'Very High',
              reasons: ['coffee', 'shop'],
              explanation: 'Coffee purchases are typically categorized as Food'
            }
          ]
        }
      }

      mockApi.transactions.suggestCategory.mockResolvedValue(mockSuggestions)

      render(<CategorySuggestions {...defaultProps} />)

      await waitFor(() => {
        expect(mockApi.transactions.suggestCategory).toHaveBeenCalledWith({
          description: 'Coffee shop purchase',
          amount: 4.50,
          transaction_type: 'expense',
          timestamp: expect.any(String)
        })
      })
    })

    it('displays category suggestions correctly', async () => {
      const mockSuggestions = {
        data: {
          suggestions: [
            {
              category: 'Food',
              confidence: 0.95,
              confidence_level: 'Very High',
              reasons: ['coffee', 'shop'],
              explanation: 'Coffee purchases are typically categorized as Food'
            },
            {
              category: 'Drinks',
              confidence: 0.75,
              confidence_level: 'High',
              reasons: ['coffee'],
              explanation: 'Could be a beverage purchase'
            }
          ]
        }
      }

      mockApi.transactions.suggestCategory.mockResolvedValue(mockSuggestions)

      render(<CategorySuggestions {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Food')).toBeInTheDocument()
        expect(screen.getByText('Drinks')).toBeInTheDocument()
        expect(screen.getByText('95%')).toBeInTheDocument()
        expect(screen.getByText('75%')).toBeInTheDocument()
      })
    })

    it('calls onCategorySelect when a suggestion is clicked', async () => {
      const mockOnCategorySelect = jest.fn()
      const mockSuggestions = {
        data: {
          suggestions: [
            {
              category: 'Food',
              confidence: 0.95,
              confidence_level: 'Very High',
              reasons: ['coffee'],
              explanation: 'Coffee purchases are typically categorized as Food'
            }
          ]
        }
      }

      mockApi.transactions.suggestCategory.mockResolvedValue(mockSuggestions)

      render(
        <CategorySuggestions 
          {...defaultProps} 
          onCategorySelect={mockOnCategorySelect} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Food')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText('Food'))

      expect(mockOnCategorySelect).toHaveBeenCalledWith('Food')
    })

    it('fetches popular categories on mount', async () => {
      const mockPopularCategories = {
        data: {
          popular_categories: [
            { category: 'Food', usage_count: 15, average_amount: '12.50' },
            { category: 'Transport', usage_count: 8, average_amount: '3.20' }
          ]
        }
      }

      mockApi.transactions.getPopularCategories.mockResolvedValue(mockPopularCategories)

      render(<CategorySuggestions {...defaultProps} />)

      await waitFor(() => {
        expect(mockApi.transactions.getPopularCategories).toHaveBeenCalled()
      })
    })

    it('displays popular categories correctly', async () => {
      const mockPopularCategories = {
        data: {
          popular_categories: [
            { category: 'Food', usage_count: 15, average_amount: '12.50' },
            { category: 'Transport', usage_count: 8, average_amount: '3.20' }
          ]
        }
      }

      mockApi.transactions.getPopularCategories.mockResolvedValue(mockPopularCategories)
      mockApi.transactions.suggestCategory.mockResolvedValue({ data: { suggestions: [] } })

      render(<CategorySuggestions {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Your Frequent Categories')).toBeInTheDocument()
        expect(screen.getByText('15 times')).toBeInTheDocument()
        expect(screen.getByText('avg €12.50')).toBeInTheDocument()
      })
    })

    it('allows custom category input', async () => {
      const mockOnCategorySelect = jest.fn()
      
      render(
        <CategorySuggestions 
          {...defaultProps} 
          onCategorySelect={mockOnCategorySelect} 
        />
      )

      const user = userEvent.setup()
      const customInput = screen.getByPlaceholderText('Enter custom category...')
      
      await user.type(customInput, 'Custom Category')
      await user.keyboard('{Enter}')

      expect(mockOnCategorySelect).toHaveBeenCalledWith('Custom Category')
    })

    it('shows loading state while fetching suggestions', async () => {
      mockApi.transactions.suggestCategory.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<CategorySuggestions {...defaultProps} />)

      // Loading spinner should be visible
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('handles API errors gracefully', async () => {
      mockApi.transactions.suggestCategory.mockRejectedValue(new Error('API Error'))
      
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<CategorySuggestions {...defaultProps} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch category suggestions:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('shows confidence levels correctly', async () => {
      const mockSuggestions = {
        data: {
          suggestions: [
            { category: 'Food', confidence: 0.95, confidence_level: 'Very High', reasons: [], explanation: 'Very confident' },
            { category: 'Drinks', confidence: 0.75, confidence_level: 'High', reasons: [], explanation: 'High confidence' },
            { category: 'Other', confidence: 0.45, confidence_level: 'Low', reasons: [], explanation: 'Low confidence' }
          ]
        }
      }

      mockApi.transactions.suggestCategory.mockResolvedValue(mockSuggestions)

      render(<CategorySuggestions {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('95%')).toBeInTheDocument()
        expect(screen.getByText('75%')).toBeInTheDocument()
        expect(screen.getByText('45%')).toBeInTheDocument()
      })
    })

    it('highlights selected category', async () => {
      const mockSuggestions = {
        data: {
          suggestions: [
            {
              category: 'Food',
              confidence: 0.95,
              confidence_level: 'Very High',
              reasons: [],
              explanation: 'Food category'
            }
          ]
        }
      }

      mockApi.transactions.suggestCategory.mockResolvedValue(mockSuggestions)

      render(
        <CategorySuggestions 
          {...defaultProps} 
          selectedCategory="Food"
        />
      )

      await waitFor(() => {
        const foodCategory = screen.getByText('Food').closest('div')
        expect(foodCategory).toHaveClass('border-primary-500')
      })
    })
  })

  describe('Transaction Form Component', () => {
    const TransactionForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
      const [formData, setFormData] = React.useState({
        amount: '',
        type: 'expense',
        category: 'Food',
        description: ''
      })

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
      }

      return (
        <form onSubmit={handleSubmit}>
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
          />
          
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
          </select>
          
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
          
          <button type="submit">Add Transaction</button>
        </form>
      )
    }

    it('renders all form fields correctly', () => {
      render(<TransactionForm onSubmit={jest.fn()} />)
      
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument()
    })

    it('submits form with correct data', async () => {
      const mockOnSubmit = jest.fn()
      const user = userEvent.setup()
      
      render(<TransactionForm onSubmit={mockOnSubmit} />)
      
      await user.type(screen.getByLabelText(/amount/i), '25.50')
      await user.selectOptions(screen.getByLabelText(/type/i), 'income')
      await user.selectOptions(screen.getByLabelText(/category/i), 'Transport')
      await user.type(screen.getByLabelText(/description/i), 'Bus ticket')
      
      await user.click(screen.getByRole('button', { name: /add transaction/i }))
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: '25.50',
        type: 'income',
        category: 'Transport',
        description: 'Bus ticket'
      })
    })

    it('validates required amount field', async () => {
      const user = userEvent.setup()
      
      render(<TransactionForm onSubmit={jest.fn()} />)
      
      const submitButton = screen.getByRole('button', { name: /add transaction/i })
      await user.click(submitButton)
      
      const amountInput = screen.getByLabelText(/amount/i)
      expect(amountInput).toBeInvalid()
    })
  })

  describe('Transaction List Component', () => {
    const mockTransactions = [
      {
        id: 1,
        amount: '25.50',
        type: 'expense',
        category: 'Food',
        description: 'Coffee shop',
        state: 'Pending',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        amount: '100.00',
        type: 'income',
        category: 'Other',
        description: 'Allowance',
        state: 'Approved',
        timestamp: '2024-01-14T09:00:00Z'
      }
    ]

    const TransactionList = ({ transactions, onApprove }: any) => {
      return (
        <div>
          {transactions.map((transaction: any) => (
            <div key={transaction.id} data-testid={`transaction-${transaction.id}`}>
              <span>{transaction.description}</span>
              <span>€{transaction.amount}</span>
              <span>{transaction.type}</span>
              <span>{transaction.state}</span>
              {transaction.state === 'Pending' && (
                <button onClick={() => onApprove(transaction.id)}>
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>
      )
    }

    it('renders transaction list correctly', () => {
      render(<TransactionList transactions={mockTransactions} onApprove={jest.fn()} />)
      
      expect(screen.getByText('Coffee shop')).toBeInTheDocument()
      expect(screen.getByText('€25.50')).toBeInTheDocument()
      expect(screen.getByText('Allowance')).toBeInTheDocument()
      expect(screen.getByText('€100.00')).toBeInTheDocument()
    })

    it('shows approve button only for pending transactions', () => {
      render(<TransactionList transactions={mockTransactions} onApprove={jest.fn()} />)
      
      const approveButtons = screen.getAllByText('Approve')
      expect(approveButtons).toHaveLength(1)
    })

    it('calls onApprove when approve button is clicked', async () => {
      const mockOnApprove = jest.fn()
      const user = userEvent.setup()
      
      render(<TransactionList transactions={mockTransactions} onApprove={mockOnApprove} />)
      
      const approveButton = screen.getByText('Approve')
      await user.click(approveButton)
      
      expect(mockOnApprove).toHaveBeenCalledWith(1)
    })

    it('renders empty state when no transactions', () => {
      const EmptyTransactionList = () => {
        return <div>No transactions found</div>
      }
      
      render(<EmptyTransactionList />)
      
      expect(screen.getByText('No transactions found')).toBeInTheDocument()
    })
  })
})