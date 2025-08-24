"""
Transaction categorization service with confidence scoring.
This service provides intelligent category suggestions based on transaction descriptions,
amounts, and patterns using rule-based classification with confidence scoring.
"""

import re
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from enum import Enum

class CategoryConfidence(Enum):
    """Confidence levels for category suggestions"""
    VERY_HIGH = 0.9  # 90%+
    HIGH = 0.75      # 75-89%
    MEDIUM = 0.6     # 60-74%
    LOW = 0.4        # 40-59%
    VERY_LOW = 0.2   # 20-39%

class TransactionCategory:
    """Standard transaction categories for Greek students"""
    FOOD = "Food"
    DRINKS = "Drinks"
    TRANSPORT = "Transport"
    SHOPPING = "Shopping"
    ENTERTAINMENT = "Entertainment"
    HEALTH = "Health"
    EDUCATION = "Education"
    TRAVEL = "Travel"
    BILLS = "Bills"
    INCOME = "Income"
    OTHER = "Other"

class CategorizationEngine:
    """
    Advanced categorization engine that analyzes transaction descriptions,
    amounts, and patterns to suggest appropriate categories with confidence scores.
    """
    
    def __init__(self):
        self.category_patterns = self._initialize_patterns()
        self.amount_ranges = self._initialize_amount_ranges()
        self.time_patterns = self._initialize_time_patterns()
        
    def _initialize_patterns(self) -> Dict[str, List[Dict]]:
        """Initialize keyword patterns for each category with weights"""
        return {
            TransactionCategory.FOOD: [
                {"keywords": ["φαγητό", "εστιατόριο", "ταβέρνα", "food", "restaurant", "taverna", "μακντόναλντς", "mcdonalds", "κφc", "kfc", "pizza", "πίτσα", "σουβλάκι", "souvlaki"], "weight": 0.9},
                {"keywords": ["μαγειρεμα", "cooking", "σουπερμάρκετ", "supermarket", "lidl", "σκλαβενίτης", "sklavenitis", "αβ", "ab", "βασιλόπουλος", "vasilopoulos"], "weight": 0.8},
                {"keywords": ["καφές", "coffee", "φραπέ", "frappe", "καφετέρια", "cafeteria", "στάρμπακς", "starbucks"], "weight": 0.75},
                {"keywords": ["γεύμα", "meal", "πρωινό", "breakfast", "μεσημεριανό", "lunch", "δείπνο", "dinner"], "weight": 0.85}
            ],
            TransactionCategory.DRINKS: [
                {"keywords": ["μπύρα", "beer", "κρασί", "wine", "ποτό", "drink", "μπαρ", "bar", "κλαμπ", "club", "cocktail", "κοκτέιλ"], "weight": 0.9},
                {"keywords": ["νερό", "water", "αναψυκτικό", "soft drink", "χυμός", "juice"], "weight": 0.7},
                {"keywords": ["καφές", "coffee", "φραπέ", "frappe"], "weight": 0.6}  # Lower weight as it could be food too
            ],
            TransactionCategory.TRANSPORT: [
                {"keywords": ["λεωφορείο", "bus", "μετρό", "metro", "τραμ", "tram", "ταξί", "taxi", "uber", "beat"], "weight": 0.95},
                {"keywords": ["βενζίνη", "petrol", "καύσιμα", "fuel", "πάρκινγκ", "parking"], "weight": 0.9},
                {"keywords": ["εισιτήριο", "ticket", "κάρτα", "card", "ath.ena", "athena"], "weight": 0.85},
                {"keywords": ["τρένο", "train", "οσε", "ose", "κτελ", "ktel"], "weight": 0.9}
            ],
            TransactionCategory.SHOPPING: [
                {"keywords": ["ρούχα", "clothes", "παπούτσια", "shoes", "zara", "h&m", "bershka", "pull&bear"], "weight": 0.9},
                {"keywords": ["αγορά", "shopping", "κατάστημα", "store", "mall", "μόλ"], "weight": 0.8},
                {"keywords": ["ηλεκτρονικά", "electronics", "τεχνολογία", "technology", "κινητό", "phone", "laptop"], "weight": 0.85},
                {"keywords": ["δώρο", "gift", "present"], "weight": 0.7}
            ],
            TransactionCategory.ENTERTAINMENT: [
                {"keywords": ["σινεμά", "cinema", "ταινία", "movie", "θέατρο", "theater", "συναυλία", "concert"], "weight": 0.95},
                {"keywords": ["παιχνίδι", "game", "gaming", "playstation", "xbox", "netflix", "spotify"], "weight": 0.9},
                {"keywords": ["διασκέδαση", "entertainment", "έξοδος", "night out", "πάρτι", "party"], "weight": 0.8},
                {"keywords": ["γυμναστήριο", "gym", "fitness", "αθλητισμός", "sports"], "weight": 0.85}
            ],
            TransactionCategory.HEALTH: [
                {"keywords": ["φαρμακείο", "pharmacy", "γιατρός", "doctor", "νοσοκομείο", "hospital", "ιατρός", "medical"], "weight": 0.95},
                {"keywords": ["φάρμακα", "medicine", "χάπια", "pills", "θεραπεία", "treatment"], "weight": 0.9},
                {"keywords": ["οδοντίατρος", "dentist", "οφθαλμίατρος", "ophthalmologist"], "weight": 0.95}
            ],
            TransactionCategory.EDUCATION: [
                {"keywords": ["βιβλία", "books", "σχολή", "university", "πανεπιστήμιο", "college", "φοιτητής", "student"], "weight": 0.95},
                {"keywords": ["σημειώσεις", "notes", "μαθήματα", "classes", "εκπαίδευση", "education"], "weight": 0.9},
                {"keywords": ["στυλό", "pen", "χαρτί", "paper", "τετράδιο", "notebook"], "weight": 0.7}
            ],
            TransactionCategory.TRAVEL: [
                {"keywords": ["ταξίδι", "travel", "αεροπλάνο", "airplane", "ξενοδοχείο", "hotel", "airbnb"], "weight": 0.95},
                {"keywords": ["διακοπές", "vacation", "εκδρομή", "trip", "booking", "expedia"], "weight": 0.9},
                {"keywords": ["αποσκευές", "luggage", "βαλίτσα", "suitcase"], "weight": 0.8}
            ],
            TransactionCategory.BILLS: [
                {"keywords": ["λογαριασμός", "bill", "ρεύμα", "electricity", "νερό", "water", "τηλέφωνο", "phone"], "weight": 0.95},
                {"keywords": ["ενοίκιο", "rent", "ασφάλεια", "insurance", "δει", "dei", "ευδαπ", "eydap"], "weight": 0.95},
                {"keywords": ["internet", "ίντερνετ", "wifi", "cosmote", "vodafone", "wind"], "weight": 0.9}
            ],
            TransactionCategory.INCOME: [
                {"keywords": ["μισθός", "salary", "εργασία", "work", "μερική", "part-time", "δουλειά", "job"], "weight": 0.95},
                {"keywords": ["χαρτζιλίκι", "allowance", "δώρο", "gift", "μαμά", "mom", "μπαμπάς", "dad"], "weight": 0.9},
                {"keywords": ["επιστροφή", "refund", "έπαθλο", "prize", "κέρδος", "profit"], "weight": 0.85}
            ]
        }
    
    def _initialize_amount_ranges(self) -> Dict[str, Dict]:
        """Initialize typical amount ranges for each category in EUR"""
        return {
            TransactionCategory.FOOD: {"typical_min": 3, "typical_max": 25, "weight": 0.3},
            TransactionCategory.DRINKS: {"typical_min": 2, "typical_max": 15, "weight": 0.3},
            TransactionCategory.TRANSPORT: {"typical_min": 1, "typical_max": 30, "weight": 0.4},
            TransactionCategory.SHOPPING: {"typical_min": 10, "typical_max": 200, "weight": 0.2},
            TransactionCategory.ENTERTAINMENT: {"typical_min": 5, "typical_max": 50, "weight": 0.3},
            TransactionCategory.HEALTH: {"typical_min": 5, "typical_max": 100, "weight": 0.2},
            TransactionCategory.EDUCATION: {"typical_min": 10, "typical_max": 300, "weight": 0.2},
            TransactionCategory.TRAVEL: {"typical_min": 50, "typical_max": 1000, "weight": 0.3},
            TransactionCategory.BILLS: {"typical_min": 20, "typical_max": 500, "weight": 0.4},
            TransactionCategory.INCOME: {"typical_min": 100, "typical_max": 2000, "weight": 0.4}
        }
    
    def _initialize_time_patterns(self) -> Dict[str, Dict]:
        """Initialize time-based patterns for categories"""
        return {
            TransactionCategory.FOOD: {"peak_hours": [12, 13, 20, 21], "weight": 0.2},
            TransactionCategory.DRINKS: {"peak_hours": [18, 19, 20, 21, 22, 23], "weight": 0.3},
            TransactionCategory.TRANSPORT: {"peak_hours": [7, 8, 9, 17, 18, 19], "weight": 0.3},
            TransactionCategory.ENTERTAINMENT: {"peak_hours": [19, 20, 21, 22, 23], "weight": 0.2},
            TransactionCategory.BILLS: {"peak_hours": [9, 10, 11, 14, 15, 16], "weight": 0.2}
        }
    
    def suggest_category(self, 
                        description: str, 
                        amount: float, 
                        transaction_type: str = "expense",
                        timestamp: Optional[datetime] = None,
                        user_history: Optional[List[Dict]] = None) -> List[Dict]:
        """
        Suggest categories for a transaction with confidence scores.
        
        Args:
            description: Transaction description
            amount: Transaction amount in EUR
            transaction_type: "income" or "expense"
            timestamp: Transaction timestamp
            user_history: User's transaction history for learning
            
        Returns:
            List of category suggestions with confidence scores, sorted by confidence
        """
        if transaction_type == "income":
            return [{"category": TransactionCategory.INCOME, "confidence": 0.95, "reasons": ["Transaction type is income"]}]
        
        suggestions = {}
        
        # Analyze description patterns
        description_scores = self._analyze_description(description.lower())
        
        # Analyze amount patterns
        amount_scores = self._analyze_amount(amount)
        
        # Analyze time patterns
        time_scores = self._analyze_time(timestamp) if timestamp else {}
        
        # Analyze user history patterns
        history_scores = self._analyze_user_history(description, amount, user_history) if user_history else {}
        
        # Combine all scores
        all_categories = set(description_scores.keys()) | set(amount_scores.keys()) | set(time_scores.keys()) | set(history_scores.keys())
        
        for category in all_categories:
            desc_score = description_scores.get(category, {"score": 0, "reasons": []})
            amount_score = amount_scores.get(category, {"score": 0, "reasons": []})
            time_score = time_scores.get(category, {"score": 0, "reasons": []})
            history_score = history_scores.get(category, {"score": 0, "reasons": []})
            
            # Weighted combination
            final_score = (
                desc_score["score"] * 0.5 +  # Description is most important
                amount_score["score"] * 0.25 +  # Amount is moderately important
                time_score["score"] * 0.15 +  # Time is less important
                history_score["score"] * 0.1  # History provides slight boost
            )
            
            # Collect all reasons
            all_reasons = desc_score["reasons"] + amount_score["reasons"] + time_score["reasons"] + history_score["reasons"]
            
            if final_score > 0.1:  # Only include suggestions with reasonable confidence
                suggestions[category] = {
                    "category": category,
                    "confidence": min(final_score, 0.99),  # Cap at 99%
                    "reasons": all_reasons[:3],  # Top 3 reasons
                    "breakdown": {
                        "description": desc_score["score"],
                        "amount": amount_score["score"],
                        "time": time_score["score"],
                        "history": history_score["score"]
                    }
                }
        
        # Sort by confidence and return top 3
        sorted_suggestions = sorted(suggestions.values(), key=lambda x: x["confidence"], reverse=True)
        return sorted_suggestions[:3]
    
    def _analyze_description(self, description: str) -> Dict[str, Dict]:
        """Analyze transaction description for category clues"""
        scores = {}
        
        for category, pattern_groups in self.category_patterns.items():
            max_score = 0
            best_reasons = []
            
            for pattern_group in pattern_groups:
                keywords = pattern_group["keywords"]
                weight = pattern_group["weight"]
                
                matches = []
                for keyword in keywords:
                    if keyword in description:
                        matches.append(keyword)
                
                if matches:
                    # Score based on number of matches and weight
                    match_score = (len(matches) / len(keywords)) * weight
                    if match_score > max_score:
                        max_score = match_score
                        best_reasons = [f"Contains '{match}'" for match in matches[:2]]
            
            if max_score > 0:
                scores[category] = {
                    "score": max_score,
                    "reasons": best_reasons
                }
        
        return scores
    
    def _analyze_amount(self, amount: float) -> Dict[str, Dict]:
        """Analyze transaction amount for category clues"""
        scores = {}
        
        for category, range_info in self.amount_ranges.items():
            typical_min = range_info["typical_min"]
            typical_max = range_info["typical_max"]
            weight = range_info["weight"]
            
            if typical_min <= amount <= typical_max:
                # Perfect fit
                score = weight * 0.8
                reason = f"Amount €{amount:.2f} typical for {category.lower()}"
            elif amount < typical_min:
                # Below typical range
                distance = typical_min - amount
                score = max(0, weight * (0.5 - distance / typical_min))
                reason = f"Amount slightly low for {category.lower()}"
            else:
                # Above typical range
                distance = amount - typical_max
                score = max(0, weight * (0.5 - distance / typical_max))
                reason = f"Amount slightly high for {category.lower()}"
            
            if score > 0.1:
                scores[category] = {
                    "score": score,
                    "reasons": [reason]
                }
        
        return scores
    
    def _analyze_time(self, timestamp: datetime) -> Dict[str, Dict]:
        """Analyze transaction time for category clues"""
        scores = {}
        hour = timestamp.hour
        
        for category, time_info in self.time_patterns.items():
            peak_hours = time_info["peak_hours"]
            weight = time_info["weight"]
            
            if hour in peak_hours:
                score = weight
                reason = f"Common time for {category.lower()} ({hour}:00)"
                scores[category] = {
                    "score": score,
                    "reasons": [reason]
                }
        
        return scores
    
    def _analyze_user_history(self, description: str, amount: float, history: List[Dict]) -> Dict[str, Dict]:
        """Analyze user's transaction history for patterns"""
        scores = {}
        
        # Look for similar transactions in history
        similar_transactions = []
        for transaction in history[-50:]:  # Look at last 50 transactions
            if abs(transaction.get("amount", 0) - amount) < amount * 0.3:  # Within 30% of amount
                # Check for similar words in description
                desc_words = set(description.lower().split())
                hist_words = set(transaction.get("description", "").lower().split())
                if len(desc_words & hist_words) > 0:
                    similar_transactions.append(transaction)
        
        # If we found similar transactions, boost their categories
        if similar_transactions:
            category_counts = {}
            for transaction in similar_transactions:
                category = transaction.get("category")
                if category:
                    category_counts[category] = category_counts.get(category, 0) + 1
            
            total_similar = len(similar_transactions)
            for category, count in category_counts.items():
                confidence = (count / total_similar) * 0.4  # Max 40% boost from history
                scores[category] = {
                    "score": confidence,
                    "reasons": [f"Similar to {count} previous transactions"]
                }
        
        return scores
    
    def get_confidence_level(self, confidence: float) -> CategoryConfidence:
        """Convert numerical confidence to categorical level"""
        if confidence >= 0.9:
            return CategoryConfidence.VERY_HIGH
        elif confidence >= 0.75:
            return CategoryConfidence.HIGH
        elif confidence >= 0.6:
            return CategoryConfidence.MEDIUM
        elif confidence >= 0.4:
            return CategoryConfidence.LOW
        else:
            return CategoryConfidence.VERY_LOW
    
    def explain_suggestion(self, suggestion: Dict) -> str:
        """Generate human-readable explanation for a category suggestion"""
        category = suggestion["category"]
        confidence = suggestion["confidence"]
        reasons = suggestion["reasons"]
        
        confidence_level = self.get_confidence_level(confidence)
        
        explanation = f"I'm {confidence_level.name.lower().replace('_', ' ')} confident this is {category}"
        
        if reasons:
            explanation += f" because: {', '.join(reasons[:2])}"
        
        return explanation

