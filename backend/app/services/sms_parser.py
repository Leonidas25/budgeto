import re
from typing import Optional, Dict, Tuple
from decimal import Decimal
from dataclasses import dataclass
from app.models.enums import TransactionType, TransactionCategory

@dataclass
class ParsedTransaction:
    """Parsed transaction data from SMS"""
    amount: Decimal
    type: TransactionType
    description: str
    suggested_category: TransactionCategory
    bank: str
    confidence: float  # 0.0 to 1.0

class GreekSMSParser:
    """Parser for Greek bank SMS messages"""
    
    # Bank SMS patterns for different Greek banks
    BANK_PATTERNS = {
        'NBG': {
            'debit': [
                r'NBG.*?Αγορά.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'NBG.*?Purchase.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'NBG.*?-(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ],
            'credit': [
                r'NBG.*?Πίστωση.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'NBG.*?Credit.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'NBG.*?\+(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ]
        },
        'EUROBANK': {
            'debit': [
                r'Eurobank.*?Αγορά.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Eurobank.*?Purchase.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Eurobank.*?-(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ],
            'credit': [
                r'Eurobank.*?Πίστωση.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Eurobank.*?Credit.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Eurobank.*?\+(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ]
        },
        'ALPHA': {
            'debit': [
                r'Alpha Bank.*?Αγορά.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Alpha Bank.*?Purchase.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Alpha.*?-(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ],
            'credit': [
                r'Alpha Bank.*?Πίστωση.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Alpha Bank.*?Credit.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Alpha.*?\+(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ]
        },
        'PIRAEUS': {
            'debit': [
                r'Piraeus.*?Αγορά.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Piraeus.*?Purchase.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Piraeus.*?-(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ],
            'credit': [
                r'Piraeus.*?Πίστωση.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Piraeus.*?Credit.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'Piraeus.*?\+(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ]
        },
        'IRIS': {
            'debit': [
                r'IRIS.*?Payment.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'IRIS.*?Πληρωμή.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'IRIS.*?-(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ],
            'credit': [
                r'IRIS.*?Received.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'IRIS.*?Παραλαβή.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
                r'IRIS.*?\+(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
            ]
        }
    }
    
    # Category mapping based on keywords
    CATEGORY_KEYWORDS = {
        TransactionCategory.FOOD: [
            'taverna', 'restaurant', 'café', 'coffee', 'food', 'market',
            'supermarket', 'φαγητό', 'ταβέρνα', 'εστιατόριο', 'καφέ',
            'σούπερ', 'market', 'lidl', 'sklavenitis', 'carrefour', 'ab'
        ],
        TransactionCategory.DRINKS: [
            'bar', 'club', 'pub', 'drinks', 'alcohol', 'beer', 'wine',
            'μπαρ', 'ποτά', 'αλκοόλ', 'μπίρα', 'κρασί'
        ],
        TransactionCategory.TRANSPORT: [
            'metro', 'bus', 'taxi', 'uber', 'beat', 'train', 'λεωφορείο',
            'ταξί', 'τρένο', 'μετρό', 'οασα', 'αττικό'
        ],
        TransactionCategory.SHOPPING: [
            'shop', 'store', 'mall', 'amazon', 'public', 'zara', 'h&m',
            'μαγαζί', 'κατάστημα', 'αγορές'
        ],
        TransactionCategory.ENTERTAINMENT: [
            'cinema', 'movie', 'theater', 'concert', 'club', 'game',
            'κινηματογράφος', 'θέατρο', 'συναυλία', 'ψυχαγωγία'
        ],
        TransactionCategory.EDUCATION: [
            'university', 'school', 'book', 'library', 'course',
            'πανεπιστήμιο', 'σχολή', 'βιβλίο', 'μάθημα'
        ],
        TransactionCategory.HEALTH: [
            'pharmacy', 'doctor', 'hospital', 'medical', 'health',
            'φαρμακείο', 'γιατρός', 'νοσοκομείο', 'ιατρικός'
        ]
    }
    
    def parse_sms(self, sms_text: str) -> Optional[ParsedTransaction]:
        """Parse a Greek bank SMS and extract transaction information"""
        sms_text = sms_text.strip()
        
        # Try to parse with each bank pattern
        for bank, patterns in self.BANK_PATTERNS.items():
            # Check debit patterns
            for pattern in patterns['debit']:
                match = re.search(pattern, sms_text, re.IGNORECASE | re.DOTALL)
                if match:
                    amount_str = match.group(1).replace(',', '.')
                    description = match.group(2).strip() if len(match.groups()) > 1 else "Unknown transaction"
                    
                    try:
                        amount = Decimal(amount_str)
                        suggested_category = self._suggest_category(description)
                        
                        return ParsedTransaction(
                            amount=amount,
                            type=TransactionType.EXPENSE,
                            description=description,
                            suggested_category=suggested_category,
                            bank=bank,
                            confidence=0.9
                        )
                    except (ValueError, decimal.InvalidOperation):
                        continue
            
            # Check credit patterns
            for pattern in patterns['credit']:
                match = re.search(pattern, sms_text, re.IGNORECASE | re.DOTALL)
                if match:
                    amount_str = match.group(1).replace(',', '.')
                    description = match.group(2).strip() if len(match.groups()) > 1 else "Unknown transaction"
                    
                    try:
                        amount = Decimal(amount_str)
                        
                        return ParsedTransaction(
                            amount=amount,
                            type=TransactionType.INCOME,
                            description=description,
                            suggested_category=TransactionCategory.OTHER,
                            bank=bank,
                            confidence=0.9
                        )
                    except (ValueError, decimal.InvalidOperation):
                        continue
        
        # Try fallback pattern for any bank SMS with amount and EUR
        fallback_pattern = r'(\d+[,\.]\d{2}).*?EUR'
        match = re.search(fallback_pattern, sms_text, re.IGNORECASE)
        if match:
            amount_str = match.group(1).replace(',', '.')
            try:
                amount = Decimal(amount_str)
                # Assume expense if we can't determine type
                transaction_type = self._guess_transaction_type(sms_text)
                suggested_category = self._suggest_category(sms_text)
                
                return ParsedTransaction(
                    amount=amount,
                    type=transaction_type,
                    description="Parsed from SMS",
                    suggested_category=suggested_category,
                    bank="Unknown",
                    confidence=0.6
                )
            except (ValueError, decimal.InvalidOperation):
                pass
        
        return None
    
    def _suggest_category(self, text: str) -> TransactionCategory:
        """Suggest a category based on transaction description"""
        text_lower = text.lower()
        
        # Count keyword matches for each category
        category_scores = {}
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword.lower() in text_lower)
            if score > 0:
                category_scores[category] = score
        
        # Return category with highest score, default to OTHER
        if category_scores:
            return max(category_scores, key=category_scores.get)
        
        return TransactionCategory.OTHER
    
    def _guess_transaction_type(self, sms_text: str) -> TransactionType:
        """Guess transaction type based on SMS content"""
        sms_lower = sms_text.lower()
        
        # Keywords that indicate income
        income_keywords = ['πίστωση', 'credit', 'received', 'παραλαβή', '+', 'εισόδημα']
        # Keywords that indicate expense
        expense_keywords = ['αγορά', 'purchase', 'payment', 'πληρωμή', '-', 'έξοδο']
        
        income_score = sum(1 for keyword in income_keywords if keyword in sms_lower)
        expense_score = sum(1 for keyword in expense_keywords if keyword in sms_lower)
        
        return TransactionType.INCOME if income_score > expense_score else TransactionType.EXPENSE