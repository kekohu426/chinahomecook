---
name: db-migrate
description: Manage Prisma database migrations and schema changes. Use when user says "migrate", "数据库迁移", "update schema", "prisma push", "add table", "add field", or needs to modify database structure.
allowed-tools: Read, Write, Edit, Bash(npx prisma:*), Bash(npx tsx:*)
---

# Database Migration

## Overview

Manage Prisma schema changes and database migrations for PostgreSQL (Neon). Handles schema updates, migrations, seeding, and troubleshooting.

## When to Use

Use this skill when:
- Adding/modifying database tables or fields
- Running migrations
- Syncing schema with database
- Seeding data
- Troubleshooting Prisma client issues

## Key Files

- `prisma/schema.prisma` - Schema definition
- `prisma/migrations/` - Migration history
- `.env.local` - Database connection strings
- `prisma.config.js` / `prisma.config.ts` - Prisma 7 datasource URL (DIRECT_URL / DATABASE_URL)

## Common Commands

### Schema Operations

```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Generate client after schema change
npx prisma generate
```

### Database Sync

```bash
# Push schema to database (dev only, no migration)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name <migration-name>

# Apply migrations (production)
npx prisma migrate deploy
```

### Data Operations

```bash
# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed

# Reset database (dev only)
npx prisma migrate reset
```

## Workflow

### Step 1: Modify Schema
Edit `prisma/schema.prisma` to add/modify models.

### Step 2: Validate
```bash
npx prisma validate
```

### Step 3: Generate Client
```bash
npx prisma generate
```

### Step 4: Push/Migrate
```bash
# Development
npx prisma db push

# Production
npx prisma migrate dev --name descriptive-name
```

### Step 5: Restart Dev Server
After schema changes, restart the Next.js dev server.

## Common Issues

### "Unknown field" Error
**Cause**: Prisma client not synced with schema
**Fix**:
```bash
npx prisma generate
# Then restart dev server
```

### Migration Conflict
**Cause**: Database state differs from migration history
**Fix**:
```bash
# Dev: Reset and re-apply
npx prisma migrate reset

# Prod: Manually resolve or baseline
npx prisma migrate resolve --applied <migration-name>
```

### Connection Error
**Cause**: Invalid DATABASE_URL or network issue
**Fix**: Check `.env.local` and database connectivity

## Schema Patterns

### Adding a New Model
```prisma
model NewModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  name      String

  @@index([name])
}
```

### Adding Relation
```prisma
model Parent {
  id       String  @id @default(cuid())
  children Child[]
}

model Child {
  id       String @id @default(cuid())
  parentId String
  parent   Parent @relation(fields: [parentId], references: [id], onDelete: Cascade)

  @@index([parentId])
}
```

### Adding Translation Pattern
```prisma
model Entity {
  id           String @id @default(cuid())
  translations EntityTranslation[]
}

model EntityTranslation {
  id       String @id @default(cuid())
  entityId String
  entity   Entity @relation(fields: [entityId], references: [id], onDelete: Cascade)
  locale   String
  content  String

  @@unique([entityId, locale])
  @@index([locale])
}
```
