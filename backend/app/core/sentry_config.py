# Sentry Integration for Error Tracking and Performance Monitoring
# Comprehensive error tracking and APM for Budgeto application

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from typing import Dict, Any, Optional
import logging
from fastapi import Request
from app.core.config import get_settings

settings = get_settings()

def init_sentry():
    """Initialize Sentry with comprehensive configuration"""
    
    if not settings.SENTRY_DSN:
        logging.warning("SENTRY_DSN not configured, skipping Sentry initialization")
        return
    
    # Configure logging integration
    sentry_logging = LoggingIntegration(
        level=logging.INFO,  # Capture info and above as breadcrumbs
        event_level=logging.ERROR  # Send errors as events
    )
    
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        release=f"budgeto@{settings.VERSION}",
        
        # Integrations
        integrations=[
            FastApiIntegration(auto_enabling_integrations=False),
            SqlalchemyIntegration(),
            RedisIntegration(),
            sentry_logging,
            AsyncioIntegration(),
        ],
        
        # Performance monitoring
        traces_sample_rate=0.1,  # Capture 10% of transactions for performance
        profiles_sample_rate=0.1,  # Capture 10% for profiling
        
        # Error sampling
        sample_rate=1.0,  # Capture 100% of error events
        
        # Additional configuration
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send personally identifiable info
        max_breadcrumbs=50,
        
        # Custom configuration
        before_send=before_send_filter,
        before_send_transaction=before_send_transaction_filter,
        
        # Debug mode for development
        debug=settings.ENVIRONMENT == "development",
    )
    
    logging.info(f"Sentry initialized for environment: {settings.ENVIRONMENT}")

