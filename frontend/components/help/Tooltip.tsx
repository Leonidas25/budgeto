"use client";

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  className?: string;
  maxWidth?: string;
}

interface HelpTooltipProps {
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

interface ContextualHelpProps {
  helpId: string;
  title: string;
  content: string;
  steps?: string[];
  links?: Array<{ label: string; url: string }>;
}

// Basic tooltip component
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  trigger = 'hover',
  className = '',
  maxWidth = '200px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 200; // Approximate width
    const tooltipHeight = 60; // Approximate height
    const spacing = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipHeight - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.left - tooltipWidth - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.right + spacing;
        break;
    }

    // Keep tooltip within viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    if (left < 0) left = spacing;
    if (left + tooltipWidth > viewport.width) left = viewport.width - tooltipWidth - spacing;
    if (top < 0) top = spacing;
    if (top + tooltipHeight > viewport.height) top = viewport.height - tooltipHeight - spacing;

    setTooltipPosition({ top, left });
  };

  const showTooltip = () => {
    calculatePosition();
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible]);

  const tooltipContent = isVisible && (
    <div
      ref={tooltipRef}
      className={`fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg ${className}`}
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        maxWidth
      }}
    >
      {content}
      <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
        position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
        position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
        position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
        'left-[-4px] top-1/2 -translate-y-1/2'
      }`} />
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
        onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        onClick={trigger === 'click' ? toggleTooltip : undefined}
      >
        {children}
      </div>
      {typeof window !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
};

// Help icon with tooltip
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  position = 'top',
  className = ''
}) => {
  return (
    <Tooltip content={`${title}: ${content}`} position={position} className={className}>
      <button className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors">
        <HelpCircle size={16} />
        <span className="sr-only">{title}</span>
      </button>
    </Tooltip>
  );
};

// Contextual help component for detailed help
export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  helpId,
  title,
  content,
  steps,
  links
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openHelp = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left - 150) // Center-ish, with margin
      });
    }
    setIsOpen(true);
  };

  const closeHelp = () => {
    setIsOpen(false);
  };

  const helpPanel = isOpen && (
    <div
      className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 pr-4">{title}</h3>
        <button
          onClick={closeHelp}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close help"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">{content}</p>

      {steps && steps.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Steps:</h4>
          <ol className="space-y-1">
            {steps.map((step, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="inline-block w-5 h-5 bg-primary-100 text-primary-700 rounded-full text-xs text-center mr-2 mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {links && links.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Learn More:</h4>
          <div className="space-y-1">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary-600 hover:text-primary-700"
              >
                {link.label} →
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openHelp}
        className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-primary-600 transition-colors"
        aria-label={`Get help about ${title}`}
      >
        <Info size={16} />
      </button>
      
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeHelp}
          aria-hidden="true"
        />
      )}
      
      {typeof window !== 'undefined' && createPortal(helpPanel, document.body)}
    </>
  );
};

// Hook for programmatic help
export const useHelp = () => {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  const showHelp = (helpId: string) => {
    setActiveHelp(helpId);
  };

  const hideHelp = () => {
    setActiveHelp(null);
  };

  return {
    activeHelp,
    showHelp,
    hideHelp
  };
};

// Help context provider
interface HelpContextType {
  showHelp: (helpId: string) => void;
  hideHelp: () => void;
  activeHelp: string | null;
}

const HelpContext = React.createContext<HelpContextType | undefined>(undefined);

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const helpMethods = useHelp();

  return (
    <HelpContext.Provider value={helpMethods}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelpContext = () => {
  const context = React.useContext(HelpContext);
  if (!context) {
    throw new Error('useHelpContext must be used within a HelpProvider');
  }
  return context;
};

// Predefined help content for common elements
export const helpContent = {
  dashboard: {
    title: "Dashboard Overview",
    content: "Your financial overview shows recent transactions, budget progress, and savings goals. Check here daily to stay on top of your finances.",
    steps: [
      "Review your recent transactions",
      "Check budget progress for each category",
      "Monitor your savings goals",
      "View weekly insights and recommendations"
    ]
  },
  transactions: {
    title: "Transaction Management",
    content: "Add, edit, and categorize your transactions. Use swipe gestures for quick approval of SMS-parsed transactions.",
    steps: [
      "Click '+' to add new transactions",
      "Swipe right to approve pending transactions",
      "Swipe left to reject unwanted transactions",
      "Use search and filters to find specific transactions"
    ]
  },
  budgets: {
    title: "Budget Creation",
    content: "Set monthly spending limits for different categories to control your expenses and reach your financial goals.",
    steps: [
      "Click 'Create Budget' to start",
      "Choose categories relevant to your lifestyle",
      "Set realistic monthly limits",
      "Monitor progress throughout the month"
    ]
  },
  smsIntegration: {
    title: "SMS Integration",
    content: "Automatically parse bank SMS messages to create transactions. Supports major Greek banks.",
    steps: [
      "Go to Settings → SMS Integration",
      "Grant SMS permission when prompted",
      "Enable parsing for your banks",
      "Test with a sample SMS"
    ],
    links: [
      { label: "Supported Banks", url: "/help/supported-banks" },
      { label: "SMS Format Guide", url: "/help/sms-formats" }
    ]
  },
  telegramBot: {
    title: "Telegram Bot",
    content: "Use Budgeto's Telegram bot to quickly add transactions and check your balance on the go.",
    steps: [
      "Find @BudgetoBot on Telegram",
      "Send /start to begin",
      "Link your account with /link username",
      "Start adding transactions with natural language"
    ],
    links: [
      { label: "Bot Commands", url: "/help/telegram-commands" }
    ]
  },
  achievements: {
    title: "Achievements & XP",
    content: "Earn experience points and unlock achievements by using Budgeto consistently and reaching financial goals.",
    steps: [
      "Add transactions to earn XP",
      "Stay within budget for bonus XP",
      "Complete weekly goals",
      "Unlock Greek mythology-themed achievements"
    ]
  }
};

export default Tooltip;