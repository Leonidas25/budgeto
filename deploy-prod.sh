#!/bin/bash

# Budgeto Production Deployment Script
# This script handles the deployment of the Budgeto application in production

set -e

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if .env.prod exists
check_env_file() {
    if [ ! -f ".env.prod" ]; then
        error ".env.prod file not found!"
        log "Please copy .env.prod.example to .env.prod and configure it:"
        echo "cp .env.prod.example .env.prod"
        echo "# Then edit .env.prod with your production values"
        exit 1
    fi
    success "Production environment file found"
}

# Validate required directories
check_directories() {
    log "Checking required directories..."
    
    required_dirs=(
        "/opt/budgeto/data/postgres"
        "/opt/budgeto/data/redis"
        "/opt/budgeto/logs/backend"
        "/opt/budgeto/uploads"
        "/opt/budgeto/monitoring/prometheus"
        "/opt/budgeto/monitoring/grafana"
        "/opt/budgeto/monitoring/loki"
        "/opt/budgeto/backups"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log "Creating directory: $dir"
            sudo mkdir -p "$dir"
            sudo chown -R $USER:$USER "$dir"
        fi
    done
    
    success "Directory structure validated"
}

# Build images
build_images() {
    log "Building production Docker images..."
    
    # Set build arguments
    export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export VCS_REF=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    export VERSION=$(git describe --tags --always 2>/dev/null || echo "1.0.0")
    
    # Build images with production Dockerfiles
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    success "Docker images built successfully"
}

# Start services
start_services() {
    log "Starting production services..."
    
    # Start with environment file
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    success "Production services started"
}

# Check service health
check_health() {
    log "Waiting for services to be healthy..."
    
    max_attempts=30
    attempt=1
    
    services=("postgres" "redis" "backend" "frontend")
    
    for service in "${services[@]}"; do
        log "Checking health of $service..."
        
        while [ $attempt -le $max_attempts ]; do
            if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "healthy\|Up"; then
                success "$service is healthy"
                break
            fi
            
            log "$service not ready, attempt $attempt/$max_attempts..."
            sleep 10
            ((attempt++))
            
            if [ $attempt -gt $max_attempts ]; then
                error "$service failed to become healthy"
                docker-compose -f docker-compose.prod.yml logs "$service"
                exit 1
            fi
        done
        
        attempt=1
    done
    
    success "All services are healthy"
}

# Show running services
show_status() {
    log "Production deployment status:"
    echo ""
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    log "Services are accessible at:"
    echo "  - Frontend: http://localhost (via nginx)"
    echo "  - Backend API: http://localhost/api (via nginx)"
    echo "  - Grafana Monitoring: http://localhost:3001"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
    log "To view logs: docker-compose -f docker-compose.prod.yml logs [service_name]"
    log "To stop services: docker-compose -f docker-compose.prod.yml down"
}

# Main deployment function
deploy() {
    log "Starting Budgeto Production Deployment"
    log "======================================"
    
    # Pre-deployment checks
    check_env_file
    check_directories
    
    # Docker operations
    build_images
    start_services
    check_health
    
    # Status report
    show_status
    
    success "Production deployment completed successfully!"
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    build)
        build_images
        ;;
    start)
        start_services
        ;;
    stop)
        log "Stopping production services..."
        docker-compose -f docker-compose.prod.yml down
        success "Production services stopped"
        ;;
    restart)
        log "Restarting production services..."
        docker-compose -f docker-compose.prod.yml restart
        success "Production services restarted"
        ;;
    status)
        show_status
        ;;
    logs)
        if [ -n "$2" ]; then
            docker-compose -f docker-compose.prod.yml logs -f "$2"
        else
            docker-compose -f docker-compose.prod.yml logs -f
        fi
        ;;
    *)
        echo "Usage: $0 {deploy|build|start|stop|restart|status|logs [service]}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (build, start, health check)"
        echo "  build    - Build Docker images only"
        echo "  start    - Start services only"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - Show logs for all or specific service"
        exit 1
        ;;
esac