# Example usage and testing
if __name__ == "__main__":
    engine = CategorizationEngine()
    
    # Test cases
    test_transactions = [
        {"description": "McDonald's Athens", "amount": 8.50, "type": "expense"},
        {"description": "Metro ticket", "amount": 1.40, "type": "expense"},
        {"description": "Σουβλάκι Κώστας", "amount": 6.00, "type": "expense"},
        {"description": "Zara shopping", "amount": 45.00, "type": "expense"},
        {"description": "Cinema ticket", "amount": 9.00, "type": "expense"},
        {"description": "Part-time job", "amount": 800.00, "type": "income"},
        {"description": "Φαρμακείο Αθήνας", "amount": 12.50, "type": "expense"},
        {"description": "University books", "amount": 120.00, "type": "expense"}
    ]
    
    for transaction in test_transactions:
        suggestions = engine.suggest_category(
            transaction["description"], 
            transaction["amount"], 
            transaction["type"]
        )
        
        print(f"\nTransaction: {transaction['description']} - €{transaction['amount']}")
        for i, suggestion in enumerate(suggestions, 1):
            confidence_pct = suggestion["confidence"] * 100
            print(f"  {i}. {suggestion['category']} ({confidence_pct:.1f}%)")
            print(f"     {engine.explain_suggestion(suggestion)}")