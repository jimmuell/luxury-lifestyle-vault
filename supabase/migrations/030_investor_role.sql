-- 030_investor_role.sql
-- Add 'investor' to user_role. Standalone migration (a new enum value can't be
-- used in the same transaction it's added). Later migrations (031) use it.
alter type user_role add value if not exists 'investor';
