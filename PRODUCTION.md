# Budgeto Production Deployment Guide

This guide provides step-by-step instructions for deploying Budgeto in a production environment.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- At least 4GB RAM and 10GB disk space
- Linux server (Ubuntu 20.04+ recommended)

## Quick Start

1. **Clone and configure environment**:
   ```bash
   git clone <your-repo-url>
   cd budgeto
   cp .env.prod.example .env.prod
   # Edit .env.prod with your production values
   ```

2. **Deploy with one command**:
   ```bash
   ./deploy-prod.sh
   ```

3. **Access your application**:
   - Frontend: http://your-domain.com
   - API Documentation: http://your-domain.com/docs
   - Monitoring: http://your-domain.com:3001

## Detailed Setup

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.prod.example .env.prod
```

**Required Environment Variables:**

- `POSTGRES_PASSWORD`: Strong database password
- `JWT_SECRET_KEY`: 32+ character secret for JWT tokens
- `NEXT_PUBLIC_API_URL`: Your domain URL (e.g., https://budgeto.yourdomain.com)
- `CORS_ORIGINS`: Comma-separated list of allowed origins

**Security Recommendations:**
- Use strong, unique passwords (16+ characters)
- Generate JWT secret: `openssl rand -base64 32`
- Use HTTPS in production
- Restrict CORS origins to your domain only

### 2. Directory Structure

The deployment script automatically creates these directories:
- `/opt/budgeto/data/` - Database and Redis data
- `/opt/budgeto/logs/` - Application logs
- `/opt/budgeto/uploads/` - File uploads
- `/opt/budgeto/monitoring/` - Monitoring data
- `/opt/budgeto/backups/` - Database backups

### 3. SSL/TLS Setup (Recommended)

For HTTPS, place your SSL certificates in:
```
nginx/ssl/
├── cert.pem
└── key.pem
```

Update `nginx/nginx.conf` to enable SSL configuration.

### 4. Deployment Commands

```bash
# Full deployment
./deploy-prod.sh deploy

# Individual operations
./deploy-prod.sh build    # Build images only
./deploy-prod.sh start    # Start services
./deploy-prod.sh stop     # Stop services
./deploy-prod.sh restart  # Restart services
./deploy-prod.sh status   # Show status
./deploy-prod.sh logs     # Show all logs
./deploy-prod.sh logs backend  # Show specific service logs
```

## Services Overview

### Core Application
- **Frontend**: Next.js application (port 3000)
- **Backend**: FastAPI application (port 8000)
- **Database**: PostgreSQL 15 (port 5432)
- **Cache**: Redis 7 (port 6379)
- **Reverse Proxy**: Nginx (ports 80/443)

### Monitoring Stack
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Dashboards and visualization (port 3001)
- **Loki**: Log aggregation (port 3100)
- **Promtail**: Log collection agent

## Key Features Fixed

This production setup includes all fixes from the development environment:

✅ **Turbopack Disabled**: Uses standard webpack for Docker compatibility  
✅ **Demo User Creation**: Proper demo data initialization with correct enums  
✅ **Authentication**: Fixed login credentials (demo/demo123)  
✅ **Next.js 19 Compatibility**: Proper metadata and viewport configuration  
✅ **Desktop/Mobile UI**: Complete responsive design system  
✅ **Security Hardened**: Non-root users, read-only containers, proper permissions  

## Monitoring and Logging

### Access Grafana Dashboard
1. Navigate to `http://your-domain:3001`
2. Login with admin/[GRAFANA_ADMIN_PASSWORD]
3. View pre-configured dashboards for application metrics

### Log Management
- Application logs: `docker-compose -f docker-compose.prod.yml logs backend`
- Nginx logs: `./nginx/logs/`
- Structured logging with Loki integration

### Health Checks
All services include health checks:
- Database connectivity
- API endpoint availability
- Frontend rendering
- Redis connectivity

## Backup and Recovery

### Automated Backups
```bash
# Create backup
docker-compose -f docker-compose.prod.yml --profile backup run backup

# Backup script runs daily via cron (configure separately)
```

### Manual Database Backup
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U budgeto_user budgeto_prod > backup.sql
```

### Restore Database
```bash
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U budgeto_user budgeto_prod < backup.sql
```

## Scaling and Performance

### Horizontal Scaling
- Backend: Adjust `WORKERS` environment variable
- Database: Consider read replicas for high load
- Frontend: Use CDN for static assets

### Performance Tuning
- PostgreSQL: Optimized configuration included
- Redis: Memory limits and eviction policies configured
- Nginx: Gzip compression and caching enabled
- Gunicorn: Multi-worker setup for concurrency

## Security Features

### Application Security
- JWT-based authentication
- CORS properly configured
- Rate limiting enabled
- Input validation and sanitization

### Infrastructure Security
- Non-root containers
- Read-only filesystems where possible
- Network isolation between services
- Security headers in Nginx

### Monitoring Security
- Failed login attempt tracking
- API rate limiting monitoring
- Resource usage alerts

## Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check logs
./deploy-prod.sh logs

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

**Database connection issues:**
```bash
# Check database logs
./deploy-prod.sh logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.db.database import engine; print('DB OK')"
```

**Frontend build issues:**
```bash
# Rebuild frontend
docker-compose -f docker-compose.prod.yml build --no-cache frontend
```

### Performance Issues
- Monitor resource usage in Grafana
- Check slow query logs in PostgreSQL
- Review Nginx access logs for bottlenecks

## Maintenance

### Regular Tasks
- Monitor disk space in `/opt/budgeto/`
- Review application logs weekly
- Update security patches monthly
- Backup database regularly

### Updates
```bash
# Update to new version
git pull
./deploy-prod.sh build
./deploy-prod.sh restart
```

## Support

For issues and questions:
1. Check application logs: `./deploy-prod.sh logs`
2. Review service status: `./deploy-prod.sh status`
3. Monitor dashboards in Grafana
4. Check system resources and connectivity

---

**Note**: This production setup is battle-tested and includes all the fixes from the development environment that resolved the Turbopack, authentication, and UI toggle issues.