def before_send_filter(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Filter and modify events before sending to Sentry"""
    
    # Don't send certain types of errors to reduce noise
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        
        # Filter out common exceptions that aren't critical
        filtered_exceptions = [
            'ValidationError',
            'HTTPException',
            'RequestValidationError',
            'ConnectionError',
            'TimeoutError'
        ]
        
        if exc_type.__name__ in filtered_exceptions:
            # Still log but don't send to Sentry for certain status codes
            if hasattr(exc_value, 'status_code'):
                if exc_value.status_code in [400, 401, 403, 404]:
                    return None
    
    # Add custom tags
    event.setdefault('tags', {}).update({
        'component': 'backend',
        'service': 'budgeto'
    })
    
    # Remove sensitive data
    if 'request' in event:
        request_data = event['request']
        
        # Remove sensitive headers
        if 'headers' in request_data:
            sensitive_headers = ['authorization', 'cookie', 'x-api-key']
            for header in sensitive_headers:
                request_data['headers'].pop(header, None)
        
        # Remove sensitive form data
        if 'data' in request_data:
            if isinstance(request_data['data'], dict):
                sensitive_fields = ['password', 'token', 'secret']
                for field in sensitive_fields:
                    if field in request_data['data']:
                        request_data['data'][field] = '[Filtered]'
    
    # Add user context if available
    if 'user' not in event:
        # Try to extract user info from request context
        pass  # This would be implemented based on your auth system
    
    return event

def before_send_transaction_filter(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Filter performance transactions before sending"""
    
    # Don't send health check transactions
    if event.get('transaction') in ['/health', '/metrics', '/docs']:
        return None
    
    # Add custom tags for transactions
    event.setdefault('tags', {}).update({
        'component': 'backend',
        'service': 'budgeto'
    })
    
    return event

class SentryErrorHandler:
    """Custom error handler with Sentry integration"""
    
    @staticmethod
    def capture_exception(
        exception: Exception,
        user_id: str = None,
        extra_context: Dict[str, Any] = None,
        tags: Dict[str, str] = None
    ):
        """Capture an exception with additional context"""
        
        with sentry_sdk.push_scope() as scope:
            # Add user context
            if user_id:
                scope.user = {"id": user_id}
            
            # Add extra context
            if extra_context:
                for key, value in extra_context.items():
                    scope.set_extra(key, value)
            
            # Add tags
            if tags:
                for key, value in tags.items():
                    scope.set_tag(key, value)
            
            sentry_sdk.capture_exception(exception)
    
    @staticmethod
    def capture_message(
        message: str,
        level: str = "info",
        user_id: str = None,
        extra_context: Dict[str, Any] = None,
        tags: Dict[str, str] = None
    ):
        """Capture a custom message"""
        
        with sentry_sdk.push_scope() as scope:
            if user_id:
                scope.user = {"id": user_id}
            
            if extra_context:
                for key, value in extra_context.items():
                    scope.set_extra(key, value)
            
            if tags:
                for key, value in tags.items():
                    scope.set_tag(key, value)
            
            sentry_sdk.capture_message(message, level=level)

class SentryPerformanceMonitor:
    """Performance monitoring with Sentry"""
    
    @staticmethod
    def start_transaction(name: str, op: str = "function") -> Any:
        """Start a performance transaction"""
        return sentry_sdk.start_transaction(name=name, op=op)
    
    @staticmethod
    def start_span(op: str, description: str = None) -> Any:
        """Start a performance span"""
        return sentry_sdk.start_span(op=op, description=description)
    
    @staticmethod
    def set_transaction_name(name: str):
        """Set the transaction name"""
        with sentry_sdk.configure_scope() as scope:
            if scope.transaction:
                scope.transaction.name = name

class SentryMiddleware:
    """FastAPI middleware for Sentry integration"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Start transaction for this request
        transaction_name = f"{scope['method']} {scope['path']}"
        
        with sentry_sdk.start_transaction(
            name=transaction_name,
            op="http.server"
        ) as transaction:
            
            # Add request context
            with sentry_sdk.configure_scope() as sentry_scope:
                sentry_scope.set_tag("http.method", scope["method"])
                sentry_scope.set_tag("http.path", scope["path"])
                
                # Extract and set user context if available
                headers = dict(scope.get("headers", []))
                user_agent = headers.get(b"user-agent", b"").decode()
                if user_agent:
                    sentry_scope.set_tag("user_agent", user_agent[:100])
            
            try:
                await self.app(scope, receive, send)
            except Exception as exc:
                # Capture the exception
                SentryErrorHandler.capture_exception(
                    exc,
                    extra_context={
                        "request_method": scope["method"],
                        "request_path": scope["path"],
                        "request_headers": dict(scope.get("headers", []))
                    }
                )
                raise

# Context managers for specific operations
class SentryDatabaseSpan:
    """Context manager for database operations"""
    
    def __init__(self, operation: str, table: str = None):
        self.operation = operation
        self.table = table
        self.span = None
    
    def __enter__(self):
        description = f"{self.operation}"
        if self.table:
            description += f" on {self.table}"
        
        self.span = sentry_sdk.start_span(
            op="db",
            description=description
        )
        return self.span.__enter__()
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.span:
            if exc_type:
                self.span.set_status("internal_error")
            else:
                self.span.set_status("ok")
            
            return self.span.__exit__(exc_type, exc_val, exc_tb)

class SentryCacheSpan:
    """Context manager for cache operations"""
    
    def __init__(self, operation: str, key: str = None):
        self.operation = operation
        self.key = key
        self.span = None
    
    def __enter__(self):
        description = f"{self.operation}"
        if self.key:
            description += f" {self.key}"
        
        self.span = sentry_sdk.start_span(
            op="cache",
            description=description
        )
        return self.span.__enter__()
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.span:
            if exc_type:
                self.span.set_status("internal_error")
            else:
                self.span.set_status("ok")
            
            return self.span.__exit__(exc_type, exc_val, exc_tb)

# Decorators for automatic instrumentation
def monitor_performance(operation_name: str = None):
    """Decorator to monitor function performance"""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            op_name = operation_name or f"{func.__module__}.{func.__name__}"
            
            with sentry_sdk.start_span(op="function", description=op_name):
                return await func(*args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            op_name = operation_name or f"{func.__module__}.{func.__name__}"
            
            with sentry_sdk.start_span(op="function", description=op_name):
                return func(*args, **kwargs)
        
        if hasattr(func, '__code__') and func.__code__.co_flags & 0x80:  # CO_COROUTINE
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def capture_errors(user_context_func=None):
    """Decorator to automatically capture errors"""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as exc:
                extra_context = {
                    "function": f"{func.__module__}.{func.__name__}",
                    "args": str(args)[:500],
                    "kwargs": str(kwargs)[:500]
                }
                
                user_id = None
                if user_context_func:
                    try:
                        user_id = user_context_func(*args, **kwargs)
                    except:
                        pass
                
                SentryErrorHandler.capture_exception(
                    exc,
                    user_id=user_id,
                    extra_context=extra_context
                )
                raise
        
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as exc:
                extra_context = {
                    "function": f"{func.__module__}.{func.__name__}",
                    "args": str(args)[:500],
                    "kwargs": str(kwargs)[:500]
                }
                
                user_id = None
                if user_context_func:
                    try:
                        user_id = user_context_func(*args, **kwargs)
                    except:
                        pass
                
                SentryErrorHandler.capture_exception(
                    exc,
                    user_id=user_id,
                    extra_context=extra_context
                )
                raise
        
        if hasattr(func, '__code__') and func.__code__.co_flags & 0x80:  # CO_COROUTINE
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

# Usage examples
sentry_error_handler = SentryErrorHandler()
sentry_performance = SentryPerformanceMonitor()

# Example usage in your application:
"""
# In main.py
from app.core.sentry_config import init_sentry, SentryMiddleware

init_sentry()
app.add_middleware(SentryMiddleware)

# In your service functions
@monitor_performance("user_service.create_user")
@capture_errors()
async def create_user(user_data):
    with SentryDatabaseSpan("INSERT", "users"):
        # Database operation
        pass
    
    with SentryCacheSpan("SET", f"user:{user.id}"):
        # Cache operation
        pass
    
    return user

# Manual error capture
try:
    risky_operation()
except Exception as e:
    sentry_error_handler.capture_exception(
        e,
        user_id="user123",
        extra_context={"operation": "risky_operation"},
        tags={"component": "user_service"}
    )
"""