import re
from typing import Optional, Dict, List, Tuple, Any
from decimal import Decimal, InvalidOperation
from dataclasses import dataclass, field
from datetime import datetime
from app.models.enums import TransactionType, TransactionCategory
import logging

logger = logging.getLogger(__name__)

@dataclass
class ParsedTransaction:
    """Enhanced parsed transaction data from SMS"""
    amount: Decimal
    type: TransactionType
    description: str
    suggested_category: TransactionCategory
    bank: str
    confidence: float  # 0.0 to 1.0
    
    # Enhanced fields
    timestamp: Optional[datetime] = None
    merchant: Optional[str] = None
    location: Optional[str] = None
    transaction_id: Optional[str] = None
    card_last_digits: Optional[str] = None
    currency: str = "EUR"
    raw_text: str = ""
    errors: List[str] = field(default_factory=list)
    parsing_method: str = "unknown"  # bank_specific, generic, fallback

class EnhancedGreekSMSParser:
    """Enhanced parser for Greek bank SMS messages with improved accuracy"""
    
    # Comprehensive bank patterns with multiple variations
    BANK_PATTERNS = {
        'NBG': {
            'debit': [
                # Standard purchase patterns
                r'NBG.*?(?:Αγορά|Purchase).*?(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'NBG.*?-(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'NBG.*?Debit.*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                # Card transactions
                r'NBG.*?Card.*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                # ATM withdrawals
                r'NBG.*?(?:ATM|ΑΤΜ).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            ],
            'credit': [
                r'NBG.*?(?:Πίστωση|Credit|Deposit).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
                r'NBG.*?\+(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
                r'NBG.*?(?:Transfer|Μεταφορά).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            ]
        },
        'EUROBANK': {
            'debit': [
                r'Eurobank.*?(?:Αγορά|Purchase).*?(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'Eurobank.*?-(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'Eurobank.*?(?:Debit|Χρέωση).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'Eurobank.*?Card.*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]+?)(?:\s*,|\s*\.|$)',
            ],
            'credit': [
                r'Eurobank.*?(?:Πίστωση|Credit).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
                r'Eurobank.*?\+(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            ]
        },
        'ALPHA': {
            'debit': [
                r'Alpha.*?(?:Αγορά|Purchase).*?(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'Alpha.*?-(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'Alpha.*?(?:Debit|Χρέωση).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]+?)(?:\s*,|\s*\.|$)',
            ],
            'credit': [
                r'Alpha.*?(?:Πίστωση|Credit).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
                r'Alpha.*?\+(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            ]
        },
        'PIRAEUS': {
            'debit': [
                r'Piraeus.*?(?:Αγορά|Purchase).*?(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'Piraeus.*?-(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'Piraeus.*?(?:Debit|Χρέωση).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]+?)(?:\s*,|\s*\.|$)',
            ],
            'credit': [
                r'Piraeus.*?(?:Πίστωση|Credit).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
                r'Piraeus.*?\+(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            ]
        },
        'IRIS': {
            'debit': [
                r'IRIS.*?(?:Payment|Πληρωμή).*?(\d+[,\.]\d{2})\s*EUR.*?(?:to|σε)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'IRIS.*?-(\d+[,\.]\d{2})\s*EUR.*?(?:to|σε)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
            ],
            'credit': [
                r'IRIS.*?(?:Received|Παραλαβή).*?(\d+[,\.]\d{2})\s*EUR.*?(?:from|από)\s*([^,\n\r]*?)(?:\s*,|\s*\.|$)',
                r'IRIS.*?\+(\d+[,\.]\d{2})\s*EUR.*?(?:from|από)\s*([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            ]
        },
        # Digital payment services
        'PAYPAL': {
            'debit': [
                r'PayPal.*?(?:Payment|Πληρωμή).*?(\d+[,\.]\d{2})\s*EUR.*?(?:to|σε)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'PayPal.*?-(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]+?)(?:\s*,|\s*\.|$)',
            ],
            'credit': [
                r'PayPal.*?(?:Received|Παραλαβή).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
                r'PayPal.*?\+(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            ]
        },
        'REVOLUT': {
            'debit': [
                r'Revolut.*?(?:Payment|Spent).*?(\d+[,\.]\d{2})\s*EUR.*?(?:at|στο)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
                r'Revolut.*?-(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]+?)(?:\s*,|\s*\.|$)',
            ],
            'credit': [
                r'Revolut.*?(?:Received|Added).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
                r'Revolut.*?\+(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            ]
        }
    }
    
    # Enhanced category keywords with both English and Greek terms
    CATEGORY_KEYWORDS = {
        TransactionCategory.FOOD: [
            'taverna', 'restaurant', 'café', 'coffee', 'food', 'market', 'supermarket',
            'φαγητό', 'ταβέρνα', 'εστιατόριο', 'καφέ', 'σούπερ', 'market',
            'lidl', 'sklavenitis', 'carrefour', 'ab', 'masoutis', 'galaxy',
            'mediterranean', 'greek', 'pizza', 'burger', 'sandwich', 'bakery',
            'φούρνος', 'αρτοποιείο', 'κρεοπωλείο', 'οπωροπωλείο'
        ],
        TransactionCategory.DRINKS: [
            'bar', 'club', 'pub', 'drinks', 'alcohol', 'beer', 'wine', 'cocktail',
            'μπαρ', 'ποτά', 'αλκοόλ', 'μπίρα', 'κρασί', 'κοκτέιλ',
            'cafe', 'καφετέρια', 'στέκι', 'lounge'
        ],
        TransactionCategory.TRANSPORT: [
            'metro', 'bus', 'taxi', 'uber', 'beat', 'train', 'λεωφορείο',
            'ταξί', 'τρένο', 'μετρό', 'οασα', 'αττικό', 'κτελ',
            'fuel', 'petrol', 'βενζίνη', 'καύσιμα', 'parking', 'παρκινγκ',
            'toll', 'διόδια', 'ferry', 'πλοίο'
        ],
        TransactionCategory.SHOPPING: [
            'shop', 'store', 'mall', 'amazon', 'public', 'zara', 'h&m',
            'μαγαζί', 'κατάστημα', 'αγορές', 'golden hall', 'mall',
            'outlet', 'fashion', 'clothing', 'ρούχα', 'παπούτσια',
            'electronics', 'ηλεκτρονικά', 'mobile', 'κινητό'
        ],
        TransactionCategory.ENTERTAINMENT: [
            'cinema', 'movie', 'theater', 'concert', 'club', 'game',
            'κινηματογράφος', 'θέατρο', 'συναυλία', 'ψυχαγωγία',
            'netflix', 'spotify', 'youtube', 'gaming', 'steam',
            'festival', 'event', 'εκδήλωση', 'show'
        ],
        TransactionCategory.EDUCATION: [
            'university', 'school', 'book', 'library', 'course',
            'πανεπιστήμιο', 'σχολή', 'βιβλίο', 'μάθημα', 'σπουδές',
            'tuition', 'δίδακτρα', 'seminar', 'workshop', 'training'
        ],
        TransactionCategory.HEALTH: [
            'pharmacy', 'doctor', 'hospital', 'medical', 'health',
            'φαρμακείο', 'γιατρός', 'νοσοκομείο', 'ιατρικός', 'υγεία',
            'clinic', 'κλινική', 'dentist', 'οδοντίατρος', 'lab', 'εργαστήριο'
        ],
        TransactionCategory.RENT: [
            'rent', 'ενοίκιο', 'lease', 'μίσθωση', 'housing', 'στέγαση',
            'apartment', 'διαμέρισμα', 'utilities', 'κοινόχρηστα'
        ]
    }

    def __init__(self):
        """Initialize the enhanced SMS parser"""
        self.transaction_type_keywords = {
            'income': [
                'πίστωση', 'credit', 'received', 'παραλαβή', 'deposit', 
                'κατάθεση', 'εισόδημα', 'salary', 'μισθός', 'refund', 'επιστροφή'
            ],
            'expense': [
                'αγορά', 'purchase', 'payment', 'πληρωμή', 'debit', 'χρέωση',
                'spent', 'έξοδο', 'withdrawal', 'ανάληψη'
            ]
        }

    def parse_sms(self, sms_text: str) -> Optional[ParsedTransaction]:
        """
        Parse a Greek bank SMS with enhanced accuracy and error handling
        
        Args:
            sms_text: The SMS message text
            
        Returns:
            ParsedTransaction object or None if parsing fails
        """
        if not sms_text or not sms_text.strip():
            return None
            
        sms_text = sms_text.strip()
        errors = []
        
        try:
            # Stage 1: Bank-specific patterns (highest confidence)
            result = self._parse_with_bank_patterns(sms_text)
            if result:
                result.raw_text = sms_text
                result.parsing_method = "bank_specific"
                logger.info(f"Successfully parsed SMS with bank-specific pattern: {result.bank}")
                return result
                
            # Stage 2: Generic patterns (medium confidence)
            result = self._parse_with_generic_patterns(sms_text)
            if result:
                result.raw_text = sms_text
                result.parsing_method = "generic"
                logger.info("Successfully parsed SMS with generic pattern")
                return result
                
            # Stage 3: Fallback patterns (low confidence)
            result = self._parse_with_fallback_patterns(sms_text)
            if result:
                result.raw_text = sms_text
                result.parsing_method = "fallback"
                result.errors.append("Low confidence parsing - manual verification recommended")
                logger.warning("Parsed SMS with fallback pattern - low confidence")
                return result
                
            logger.warning(f"Failed to parse SMS: {sms_text[:100]}...")
            return None
            
        except Exception as e:
            logger.error(f"Error parsing SMS: {str(e)}")
            return None

    def _parse_with_bank_patterns(self, sms_text: str) -> Optional[ParsedTransaction]:
        """Parse using bank-specific patterns"""
        for bank, patterns in self.BANK_PATTERNS.items():
            # Try debit patterns
            for pattern in patterns['debit']:
                match = re.search(pattern, sms_text, re.IGNORECASE | re.DOTALL)
                if match:
                    return self._create_transaction_from_match(
                        match, TransactionType.EXPENSE, bank, 0.9, sms_text
                    )
            
            # Try credit patterns  
            for pattern in patterns['credit']:
                match = re.search(pattern, sms_text, re.IGNORECASE | re.DOTALL)
                if match:
                    return self._create_transaction_from_match(
                        match, TransactionType.INCOME, bank, 0.9, sms_text
                    )
        return None

    def _parse_with_generic_patterns(self, sms_text: str) -> Optional[ParsedTransaction]:
        """Parse using generic patterns for any bank"""
        generic_patterns = [
            # Standard debit patterns
            r'(?:αγορά|purchase|payment|πληρωμή).*?(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at|σε)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
            r'-(\d+[,\.]\d{2})\s*EUR.*?(?:στο|at|σε)\s*([^,\n\r]+?)(?:\s*,|\s*\.|$)',
            # Standard credit patterns
            r'(?:πίστωση|credit|received|παραλαβή).*?(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
            r'\+(\d+[,\.]\d{2})\s*EUR.*?([^,\n\r]*?)(?:\s*,|\s*\.|$)',
        ]
        
        for pattern in generic_patterns:
            match = re.search(pattern, sms_text, re.IGNORECASE | re.DOTALL)
            if match:
                transaction_type = self._determine_transaction_type(sms_text, pattern)
                return self._create_transaction_from_match(
                    match, transaction_type, "Unknown", 0.7, sms_text
                )
        return None

    def _parse_with_fallback_patterns(self, sms_text: str) -> Optional[ParsedTransaction]:
        """Parse using fallback patterns as last resort"""
        fallback_patterns = [
            r'(\d+[,\.]\d{2})\s*EUR',
            r'(\d+[,\.]\d{2})\s*€',
            r'EUR\s*(\d+[,\.]\d{2})',
            r'€\s*(\d+[,\.]\d{2})',
        ]
        
        for pattern in fallback_patterns:
            match = re.search(pattern, sms_text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    amount = Decimal(amount_str)
                    transaction_type = self._guess_transaction_type(sms_text)
                    suggested_category = self._suggest_category(sms_text)
                    
                    return ParsedTransaction(
                        amount=amount,
                        type=transaction_type,
                        description="SMS Transaction",
                        suggested_category=suggested_category,
                        bank="Unknown",
                        confidence=0.4,
                        errors=["Low confidence parsing"]
                    )
                except (ValueError, InvalidOperation):
                    continue
        return None

    def _create_transaction_from_match(
        self, 
        match: re.Match, 
        transaction_type: TransactionType, 
        bank: str, 
        base_confidence: float,
        sms_text: str
    ) -> Optional[ParsedTransaction]:
        """Create ParsedTransaction from regex match"""
        try:
            amount_str = match.group(1).replace(',', '.')
            amount = Decimal(amount_str)
            
            # Extract description/merchant info
            description = "Unknown transaction"
            merchant = None
            
            if len(match.groups()) > 1 and match.group(2):
                description = match.group(2).strip()
                merchant = self._extract_merchant_name(description)
                
            # Clean up description
            description = self._clean_description(description)
            
            # Suggest category
            suggested_category = self._suggest_category(description)
            
            # Calculate confidence based on description quality
            confidence = self._calculate_confidence(base_confidence, description, amount)
            
            # Extract additional info
            transaction_id = self._extract_transaction_id(sms_text)
            card_digits = self._extract_card_digits(sms_text)
            location = self._extract_location(sms_text)
            
            return ParsedTransaction(
                amount=amount,
                type=transaction_type,
                description=description,
                suggested_category=suggested_category,
                bank=bank,
                confidence=confidence,
                merchant=merchant,
                transaction_id=transaction_id,
                card_last_digits=card_digits,
                location=location
            )
            
        except (ValueError, InvalidOperation, IndexError) as e:
            logger.warning(f"Error creating transaction from match: {str(e)}")
            return None

    def _determine_transaction_type(self, sms_text: str, pattern: str) -> TransactionType:
        """Determine transaction type based on SMS content and pattern"""
        sms_lower = sms_text.lower()
        
        # Check if pattern indicates credit
        if 'credit' in pattern or 'πίστωση' in pattern or '+' in pattern:
            return TransactionType.INCOME
        elif 'debit' in pattern or 'αγορά' in pattern or '-' in pattern:
            return TransactionType.EXPENSE
            
        # Fallback to keyword analysis
        return self._guess_transaction_type(sms_text)

    def _guess_transaction_type(self, sms_text: str) -> TransactionType:
        """Guess transaction type based on keywords"""
        sms_lower = sms_text.lower()
        
        income_score = sum(1 for keyword in self.transaction_type_keywords['income'] 
                          if keyword in sms_lower)
        expense_score = sum(1 for keyword in self.transaction_type_keywords['expense'] 
                           if keyword in sms_lower)
        
        return TransactionType.INCOME if income_score > expense_score else TransactionType.EXPENSE

    def _suggest_category(self, text: str) -> TransactionCategory:
        """Suggest a category based on transaction description with enhanced scoring"""
        if not text:
            return TransactionCategory.OTHER
            
        text_lower = text.lower()
        
        # Calculate weighted scores for each category
        category_scores = {}
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    # Give higher weight to exact matches and longer keywords
                    weight = len(keyword) / 5.0  # Longer keywords get higher weight
                    if text_lower == keyword.lower():
                        weight *= 2  # Exact match bonus
                    score += weight
            
            if score > 0:
                category_scores[category] = score
        
        if category_scores:
            # Return category with highest score
            best_category = max(category_scores, key=category_scores.get)
            logger.debug(f"Category suggestion for '{text}': {best_category} (score: {category_scores[best_category]})")
            return best_category
        
        return TransactionCategory.OTHER

    def _clean_description(self, description: str) -> str:
        """Clean and normalize description text"""
        if not description:
            return "Unknown transaction"
            
        # Remove common bank-specific prefixes and suffixes
        cleaned = description.strip()
        
        # Remove timestamps and dates
        cleaned = re.sub(r'\d{2}[/\-]\d{2}[/\-]\d{2,4}', '', cleaned)
        cleaned = re.sub(r'\d{2}:\d{2}', '', cleaned)
        
        # Remove card numbers and reference codes
        cleaned = re.sub(r'\*{4}\d{4}', '', cleaned)
        cleaned = re.sub(r'REF[:\s]*\w+', '', cleaned, re.IGNORECASE)
        
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Capitalize first letter
        if cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:] if len(cleaned) > 1 else cleaned.upper()
            
        return cleaned if cleaned else "Unknown transaction"

    def _extract_merchant_name(self, description: str) -> Optional[str]:
        """Extract merchant name from description"""
        if not description:
            return None
            
        # Remove common prefixes
        merchant = re.sub(r'^(at|στο|σε)\s+', '', description, flags=re.IGNORECASE)
        
        # Take first meaningful part (before comma, period, or newline)
        merchant = re.split(r'[,\n\r]', merchant)[0].strip()
        
        # Remove card info and reference codes
        merchant = re.sub(r'\*{4}\d{4}.*', '', merchant)
        merchant = re.sub(r'REF.*', '', merchant, re.IGNORECASE)
        
        merchant = merchant.strip()
        return merchant if merchant and len(merchant) > 2 else None

    def _extract_transaction_id(self, sms_text: str) -> Optional[str]:
        """Extract transaction ID from SMS"""
        patterns = [
            r'REF[:\s]*(\w+)',
            r'ID[:\s]*(\w+)',
            r'TXN[:\s]*(\w+)',
            r'Transaction[:\s]*(\w+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, sms_text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def _extract_card_digits(self, sms_text: str) -> Optional[str]:
        """Extract last 4 digits of card from SMS"""
        patterns = [
            r'\*{4}(\d{4})',
            r'ending\s+(\d{4})',
            r'λήγει\s+(\d{4})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, sms_text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def _extract_location(self, sms_text: str) -> Optional[str]:
        """Extract location information from SMS"""
        location_patterns = [
            r'(?:στο|at|σε)\s+([^,\n\r]+?)\s+(?:ATHENS|THESSALONIKI|PATRAS|GREECE)',
            r'(?:ATHENS|THESSALONIKI|PATRAS)\s+([^,\n\r]+)',
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, sms_text, re.IGNORECASE)
            if match:
                location = match.group(1).strip()
                # Clean up location
                location = re.sub(r'[^a-zA-Zα-ωΑ-Ω\s]', '', location).strip()
                if len(location) > 3:
                    return location
        return None

    def _calculate_confidence(self, base_confidence: float, description: str, amount: Decimal) -> float:
        """Calculate parsing confidence based on various factors"""
        confidence = base_confidence
        
        # Adjust based on description quality
        if description and description != "Unknown transaction":
            if len(description) > 10:
                confidence += 0.05  # Bonus for detailed description
            if any(keyword in description.lower() for keywords in self.CATEGORY_KEYWORDS.values() for keyword in keywords):
                confidence += 0.05  # Bonus for recognizable merchant/category
        else:
            confidence -= 0.1  # Penalty for poor description
            
        # Adjust based on amount reasonableness
        if 0.01 <= amount <= 10000:  # Reasonable transaction amounts
            confidence += 0.02
        elif amount > 10000:
            confidence -= 0.05  # High amounts are less common
            
        # Ensure confidence stays within bounds
        return max(0.0, min(1.0, confidence))

    def get_parsing_stats(self, sms_texts: List[str]) -> Dict[str, Any]:
        """Get parsing statistics for a list of SMS texts"""
        stats = {
            'total_messages': len(sms_texts),
            'successfully_parsed': 0,
            'parsing_methods': {'bank_specific': 0, 'generic': 0, 'fallback': 0},
            'banks_detected': {},
            'avg_confidence': 0.0,
            'categories_detected': {},
            'errors': []
        }
        
        total_confidence = 0.0
        
        for sms_text in sms_texts:
            try:
                result = self.parse_sms(sms_text)
                if result:
                    stats['successfully_parsed'] += 1
                    stats['parsing_methods'][result.parsing_method] += 1
                    
                    # Track bank distribution
                    bank = result.bank
                    stats['banks_detected'][bank] = stats['banks_detected'].get(bank, 0) + 1
                    
                    # Track category distribution
                    category = result.suggested_category.value
                    stats['categories_detected'][category] = stats['categories_detected'].get(category, 0) + 1
                    
                    total_confidence += result.confidence
                    
                    if result.errors:
                        stats['errors'].extend(result.errors)
                        
            except Exception as e:
                stats['errors'].append(f"Parsing error: {str(e)}")
        
        if stats['successfully_parsed'] > 0:
            stats['avg_confidence'] = total_confidence / stats['successfully_parsed']
            stats['success_rate'] = stats['successfully_parsed'] / stats['total_messages']
        else:
            stats['success_rate'] = 0.0
            
        return stats