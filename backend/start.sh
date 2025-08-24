#!/bin/bash

# Budgeto Backend Production Startup Script
# Handles database migrations, health checks, and application startup

set -e

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Validate required environment variables
validate_env() {
    log "Validating environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "JWT_SECRET_KEY"
        "ENVIRONMENT"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    success "Environment validation complete"
}

# Wait for database to be ready
wait_for_db() {
    log "Waiting for database to be ready..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if python -c "
import sys
import psycopg2
from urllib.parse import urlparse
import os

try:
    url = urlparse(os.environ['DATABASE_URL'])
    conn = psycopg2.connect(
        host=url.hostname,
        port=url.port,
        user=url.username,
        password=url.password,
        database=url.path[1:],
        connect_timeout=5
    )
    conn.close()
    print('Database connection successful')
    sys.exit(0)
except Exception as e:
    print(f'Database connection failed: {e}')
    sys.exit(1)
"; then
            success "Database is ready"
            return 0
        fi
        
        log "Database not ready, attempt $attempt/$max_attempts. Waiting 2 seconds..."
        sleep 2
        ((attempt++))
    done
    
    error "Database did not become ready within timeout"
    exit 1
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    if alembic upgrade head; then
        success "Database migrations completed"
    else
        error "Database migrations failed"
        exit 1
    fi
}

# Create initial data if needed
create_initial_data() {
    log "Creating initial data..."
    
    python -c "
import sys
sys.path.append('/app')
from app.core.demo_data import initialize_demo_data

try:
    initialize_demo_data()
    print('Demo data initialization completed')
except Exception as e:
    print(f'Demo data initialization failed: {e}')
" || warn "Demo data initialization failed or skipped"
}

# Health check function
health_check() {
    log "Performing application health check..."
    
    # Start application in background for health check
    uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    APP_PID=$!
    
    # Wait for application to start
    sleep 5
    
    # Perform health check
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "Health check passed"
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
        return 0
    else
        error "Health check failed"
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
        return 1
    fi
}

# Graceful shutdown handler
cleanup() {
    log "Received shutdown signal, cleaning up..."
    if [ ! -z "$APP_PID" ]; then
        kill -TERM $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
    fi
    log "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Main startup sequence
main() {
    log "Starting Budgeto Backend API (Production)"
    log "Environment: ${ENVIRONMENT:-unknown}"
    log "Python version: $(python --version)"
    
    # Validation and setup
    validate_env
    wait_for_db
    run_migrations
    create_initial_data
    
    # Start application
    log "Starting application server..."
    
    if [ "${ENVIRONMENT}" = "production" ]; then
        # Production: Use Gunicorn with multiple workers
        log "Starting with Gunicorn (production mode)"
        exec gunicorn app.main:app \
            --bind 0.0.0.0:8000 \
            --workers ${WORKERS:-4} \
            --worker-class uvicorn.workers.UvicornWorker \
            --worker-connections ${WORKER_CONNECTIONS:-1000} \
            --max-requests ${MAX_REQUESTS:-1000} \
            --max-requests-jitter ${MAX_REQUESTS_JITTER:-100} \
            --timeout ${TIMEOUT:-30} \
            --keep-alive ${KEEP_ALIVE:-5} \
            --access-logfile - \
            --error-logfile - \
            --log-level ${LOG_LEVEL:-info} \
            --capture-output \
            --enable-stdio-inheritance
    else
        # Development/Staging: Use Uvicorn
        log "Starting with Uvicorn (development mode)"
        exec uvicorn app.main:app \
            --host 0.0.0.0 \
            --port 8000 \
            --log-level ${LOG_LEVEL:-info} \
            --access-log \
            --use-colors
    fi
}

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks..."
    
    # Check Python version
    python_version=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    if [[ $(echo "$python_version >= 3.11" | bc -l) -eq 0 ]]; then
        error "Python 3.11+ required, found $python_version"
        exit 1
    fi
    
    # Check disk space
    available_space=$(df /app | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1048576 ]; then # 1GB in KB
        warn "Low disk space available: ${available_space}KB"
    fi
    
    # Check memory
    available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$available_memory" -lt 512 ]; then
        warn "Low memory available: ${available_memory}MB"
    fi
    
    success "Pre-flight checks completed"
}

# Security hardening
security_setup() {
    log "Applying security configurations..."
    
    # Set secure file permissions
    umask 027
    
    # Ensure log directory exists with correct permissions
    mkdir -p /app/logs
    chmod 750 /app/logs
    
    # Ensure upload directory exists with correct permissions  
    mkdir -p /app/uploads
    chmod 755 /app/uploads
    
    success "Security setup completed"
}

# Run startup sequence
log "Budgeto Backend Production Startup"
log "=================================="

preflight_checks
security_setup
main

# If we get here, something went wrong
error "Startup script completed unexpectedly"
exit 1