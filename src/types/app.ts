import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export type ClientProfile = Database['public']['Tables']['client_profiles']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type AddressInsert = Database['public']['Tables']['addresses']['Insert']

export type Provider = Database['public']['Tables']['providers']['Row']

export type Item = Database['public']['Tables']['items']['Row']
export type ItemInsert = Database['public']['Tables']['items']['Insert']
export type ItemUpdate = Database['public']['Tables']['items']['Update']

export type ItemPhoto = Database['public']['Tables']['item_photos']['Row']
export type ItemPhotoInsert = Database['public']['Tables']['item_photos']['Insert']

export type ItemCondition = Database['public']['Tables']['item_conditions']['Row']
export type ItemConditionInsert = Database['public']['Tables']['item_conditions']['Insert']

export type ConciergeMessage = Database['public']['Tables']['concierge_messages']['Row']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderStatusHistory = Database['public']['Tables']['order_status_history']['Row']
export type ServiceTier = Database['public']['Tables']['service_tiers']['Row']

export type UserRole = Database['public']['Enums']['user_role']
export type ItemStatus = Database['public']['Enums']['item_status']
export type ItemLocation = Database['public']['Enums']['item_location']
export type ConditionLevel = Database['public']['Enums']['condition_level']
export type ItemCategory = Database['public']['Enums']['item_category']
export type ServiceType = Database['public']['Enums']['service_type']
export type OrderStatus = Database['public']['Enums']['order_status']
export type OrderType = Database['public']['Enums']['order_type']

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  intake_pending: 'Intake Pending',
  received: 'Received',
  in_cleaning: 'In Cleaning',
  cleaning_complete: 'Cleaning Complete',
  stored: 'Stored',
  delivery_scheduled: 'Delivery Scheduled',
  delivered: 'Delivered',
  lost: 'Lost',
  damaged: 'Damaged',
}

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  outerwear: 'Outerwear',
  suiting: 'Suiting',
  shirts_blouses: 'Shirts & Blouses',
  trousers_skirts: 'Trousers & Skirts',
  dresses: 'Dresses',
  knitwear: 'Knitwear',
  activewear: 'Activewear',
  footwear: 'Footwear',
  handbags: 'Handbags',
  accessories: 'Accessories',
  swimwear: 'Swimwear',
  lingerie: 'Lingerie',
  eveningwear: 'Eveningwear',
  other: 'Other',
}

export const ITEM_LOCATION_LABELS: Record<ItemLocation, string> = {
  with_client_wi: 'With Client — Wisconsin',
  with_client_az: 'With Client — Arizona',
  in_storage_wi: 'In Storage — Wisconsin',
  in_storage_az: 'In Storage — Arizona',
  at_provider_wi: 'At Provider — Wisconsin',
  at_provider_az: 'At Provider — Arizona',
  in_transit: 'In Transit',
  intake_pending: 'Intake Pending',
  delivery_scheduled: 'Delivery Scheduled',
}

export const CONDITION_LEVEL_LABELS: Record<ConditionLevel, string> = {
  pristine: 'Pristine',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

// Valid item status transitions (admin only)
export const ITEM_STATUS_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  intake_pending: ['received', 'lost'],
  received: ['in_cleaning', 'stored', 'damaged', 'lost'],
  in_cleaning: ['cleaning_complete', 'damaged', 'lost'],
  cleaning_complete: ['stored', 'delivery_scheduled', 'damaged'],
  stored: ['delivery_scheduled', 'in_cleaning', 'damaged', 'lost'],
  delivery_scheduled: ['delivered', 'stored'],
  delivered: ['intake_pending'],
  lost: [],
  damaged: ['in_cleaning', 'stored'],
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  dispatched_to_provider: 'Dispatched to Provider',
  in_preparation: 'In Preparation',
  shipped: 'Shipped',
  delivered: 'Delivered',
  return_initiated: 'Return Initiated',
  return_received: 'Return Received',
  cancelled: 'Cancelled',
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  seasonal_rotation: 'Seasonal Rotation',
  on_demand_item: 'On-Demand Request',
  return: 'Return',
}

// Valid order status transitions (admin only, except clientCancelOrder and clientInitiateReturn)
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['dispatched_to_provider', 'cancelled'],
  dispatched_to_provider: ['in_preparation', 'cancelled'],
  in_preparation: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_initiated'],
  return_initiated: ['return_received'],
  return_received: [],
  cancelled: [],
}

// Statuses where a client can cancel their own order
export const CLIENT_CANCELLABLE_STATUSES: OrderStatus[] = ['requested', 'confirmed']

export type HelpTooltip = Database['public']['Tables']['help_tooltips']['Row']
export type HelpArticle = Database['public']['Tables']['help_articles']['Row']

export const HELP_CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting Started',
  rotations: 'Seasonal Rotations',
  on_demand: 'On-Demand',
  billing: 'Billing',
  returns: 'Returns',
  coverage: 'Coverage & Care',
  provider: 'Provider Reference',
}
