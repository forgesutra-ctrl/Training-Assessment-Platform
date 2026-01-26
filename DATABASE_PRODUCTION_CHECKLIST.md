# Database Production Checklist

Complete checklist for setting up and securing your Supabase database for production.

## 📋 Pre-Production Setup

### Step 1: Create Production Project

- [ ] Create new Supabase project (separate from development)
- [ ] Choose appropriate region (closest to your users)
- [ ] Select appropriate plan (Free tier for testing, Pro for production)
- [ ] Wait for project initialization (2-3 minutes)

### Step 2: Run Database Scripts

Run these scripts in **SQL Editor** in order:

- [ ] **supabase-schema.sql**
  - Creates: `profiles`, `teams`, `assessments` tables
  - Sets up foreign keys and relationships
  - Creates indexes for performance

- [ ] **supabase-constraints-validation.sql**
  - Adds check constraints (ratings 1-5, comments 20-500 chars)
  - Adds unique constraint (prevent duplicate assessments)
  - Creates triggers (prevent self-assessment, cross-team enforcement)
  - Validates assessment data

- [ ] **supabase-audit-log.sql**
  - Creates `audit_logs` table
  - Sets up audit logging functions
  - Creates triggers for automatic logging
  - Configures RLS policies

### Step 3: Verify Tables

Go to **Table Editor** and verify:

- [ ] `profiles` table exists
- [ ] `teams` table exists
- [ ] `assessments` table exists
- [ ] `audit_logs` table exists

### Step 4: Verify Indexes

Go to **Database** → **Indexes** and verify:

- [ ] `idx_assessments_trainer_date` exists
- [ ] `idx_assessments_assessor_date` exists
- [ ] `idx_assessments_date` exists
- [ ] `idx_audit_logs_user_id` exists
- [ ] `idx_audit_logs_action_type` exists
- [ ] `idx_audit_logs_created_at` exists

## 🔒 Security Configuration

### Row Level Security (RLS)

Verify RLS is enabled on all tables:

- [ ] **profiles** - RLS enabled
  - [ ] Admins can view all
  - [ ] Users can view their own
  - [ ] Users can update their own (name only)

- [ ] **teams** - RLS enabled
  - [ ] All authenticated users can view
  - [ ] Only admins can modify

- [ ] **assessments** - RLS enabled
  - [ ] Trainers can view their own
  - [ ] Managers can view their submitted assessments
  - [ ] Admins can view all
  - [ ] Only managers/admins can create
  - [ ] Only admins can delete

- [ ] **audit_logs** - RLS enabled
  - [ ] Only admins can view
  - [ ] System can insert (via service role)

### API Keys Security

- [ ] **Anon Key** - Safe for client-side use
  - [ ] Used in frontend application
  - [ ] Protected by RLS policies
  - [ ] Limited permissions

- [ ] **Service Role Key** - **KEEP SECRET!**
  - [ ] Never expose in client code
  - [ ] Only use server-side
  - [ ] Store securely
  - [ ] Rotate regularly

### Authentication Settings

Go to **Authentication** → **Settings**:

- [ ] **Email Auth** enabled
- [ ] **Email confirmation** configured (optional)
- [ ] **Password requirements** set:
  - [ ] Minimum 8 characters
  - [ ] Require uppercase
  - [ ] Require lowercase
  - [ ] Require numbers
- [ ] **Session timeout** configured (30 minutes recommended)
- [ ] **Redirect URLs** configured:
  - [ ] Production URL added
  - [ ] Development URL added (if needed)

## 📊 Performance Optimization

### Connection Pooling

- [ ] **Connection pooling** enabled (if on Pro plan)
- [ ] Pool size configured appropriately
- [ ] Connection limits set

### Query Performance

- [ ] Test common queries:
  - [ ] Fetch trainer assessments (< 100ms)
  - [ ] Fetch manager assessments (< 100ms)
  - [ ] Fetch admin statistics (< 500ms)
