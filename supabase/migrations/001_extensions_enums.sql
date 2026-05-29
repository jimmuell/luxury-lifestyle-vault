create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

create type user_role as enum ('client', 'provider', 'admin');

create type item_status as enum (
  'intake_pending',
  'received',
  'in_cleaning',
  'cleaning_complete',
  'stored',
  'delivery_scheduled',
  'delivered',
  'lost',
  'damaged'
);

create type condition_level as enum (
  'pristine',
  'excellent',
  'good',
  'fair',
  'poor'
);

create type item_category as enum (
  'outerwear',
  'suiting',
  'shirts_blouses',
  'trousers_skirts',
  'dresses',
  'knitwear',
  'activewear',
  'footwear',
  'handbags',
  'accessories',
  'swimwear',
  'lingerie',
  'eveningwear',
  'other'
);

create type service_type as enum (
  'dry_cleaning',
  'wet_cleaning',
  'hand_wash',
  'pressing_steaming',
  'alterations',
  'repair',
  'storage',
  'shoe_care',
  'leather_care'
);
