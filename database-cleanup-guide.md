# Database Cleanup Documentation

## Overview

Complete database data cleanup solution that removes all data while preserving the database schema and structure.

## Components Created

### 1. Backend Cleanup API (`backend/api/_cleanup.js`)

- **DatabaseCleanup Class**: Handles safe data deletion with dependency-aware ordering
- **API Endpoints**: RESTful API for cleanup operations
- **Safety Features**: Error handling, logging, and user confirmation prompts

### 2. Migration Script (`migrations/0021_database_data_cleanup.sql`)

- **SQL-based cleanup**: Direct database execution script
- **Step-by-step execution**: Clear dependent tables in correct order
- **Verification**: Built-in verification queries

### 3. API Integration (`backend/index.js`)

- **Endpoint**: `/api/cleanup` (development only)
- **Methods**: GET (stats), POST (cleanup operations)
- **Security**: Admin-only access, environment protection

## Usage Instructions

### Via API Endpoints

#### Get Database Statistics

```bash
GET /api/cleanup
```

#### Clean All Data

```bash
POST /api/cleanup
Content-Type: application/json

{
  "preserveUsers": false,
  "preserveFarms": false
}
```

#### Clean Specific Table

```bash
POST /api/cleanup
Content-Type: application/json

{
  "table": "animals"
}
```

#### Complete Database Reset

```bash
POST /api/cleanup
Content-Type: application/json

{
  "reset": true
}
```

### Via SQL Migration Script

#### Execute in D1/Cloudflare Dashboard:

1. Navigate to Database → Queries
2. Copy and paste the migration script
3. Execute to clean all data

#### Order of Table Cleanup:

1. `audit_logs` (highest dependency)
2. `notifications`
3. `animal_movements`, `animal_events`, `animal_health_records`
4. `tasks`
5. `finance_entries`
6. `crops`
7. `weather_data`
8. `inventory`, `equipment`
9. `farm_operations`, `farm_statistics`, `farm_members`
10. `fields`, `locations`
11. `animals`
12. `farms`
13. `users` (optional)

## Safety Features

### Security Measures:

- **Development Only**: API endpoints disabled in production
- **Admin Protection**: Requires admin token in production
- **Confirmation Prompts**: User confirmation for dangerous operations
- **Audit Logging**: All operations logged with timestamps

### Data Safety:

- **Schema Preservation**: Only data removed, schema intact
- **Dependency Order**: Respects foreign key constraints
- **Rollback Capability**: Can restore from backups
- **Verification**: Built-in data count verification

## Monitoring & Verification

### API Response Includes:

- Success/failure status
- Number of records deleted per table
- Execution timestamp
- Detailed error messages

### Post-Cleanup Verification:

- Check remaining record counts
- Verify application functionality
- Confirm schema integrity
- Test API endpoints

## Quick Start Commands

### Development Environment:

```bash
# Clean all data except users and farms
curl -X POST http://localhost:8787/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"preserveUsers": true, "preserveFarms": true}'

# Get current database statistics
curl http://localhost:8787/api/cleanup
```

### Cloudflare D1:

1. Go to Cloudflare Dashboard → D1
2. Select your database
3. Run Query → Paste migration script
4. Execute to clean all data

## Error Handling

### Common Issues:

- **Foreign Key Violations**: Script handles dependency order automatically
- **Permission Errors**: Ensure admin access and proper environment
- **Timeout Issues**: Large databases may require chunked deletion

### Recovery Options:

- **Backup Restoration**: Restore from database backups
- **Manual Re-insertion**: Run seed scripts or manual data entry
- **Schema Reset**: Re-run migration scripts for clean slate

## Production Considerations

### Before Running in Production:

1. **Backup First**: Always backup production database
2. **Maintenance Window**: Schedule during low-traffic period
3. **User Notification**: Inform users of potential downtime
4. **Test Thoroughly**: Test cleanup process in staging first

### Post-Cleanup Actions:

1. **Verify Functionality**: Test all application features
2. **Monitor Performance**: Watch for any performance issues
3. **Update Caches**: Clear any application caches
4. **Restart Services**: Consider restarting application services
