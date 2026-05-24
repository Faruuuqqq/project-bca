# Supabase Backup & Recovery Guide

## 🛡️ Daily Automated Backups
Ayam Kalintang uses Supabase's built-in Point-in-Time Recovery (PITR) for enterprise-grade data protection.

### How it works:
1. **Daily Snapshots**: Supabase takes full database snapshots every 24 hours.
2. **WAL Logging**: Write-Ahead Logs (WAL) are saved continuously.
3. **PITR**: You can restore the database to ANY exact second within the last 7 days.

### How to Restore Data:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select the `ayam-kalintang` project
3. Go to **Database** -> **Backups**
4. Select **Point in Time Recovery**
5. Choose the exact date and time you want to restore to
6. Click **Restore** (Note: The database will be briefly unavailable during restoration)

## 📦 Weekly Manual Export (Cold Backup)
For extra safety against cloud provider issues, we recommend exporting the database weekly.

### Using Supabase Dashboard:
1. Go to **Database** -> **Backups**
2. Click **Download Backup** under the Daily Backups section
3. Store the downloaded `.sql` file in a secure location (e.g., Google Drive / Dropbox)

### Using Supabase CLI (For Developers):
```bash
# Export schema
supabase db dump -f backup-schema.sql

# Export data
supabase db dump --data-only -f backup-data.sql
```

## ⚠️ Critical Tables to Monitor
If you ever need to restore specific tables manually instead of the full database, prioritize these:
1. `menus` & `categories` (Core product data)
2. `orders` & `order_items` (Financial records)
3. `inventory_movements` (Audit trail for stock)
4. `stock_alerts` (System health)
