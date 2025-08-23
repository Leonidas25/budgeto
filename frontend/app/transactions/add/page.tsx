"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, MessageCircle, Plus, Smartphone } from 'lucide-react';
import Link from 'next/link';

const categories = [
  'Food', 'Drinks', 'Rent', 'Transport', 'Travel', 'Shopping', 
  'Entertainment', 'Education', 'Health', 'Other'
];

const categoryEmojis: { [key: string]: string } = {
  Food: '🍽️',
  Drinks: '🥤',
  Rent: '🏠',
  Transport: '🚌',
  Travel: '✈️',
  Shopping: '🛍️',
  Entertainment: '🎮',
  Education: '📚',
  Health: '🏥',
  Other: '📝'
};

export default function AddTransactionPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'manual' | 'sms'>('manual');
  
  // Manual form state
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Food',
    description: ''
  });
  
  // SMS parsing state
  const [smsText, setSmsText] = useState('');
  const [smsResult, setSmsResult] = useState<any>(null);
  const [smsParsing, setSmsParsing] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;
    
    setLoading(true);
    try {
      await api.transactions.create({
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description || undefined,
        source: 'Manual'
      });
      
      router.push('/transactions');
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSMSParse = async () => {
    if (!smsText.trim()) return;
    
    setSmsParsing(true);
    try {
      const response = await api.sms.parse(smsText);
      setSmsResult(response.data);
    } catch (error) {
      console.error('Failed to parse SMS:', error);
      setSmsResult({
        success: false,
        message: 'Failed to parse SMS. Please try again or add manually.'
      });
    } finally {
      setSmsParsing(false);
    }
  };

  const handleAcceptSMSTransaction = async () => {
    if (!smsResult?.transaction) return;
    
    try {
      await api.transactions.approve(smsResult.transaction.id);
      router.push('/transactions');
    } catch (error) {
      console.error('Failed to accept SMS transaction:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className=\"container-mobile py-6\">
      {/* Header */}
      <div className=\"flex items-center space-x-4 mb-6\">
        <Link href=\"/transactions\" className=\"p-2 hover:bg-gray-100 rounded-lg\">
          <ArrowLeft size={20} className=\"text-gray-600\" />
        </Link>
        <div>
          <h1 className=\"text-2xl font-bold text-gray-900\">Add Transaction</h1>
          <p className=\"text-gray-600\">Track your income or expense</p>
        </div>
      </div>

      {/* Method Selection */}
      <div className=\"flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg\">
        <button
          onClick={() => setActiveMethod('manual')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeMethod === 'manual'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plus size={16} />
          <span>Manual Entry</span>
        </button>
        <button
          onClick={() => setActiveMethod('sms')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeMethod === 'sms'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Smartphone size={16} />
          <span>Parse SMS</span>
        </button>
      </div>

      {activeMethod === 'manual' ? (
        /* Manual Entry Form */
        <div className=\"bg-white rounded-xl shadow-sm border border-gray-100 p-6\">
          <form onSubmit={handleManualSubmit} className=\"space-y-6\">
            {/* Transaction Type */}
            <div>
              <label className=\"form-label\">Transaction Type</label>
              <div className=\"grid grid-cols-2 gap-3\">
                <button
                  type=\"button\"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'expense'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className=\"text-2xl mb-1\">💸</div>
                  <p className=\"font-medium\">Expense</p>
                </button>
                <button
                  type=\"button\"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'income'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className=\"text-2xl mb-1\">💰</div>
                  <p className=\"font-medium\">Income</p>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className=\"form-label\">Amount (€)</label>
              <div className=\"relative\">
                <span className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500\">€</span>
                <input
                  type=\"number\"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className=\"form-input pl-8\"
                  placeholder=\"0.00\"
                  min=\"0.01\"
                  step=\"0.01\"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className=\"form-label\">Category</label>
              <div className=\"grid grid-cols-3 gap-2\">
                {categories.map((category) => (
                  <button
                    key={category}
                    type=\"button\"
                    onClick={() => setFormData(prev => ({ ...prev, category }))}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      formData.category === category
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className=\"text-lg mb-1\">{categoryEmojis[category]}</div>
                    <p className=\"text-xs font-medium\">{category}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className=\"form-label\">Description (Optional)</label>
              <input
                type=\"text\"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className=\"form-input\"
                placeholder=\"e.g., Coffee at Starbucks\"
              />
            </div>

            {/* Submit Button */}
            <button
              type=\"submit\"
              disabled={loading || !formData.amount}
              className=\"w-full btn-primary py-3 text-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-50\"
            >
              {loading ? (
                <div className=\"w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin\" />
              ) : (
                <>
                  <Plus size={20} />
                  <span>Add Transaction</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* SMS Parsing */
        <div className=\"space-y-6\">
          <div className=\"bg-white rounded-xl shadow-sm border border-gray-100 p-6\">
            <div className=\"text-center mb-6\">
              <Smartphone className=\"w-16 h-16 text-primary-500 mx-auto mb-4\" />
              <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">Parse Bank SMS</h3>
              <p className=\"text-gray-600\">Paste your bank SMS message below and we'll extract the transaction details</p>
            </div>
            
            <div className=\"space-y-4\">
              <div>
                <label className=\"form-label\">SMS Message</label>
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className=\"form-input h-32 resize-none\"
                  placeholder=\"NBG: Αγορά 15.50 EUR στο COFFEE ISLAND ATHENS...\"
                />
              </div>
              
              <button
                onClick={handleSMSParse}
                disabled={smsParsing || !smsText.trim()}
                className=\"w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50\"
              >
                {smsParsing ? (
                  <div className=\"w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin\" />
                ) : (
                  <>
                    <MessageCircle size={20} />
                    <span>Parse SMS</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SMS Result */}
          {smsResult && (
            <div className=\"bg-white rounded-xl shadow-sm border border-gray-100 p-6\">
              {smsResult.success ? (
                <div className=\"space-y-4\">
                  <div className=\"flex items-center space-x-2 text-green-600\">
                    <MessageCircle size={20} />
                    <h3 className=\"font-semibold\">SMS Parsed Successfully!</h3>
                  </div>
                  
                  <div className=\"bg-gray-50 rounded-lg p-4\">
                    <div className=\"grid grid-cols-2 gap-4 text-sm\">
                      <div>
                        <span className=\"text-gray-500\">Amount:</span>
                        <p className=\"font-medium\">€{smsResult.transaction?.amount}</p>
                      </div>
                      <div>
                        <span className=\"text-gray-500\">Type:</span>
                        <p className=\"font-medium capitalize\">{smsResult.transaction?.type}</p>
                      </div>
                      <div>
                        <span className=\"text-gray-500\">Category:</span>
                        <p className=\"font-medium\">{smsResult.transaction?.category}</p>
                      </div>
                      <div>
                        <span className=\"text-gray-500\">Source:</span>
                        <p className=\"font-medium\">{smsResult.transaction?.source}</p>
                      </div>
                    </div>
                    {smsResult.transaction?.description && (
                      <div className=\"mt-3\">
                        <span className=\"text-gray-500 text-sm\">Description:</span>
                        <p className=\"font-medium\">{smsResult.transaction.description}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className=\"text-sm text-gray-600\">
                    Confidence: {Math.round((smsResult.confidence || 0) * 100)}%
                  </p>
                  
                  <button
                    onClick={handleAcceptSMSTransaction}
                    className=\"w-full btn-primary py-3\"
                  >
                    Accept & Add Transaction
                  </button>
                </div>
              ) : (
                <div className=\"text-center text-red-600\">
                  <MessageCircle size={48} className=\"mx-auto mb-3\" />
                  <p className=\"font-medium\">{smsResult.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Supported Banks */}
          <div className=\"bg-blue-50 rounded-lg p-4\">
            <h4 className=\"font-semibold text-blue-900 mb-2\">Supported Banks & Services:</h4>
            <div className=\"grid grid-cols-2 gap-2 text-sm text-blue-700\">
              <div>• National Bank (NBG)</div>
              <div>• Eurobank</div>
              <div>• Alpha Bank</div>
              <div>• Piraeus Bank</div>
              <div>• IRIS Payments</div>
              <div>• More coming soon...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}