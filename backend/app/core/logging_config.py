# Logging Configuration for Budgeto Backend
# Structured logging with metrics and monitoring integration

import logging
import json
import sys
import time
from datetime import datetime
from typing import Any, Dict, Optional
from contextvars import ContextVar
from fastapi import Request
import structlog
from pythonjsonlogger import jsonlogger

# Context variables for request tracking
request_id_ctx: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
user_id_ctx: ContextVar[Optional[str]] = ContextVar('user_id', default=None)

# Custom log levels
SECURITY_LEVEL = 25
BUSINESS_LEVEL = 22
PERFORMANCE_LEVEL = 18

logging.addLevelName(SECURITY_LEVEL, "SECURITY")
logging.addLevelName(BUSINESS_LEVEL, "BUSINESS")
logging.addLevelName(PERFORMANCE_LEVEL, "PERFORMANCE")

class SecurityLogger:
    """Security-specific logging methods"""
    
    @staticmethod
    def login_attempt(username: str, success: bool, ip_address: str, user_agent: str):
        logger = structlog.get_logger("security")
        logger.log(
            SECURITY_LEVEL,
            "Login attempt",
            username=username,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
            event_type="login_attempt"
        )
    
    @staticmethod
    def password_change(user_id: str, ip_address: str):
        logger = structlog.get_logger("security")
        logger.log(
            SECURITY_LEVEL,
            "Password changed",
            user_id=user_id,
            ip_address=ip_address,
            event_type="password_change"
        )
    
    @staticmethod
    def suspicious_activity(event: str, details: Dict[str, Any], ip_address: str):
        logger = structlog.get_logger("security")
        logger.log(
            SECURITY_LEVEL,
            f"Suspicious activity: {event}",
            details=details,
            ip_address=ip_address,
            event_type="suspicious_activity"
        )
    
    @staticmethod
    def access_denied(resource: str, user_id: str, reason: str):
        logger = structlog.get_logger("security")
        logger.log(
            SECURITY_LEVEL,
            "Access denied",
            resource=resource,
            user_id=user_id,
            reason=reason,
            event_type="access_denied"
        )

class BusinessLogger:
    """Business logic specific logging"""
    
    @staticmethod
    def transaction_created(user_id: str, transaction_id: str, amount: float, category: str):
        logger = structlog.get_logger("business")
        logger.log(
            BUSINESS_LEVEL,
            "Transaction created",
            user_id=user_id,
            transaction_id=transaction_id,
            amount=amount,
            category=category,
            event_type="transaction_created"
        )
    
    @staticmethod
    def transaction_approved(user_id: str, transaction_id: str, amount: float):
        logger = structlog.get_logger("business")
        logger.log(
            BUSINESS_LEVEL,
            "Transaction approved",
            user_id=user_id,
            transaction_id=transaction_id,
            amount=amount,
            event_type="transaction_approved"
        )
    
    @staticmethod
    def achievement_unlocked(user_id: str, achievement_key: str, xp_awarded: int):
        logger = structlog.get_logger("business")
        logger.log(
            BUSINESS_LEVEL,
            "Achievement unlocked",
            user_id=user_id,
            achievement_key=achievement_key,
            xp_awarded=xp_awarded,
            event_type="achievement_unlocked"
        )
    
    @staticmethod
    def sms_parsed(user_id: str, bank: str, amount: float, success: bool, confidence: float):
        logger = structlog.get_logger("business")
        logger.log(
            BUSINESS_LEVEL,
            "SMS parsed",
            user_id=user_id,
            bank=bank,
            amount=amount,
            success=success,
            confidence=confidence,
            event_type="sms_parsed"
        )

class PerformanceLogger:
    """Performance monitoring logging"""
    
    @staticmethod
    def request_processed(method: str, path: str, status_code: int, duration: float, user_id: str = None):
        logger = structlog.get_logger("performance")
        logger.log(
            PERFORMANCE_LEVEL,
            "Request processed",
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration * 1000,
            user_id=user_id,
            event_type="request_processed"
        )
    
    @staticmethod
    def database_query(query_type: str, duration: float, table: str = None):
        logger = structlog.get_logger("performance")
        logger.log(
            PERFORMANCE_LEVEL,
            "Database query executed",
            query_type=query_type,
            duration_ms=duration * 1000,
            table=table,
            event_type="database_query"
        )
    
    @staticmethod
    def cache_operation(operation: str, key: str, hit: bool, duration: float):
        logger = structlog.get_logger("performance")
        logger.log(
            PERFORMANCE_LEVEL,
            "Cache operation",
            operation=operation,
            key=key,
            hit=hit,
            duration_ms=duration * 1000,
            event_type="cache_operation"
        )

class CustomJSONFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional context"""
    
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        
        # Add service information
        log_record['service'] = 'budgeto-backend'
        log_record['version'] = '1.0.0'
        
        # Add request context if available
        request_id = request_id_ctx.get()
        if request_id:
            log_record['request_id'] = request_id
            
        user_id = user_id_ctx.get()
        if user_id:
            log_record['user_id'] = user_id
        
        # Ensure level is always present
        if 'level' not in log_record:
            log_record['level'] = record.levelname

def add_request_context(logger, method_name, event_dict):
    """Add request context to log events"""
    request_id = request_id_ctx.get()
    if request_id:
        event_dict['request_id'] = request_id
        
    user_id = user_id_ctx.get()
    if user_id:
        event_dict['user_id'] = user_id
    
    return event_dict

def add_service_context(logger, method_name, event_dict):
    """Add service context to log events"""
    event_dict['service'] = 'budgeto-backend'
    event_dict['version'] = '1.0.0'
    event_dict['timestamp'] = datetime.utcnow().isoformat() + 'Z'
    return event_dict

def setup_logging(log_level: str = "INFO", log_file: str = None):
    """Setup comprehensive logging configuration"""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            add_service_context,
            add_request_context,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard logging
    handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = CustomJSONFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    handlers.append(console_handler)
    
    # File handler if specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_formatter = CustomJSONFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        handlers.append(file_handler)
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        handlers=handlers,
        force=True
    )
    
    # Configure specific loggers
    
    # Silence noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    
    # Set specific levels for our loggers
    logging.getLogger("security").setLevel(logging.INFO)
    logging.getLogger("business").setLevel(logging.INFO)
    logging.getLogger("performance").setLevel(logging.INFO)

class RequestLoggingMiddleware:
    """Middleware for request logging and context"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Generate request ID
        import uuid
        request_id = str(uuid.uuid4())
        request_id_ctx.set(request_id)
        
        # Extract request information
        method = scope["method"]
        path = scope["path"]
        
        start_time = time.time()
        
        async def send_with_logging(message):
            if message["type"] == "http.response.start":
                # Extract user ID from headers if available
                headers = dict(scope.get("headers", []))
                auth_header = headers.get(b"authorization", b"").decode()
                if auth_header:
                    # Extract user ID from JWT token (simplified)
                    try:
                        import jwt
                        token = auth_header.replace("Bearer ", "")
                        payload = jwt.decode(token, options={"verify_signature": False})
                        user_id_ctx.set(str(payload.get("sub", "")))
                    except:
                        pass
                
                # Log request start
                logger = structlog.get_logger("http")
                logger.info(
                    "Request started",
                    method=method,
                    path=path,
                    request_id=request_id
                )
            
            elif message["type"] == "http.response.body" and not message.get("more_body", False):
                # Log request completion
                duration = time.time() - start_time
                status_code = message.get("status", 200)
                
                PerformanceLogger.request_processed(
                    method=method,
                    path=path,
                    status_code=status_code,
                    duration=duration,
                    user_id=user_id_ctx.get()
                )
            
            await send(message)
        
        await self.app(scope, receive, send_with_logging)

# Metrics logging for Prometheus
class MetricsLogger:
    """Logger for custom metrics"""
    
    @staticmethod
    def log_metric(metric_name: str, metric_value: float, metric_type: str = "gauge", labels: Dict[str, str] = None):
        """Log a custom metric for Prometheus scraping"""
        logger = structlog.get_logger("metrics")
        logger.info(
            "Custom metric",
            metric_name=metric_name,
            metric_value=metric_value,
            metric_type=metric_type,
            labels=labels or {},
            event_type="custom_metric"
        )

# Usage examples and helper functions
def get_logger(name: str):
    """Get a structured logger instance"""
    return structlog.get_logger(name)

def log_exception(logger, exc: Exception, context: Dict[str, Any] = None):
    """Log an exception with context"""
    logger.exception(
        "Exception occurred",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
        context=context or {}
    )

# Export commonly used loggers
security_logger = SecurityLogger()
business_logger = BusinessLogger()
performance_logger = PerformanceLogger()
metrics_logger = MetricsLogger()

# Example usage:
if __name__ == "__main__":
    setup_logging("INFO", "/app/logs/application.log")
    
    logger = get_logger("test")
    logger.info("Application started", version="1.0.0")
    
    security_logger.login_attempt("testuser", True, "192.168.1.1", "Mozilla/5.0")
    business_logger.transaction_created("user123", "txn456", 25.50, "Food")
    performance_logger.request_processed("GET", "/api/transactions", 200, 0.150)


# Additional configuration function for compatibility
def configure_logging(environment: str = "development", log_level: str = "INFO") -> None:
    """
    Configure comprehensive logging for the application
    Compatibility function that wraps setup_logging
    
    Args:
        environment: The environment (development, staging, production)
        log_level: The logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Determine log file based on environment
    log_file = None
    if environment == "production":
        log_file = "/app/logs/application.log"
    
    # Call the main setup function
    setup_logging(log_level, log_file)
    
    # Additional environment-specific configuration
    if environment == "production":
        # More verbose logging in production for monitoring
        logging.getLogger("security").setLevel(logging.INFO)
        logging.getLogger("business").setLevel(logging.INFO)
        logging.getLogger("performance").setLevel(logging.DEBUG)
    elif environment == "development":
        # More detailed logging for development
        logging.getLogger("uvicorn.access").setLevel(logging.INFO)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
    
    logger = get_logger("config")
    logger.info(f"Logging configured for {environment} environment with level {log_level}")