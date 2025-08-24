import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import User
from app.services.enhanced_sms_parser import EnhancedGreekSMSParser


class TestSMSAPI:
    """Test suite for SMS parsing endpoints"""

    def test_parse_sms_success_nbg(self, client: TestClient, auth_headers: dict):
        """Test successful SMS parsing for NBG"""
        sms_data = {
            "sms_text": "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND ATHENS"
        }
        
        response = client.post("/api/sms/parse", json=sms_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["transaction"] is not None
        assert data["confidence"] is not None
        assert data["confidence"] > 0.5
        
        transaction = data["transaction"]
        assert transaction["amount"] == "15.50"
        assert transaction["type"] == "expense"
        assert transaction["source"] == "SMS"
        assert transaction["state"] == "Pending"

    def test_parse_sms_success_eurobank(self, client: TestClient, auth_headers: dict):
        """Test successful SMS parsing for Eurobank"""
        sms_data = {
            "sms_text": "Eurobank: Purchase 25.00 EUR at SUPERMARKET AB"
        }
        
        response = client.post("/api/sms/parse", json=sms_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["transaction"]["amount"] == "25.00"
        assert data["bank_detected"] == "EUROBANK"

    def test_parse_sms_success_alpha(self, client: TestClient, auth_headers: dict):
        """Test successful SMS parsing for Alpha Bank"""
        sms_data = {
            "sms_text": "Alpha Bank: Αγορά 45.80 EUR στο TAVERNA ZORBA"
        }
        
        response = client.post("/api/sms/parse", json=sms_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["transaction"]["amount"] == "45.80"
        assert data["bank_detected"] == "ALPHA"

    def test_parse_sms_success_iris(self, client: TestClient, auth_headers: dict):
        """Test successful SMS parsing for IRIS"""
        sms_data = {
            "sms_text": "IRIS: Payment 3.50 EUR - Metro ticket"
        }
        
        response = client.post("/api/sms/parse", json=sms_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["transaction"]["amount"] == "3.50"
        assert data["bank_detected"] == "IRIS"

    def test_parse_sms_credit_transaction(self, client: TestClient, auth_headers: dict):
        """Test parsing credit/income SMS"""
        sms_data = {
            "sms_text": "NBG: Πίστωση 200.00 EUR - Monthly allowance"
        }
        
        response = client.post("/api/sms/parse", json=sms_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["transaction"]["type"] == "income"
        assert data["transaction"]["amount"] == "200.00"

    def test_parse_sms_failed_parsing(self, client: TestClient, auth_headers: dict):
        """Test SMS that cannot be parsed"""
        sms_data = {
            "sms_text": "This is not a bank SMS message"
        }
        
        response = client.post("/api/sms/parse", json=sms_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "Could not parse SMS" in data["message"]

    def test_parse_sms_empty_text(self, client: TestClient, auth_headers: dict):
        """Test parsing empty SMS text"""
        sms_data = {
            "sms_text": ""
        }
        
        response = client.post("/api/sms/parse", json=sms_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "SMS text cannot be empty" in data["message"]

    def test_parse_sms_unauthorized(self, client: TestClient):
        """Test SMS parsing without authentication"""
        sms_data = {
            "sms_text": "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND"
        }
        
        response = client.post("/api/sms/parse", json=sms_data)
        
        assert response.status_code == 401

    def test_batch_parse_sms_success(self, client: TestClient, auth_headers: dict):
        """Test batch SMS parsing"""
        batch_data = {
            "sms_texts": [
                "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND",
                "Eurobank: Purchase 25.00 EUR at SUPERMARKET",
                "This will fail to parse"
            ],
            "auto_approve_high_confidence": False,
            "confidence_threshold": 0.8
        }
        
        response = client.post("/api/sms/batch-parse", json=batch_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_processed" in data
        assert "transactions_created" in data
        assert "success_rate" in data
        assert "results" in data
        
        assert data["total_processed"] == 3
        assert data["transactions_created"] >= 2  # At least 2 should parse successfully

    def test_batch_parse_auto_approve(self, client: TestClient, auth_headers: dict):
        """Test batch SMS parsing with auto-approve for high confidence"""
        batch_data = {
            "sms_texts": [
                "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND ATHENS"
            ],
            "auto_approve_high_confidence": True,
            "confidence_threshold": 0.7
        }
        
        response = client.post("/api/sms/batch-parse", json=batch_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check if high confidence transaction was auto-approved
        results = data["results"]
        if results and results[0]["success"]:
            # High confidence NBG SMS should be auto-approved
            if results[0]["confidence"] >= 0.7:
                assert results[0]["auto_approved"] == True

    def test_get_parsing_stats(self, client: TestClient, auth_headers: dict):
        """Test getting SMS parsing statistics"""
        response = client.get("/api/sms/parsing-stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "parser_capabilities" in data
        assert "sample_parsing_stats" in data
        assert "recommendations" in data
        
        capabilities = data["parser_capabilities"]
        assert "supported_banks" in capabilities
        assert "supported_categories" in capabilities
        assert "parsing_methods" in capabilities
        
        # Check supported banks
        supported_banks = capabilities["supported_banks"]
        expected_banks = ["NBG", "EUROBANK", "ALPHA", "PIRAEUS", "IRIS", "PAYPAL", "REVOLUT"]
        for bank in expected_banks:
            assert bank in supported_banks

    def test_test_patterns_endpoint(self, client: TestClient, auth_headers: dict):
        """Test the SMS patterns testing endpoint"""
        response = client.get("/api/sms/test-patterns", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have results for different bank patterns
        assert len(data) > 0
        
        # Check that results contain expected information
        for bank_result in data.values():
            if bank_result != "Could not parse":
                assert "amount" in bank_result
                assert "type" in bank_result
                assert "category" in bank_result
                assert "confidence" in bank_result


class TestSMSParser:
    """Test suite for SMS parser service directly"""

    def setUp(self):
        self.parser = EnhancedGreekSMSParser()

    def test_parse_nbg_debit(self):
        """Test parsing NBG debit SMS"""
        parser = EnhancedGreekSMSParser()
        sms_text = "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND ATHENS"
        
        result = parser.parse_sms(sms_text)
        
        assert result is not None
        assert result.amount == 15.50
        assert result.type.value == "expense"
        assert result.bank == "NBG"
        assert result.confidence >= 0.8
        assert "COFFEE ISLAND" in result.description

    def test_parse_eurobank_credit(self):
        """Test parsing Eurobank credit SMS"""
        parser = EnhancedGreekSMSParser()
        sms_text = "Eurobank: Πίστωση 200.00 EUR - Monthly allowance"
        
        result = parser.parse_sms(sms_text)
        
        assert result is not None
        assert result.amount == 200.00
        assert result.type.value == "income"
        assert result.bank == "EUROBANK"
        assert result.confidence >= 0.8

    def test_parse_generic_pattern(self):
        """Test parsing with generic patterns"""
        parser = EnhancedGreekSMSParser()
        sms_text = "Purchase 23.45 EUR at LOCAL SHOP"
        
        result = parser.parse_sms(sms_text)
        
        assert result is not None
        assert result.amount == 23.45
        assert result.parsing_method == "generic"
        assert result.confidence >= 0.6 and result.confidence < 0.9

    def test_parse_fallback_pattern(self):
        """Test parsing with fallback patterns"""
        parser = EnhancedGreekSMSParser()
        sms_text = "Transaction: 67.89 EUR"
        
        result = parser.parse_sms(sms_text)
        
        assert result is not None
        assert result.amount == 67.89
        assert result.parsing_method == "fallback"
        assert result.confidence >= 0.4 and result.confidence < 0.7

    def test_parse_invalid_sms(self):
        """Test parsing invalid SMS"""
        parser = EnhancedGreekSMSParser()
        sms_text = "This is not a valid bank SMS"
        
        result = parser.parse_sms(sms_text)
        
        assert result is None

    def test_parse_empty_sms(self):
        """Test parsing empty SMS"""
        parser = EnhancedGreekSMSParser()
        
        result = parser.parse_sms("")
        assert result is None
        
        result = parser.parse_sms("   ")
        assert result is None

    def test_category_suggestion(self):
        """Test category suggestion based on description"""
        parser = EnhancedGreekSMSParser()
        
        # Test food category
        result = parser._suggest_category("COFFEE ISLAND ATHENS")
        assert result.value == "Food"
        
        # Test transport category  
        result = parser._suggest_category("METRO TICKET")
        assert result.value == "Transport"
        
        # Test shopping category
        result = parser._suggest_category("ZARA STORE")
        assert result.value == "Shopping"

    def test_parsing_stats(self):
        """Test parsing statistics generation"""
        parser = EnhancedGreekSMSParser()
        
        test_messages = [
            "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND",
            "Eurobank: Purchase 25.00 EUR at SHOP",
            "Invalid message",
            "Transaction: 10.00 EUR"
        ]
        
        stats = parser.get_parsing_stats(test_messages)
        
        assert stats["total_messages"] == 4
        assert stats["successfully_parsed"] >= 2
        assert "success_rate" in stats
        assert "parsing_methods" in stats
        assert "banks_detected" in stats

    def test_confidence_calculation(self):
        """Test confidence score calculation"""
        parser = EnhancedGreekSMSParser()
        
        # High confidence - bank specific with good description
        sms1 = "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND ATHENS"
        result1 = parser.parse_sms(sms1)
        assert result1.confidence >= 0.85
        
        # Medium confidence - generic pattern
        sms2 = "Purchase 15.50 EUR at shop"
        result2 = parser.parse_sms(sms2)
        if result2:
            assert result2.confidence >= 0.6 and result2.confidence < 0.85
        
        # Lower confidence - fallback pattern
        sms3 = "15.50 EUR"
        result3 = parser.parse_sms(sms3)
        if result3:
            assert result3.confidence >= 0.4 and result3.confidence < 0.7