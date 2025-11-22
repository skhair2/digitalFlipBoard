# Supabase Configuration Quick Reference

## Project Details

| Property | Value |
|----------|-------|
| **Project Name** | Digital FlipBoard |
| **Project ID** | mfdycgjdaxygpxyxnfuq |
| **Project URL** | https://mfdycgjdaxygpxyxnfuq.supabase.co |
| **Database** | PostgreSQL 15+ |
| **Region** | N/A (MCP Server) |

## API Keys

### Anon Key (For Client)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZHljZ2pkYXh5Z3B4eXhuZnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTc2ODksImV4cCI6MjA3ODQ3MzY4OX0.SvRXVQgx5jogSy9YdR2ScVs92Z6h8f9CcS6-UXBPtu0
```

### Service Role Key (For Server)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZHljZ2pkYXh5Z3B4eXhuZnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg5NzY4OSwiZXhwIjoyMDc4NDczNjg5fQ.VY0UKk9TfqQRHDVMRaYgQC7-U6Rk-HZ9qOdJ9zPUMcg
```

## Environment Variables

```env
# Frontend (.env.local)
VITE_SUPABASE_URL=https://mfdycgjdaxygpxyxnfuq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZHljZ2pkYXh5Z3B4eXhuZnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTc2ODksImV4cCI6MjA3ODQ3MzY4OX0.SvRXVQgx5jogSy9YdR2ScVs92Z6h8f9CcS6-UXBPtu0

# Backend (server/.env)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZHljZ2pkYXh5Z3B4eXhuZnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg5NzY4OSwiZXhwIjoyMDc4NDczNjg5fQ.VY0UKk9TfqQRHDVMRaYgQC7-U6Rk-HZ9qOdJ9zPUMcg
SUPABASE_URL=https://mfdycgjdaxygpxyxnfuq.supabase.co
```

## Database Schema

### Tables (5 Premium Design Tables)
1. **premium_designs** - User-created designs with grid layouts
2. **design_versions** - Version history for rollback
3. **design_collections** - Organization folders
4. **design_collection_members** - Designs in collections
5. **design_likes** - User favorites/likes

### Plus Pre-existing Tables
- auth.users (Supabase managed)
- auth.sessions, auth.identities (Supabase managed)
- 20+ other system/custom tables
- Total: 40+ tables in database

## Important Endpoints

### API Endpoint
```
https://mfdycgjdaxygpxyxnfuq.supabase.co/rest/v1/
```

### Real-time Endpoint
```
wss://mfdycgjdaxygpxyxnfuq.supabase.co/realtime/v1/
```

### Auth Endpoint
```
https://mfdycgjdaxygpxyxnfuq.supabase.co/auth/v1/
```

## Table Query Examples

### List User's Designs
```javascript
const { data } = await supabase
  .from('premium_designs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

### Create Design
```javascript
const { data } = await supabase
  .from('premium_designs')
  .insert([{
    user_id: userId,
    name: 'My Design',
    layout: [...],
    grid_rows: 6,
    grid_cols: 22
  }])
```

### Create Collection
```javascript
const { data } = await supabase
  .from('design_collections')
  .insert([{
    user_id: userId,
    name: 'My Collection',
    description: '...'
  }])
```

### Add Design to Collection
```javascript
const { data } = await supabase
  .from('design_collection_members')
  .insert([{
    collection_id: collectionId,
    design_id: designId,
    position: 0
  }])
```

### Save Version
```javascript
const { data } = await supabase
  .from('design_versions')
  .insert([{
    design_id: designId,
    version_number: 2,
    layout: [...],
    change_description: 'Updated text'
  }])
```

## RLS Security

All tables have Row Level Security (RLS) enabled with these rules:

- **Users can only see their own data** (except public items)
- **Collections are user-specific**
- **Versions tied to design ownership**
- **Likes are public (visible to all)**
- **Public templates available to all**

## Extensions Available

- uuid-ossp - UUID generation
- pgcrypto - Encryption
- citext - Case-insensitive text
- pgjwt - JWT tokens
- pg_cron - Job scheduling
- pg_stat_statements - Query stats

## Performance Features

- 17 database indexes created
- Foreign key constraints for integrity
- Unique constraints on sensitive fields
- Check constraints on grid dimensions
- Automatic updated_at timestamps

## Connection String (PostgreSQL Client)

```
postgresql://postgres:[PASSWORD]@db.mfdycgjdaxygpxyxnfuq.supabase.co:5432/postgres
```

(Use Supabase dashboard to find full connection string with password)

## Dashboard Links

- **Supabase Console:** https://app.supabase.com
- **Project Settings:** Search for "mfdycgjdaxygpxyxnfuq"
- **Database Editor:** Tables listed above
- **API Docs:** Auto-generated from schema

## Troubleshooting

### Test Connection
```javascript
const { data, error } = await supabase.from('premium_designs').select('count', { count: 'exact' })
console.log(data) // Should return count of designs
```

### Check Auth
```javascript
const user = await supabase.auth.getUser()
console.log(user.data.user) // Should show logged-in user
```

### View Real-time
```javascript
supabase
  .channel('designs')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'premium_designs' },
    payload => console.log('Change:', payload)
  )
  .subscribe()
```

## Support

- **Docs:** https://supabase.com/docs
- **Forum:** https://github.com/supabase/supabase/discussions
- **Issues:** Report in project repo

---

**Last Updated:** November 22, 2025
**Status:** ✅ ACTIVE & VERIFIED