- [ ] Add indexes for slow queries
- [ ] Monitor query performance

### Database Size

- [ ] Monitor database size
- [ ] Set up alerts for size limits
- [ ] Plan for growth

## 💾 Backup Strategy

### Automatic Backups

- [ ] **Point-in-time Recovery** enabled (Pro plan)
- [ ] **Scheduled Backups** configured:
  - [ ] Daily backups enabled
  - [ ] Retention period set (30 days minimum)
  - [ ] Backup time configured

### Manual Backups

- [ ] Test backup restoration process
- [ ] Document backup procedure
- [ ] Schedule regular backup tests

### Backup Verification

- [ ] Verify backups are being created
- [ ] Test restore from backup
- [ ] Document restore procedure

## 🔍 Monitoring & Alerts

### Database Monitoring

- [ ] **Database size** monitoring enabled
- [ ] **Query performance** monitoring
- [ ] **Connection count** monitoring
- [ ] **Error rate** monitoring

### Alerts Configuration

Set up alerts for:

- [ ] Database size approaching limit
- [ ] High error rate
- [ ] Slow queries
- [ ] Connection pool exhaustion
- [ ] Backup failures

### Logging

- [ ] **Audit logs** table populated
- [ ] **Error logs** reviewed regularly
- [ ] **Query logs** monitored (if enabled)

## 🧪 Testing

### Security Testing

- [ ] Test RLS policies:
  - [ ] Manager cannot see other managers' assessments
  - [ ] Trainer cannot see other trainers' data
  - [ ] Manager cannot assess direct reports
  - [ ] Cross-team assessment enforced
- [ ] Test authentication flows
- [ ] Test authorization checks

### Performance Testing

- [ ] Load test with expected user count
- [ ] Test with large datasets (1000+ assessments)
- [ ] Test query performance under load
- [ ] Monitor response times

### Data Integrity Testing

- [ ] Test foreign key constraints
- [ ] Test check constraints (ratings 1-5)
- [ ] Test unique constraints (duplicate prevention)
- [ ] Test trigger functions

## 📝 Documentation

### Database Schema

- [ ] Document all tables and relationships
- [ ] Document all indexes
- [ ] Document all functions and triggers
- [ ] Document RLS policies

### Procedures

- [ ] Document backup procedure
- [ ] Document restore procedure
- [ ] Document migration procedure
- [ ] Document user creation procedure

## ✅ Production Readiness Checklist

Before going live, verify:

- [ ] All tables created
- [ ] All indexes created
- [ ] RLS policies enabled and tested
- [ ] Constraints and triggers working
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Security reviewed
- [ ] Performance tested
- [ ] Documentation complete

## 🔄 Maintenance Schedule

### Daily

- [ ] Check error logs
- [ ] Monitor database size
- [ ] Review audit logs

### Weekly

- [ ] Review query performance
- [ ] Check backup status
- [ ] Review security logs
- [ ] Monitor connection usage

### Monthly

- [ ] Review and optimize slow queries
- [ ] Test backup restoration
- [ ] Review and update indexes
- [ ] Security audit
- [ ] Performance review

## 🚨 Emergency Procedures

### Database Issues

1. **Check Supabase Status:** https://status.supabase.com
2. **Review Error Logs:** Supabase Dashboard → Logs
3. **Check Connection:** Verify API keys
4. **Contact Support:** If issue persists

### Data Loss

1. **Stop all writes** immediately
2. **Identify last good backup**
3. **Restore from backup**
4. **Verify data integrity**
5. **Investigate cause**

### Performance Issues

1. **Check query performance**
2. **Review slow queries**
3. **Add indexes if needed**
4. **Optimize queries**
5. **Scale up if necessary**

## 📞 Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase Status:** https://status.supabase.com
- **Supabase Discord:** https://discord.supabase.com
- **Supabase Support:** support@supabase.com

---

**Your database is production-ready when all items are checked!** ✅
