// Run `npx supabase gen types typescript --linked > src/types/database.ts` after each schema migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      outfits: {
        Row: {
          id: string
          client_id: string
          name: string
          notes: string | null
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          notes?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          notes?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'outfits_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      outfit_items: {
        Row: {
          outfit_id: string
          item_id: string
          sort_order: number
          is_seed_data: boolean
        }
        Insert: {
          outfit_id: string
          item_id: string
          sort_order?: number
          is_seed_data?: boolean
        }
        Update: {
          outfit_id?: string
          item_id?: string
          sort_order?: number
          is_seed_data?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'outfit_items_outfit_id_fkey'
            columns: ['outfit_id']
            isOneToOne: false
            referencedRelation: 'outfits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outfit_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      admin_settings: {
        Row: {
          key: string
          value: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminder_sends: {
        Row: {
          id: string
          client_id: string
          corridor_id: string
          reminder_type: string
          reminder_year: number
          sent_at: string
        }
        Insert: {
          id?: string
          client_id: string
          corridor_id: string
          reminder_type: string
          reminder_year: number
          sent_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          corridor_id?: string
          reminder_type?: string
          reminder_year?: number
          sent_at?: string
        }
        Relationships: []
      }
      admin_broadcasts: {
        Row: {
          id: string
          subject: string
          body: string
          channel: string
          target: string
          target_tier_id: string | null
          target_client_ids: string[] | null
          sent_by: string
          sent_at: string
          recipient_count: number
        }
        Insert: {
          id?: string
          subject: string
          body: string
          channel?: string
          target?: string
          target_tier_id?: string | null
          target_client_ids?: string[] | null
          sent_by: string
          sent_at?: string
          recipient_count?: number
        }
        Update: {
          id?: string
          subject?: string
          body?: string
          channel?: string
          target?: string
          target_tier_id?: string | null
          target_client_ids?: string[] | null
          sent_by?: string
          sent_at?: string
          recipient_count?: number
        }
        Relationships: []
      }
      notification_template_config: {
        Row: {
          id: string
          template_key: string
          label: string
          email_enabled: boolean
          in_app_enabled: boolean
          sms_enabled: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          template_key: string
          label: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          sms_enabled?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          template_key?: string
          label?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          sms_enabled?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          id: string
          actor_id: string
          action: string
          entity_type: string
          entity_id: string | null
          before_state: Json | null
          after_state: Json | null
          metadata: Json
          is_seed_data: boolean
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          before_state?: Json | null
          after_state?: Json | null
          metadata?: Json
          is_seed_data?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          before_state?: Json | null
          after_state?: Json | null
          metadata?: Json
          is_seed_data?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      billing_history_cache: {
        Row: {
          id: string
          client_id: string
          stripe_invoice_id: string
          stripe_subscription_id: string | null
          order_id: string | null
          amount_cents: number
          currency: string
          status: string
          description: string | null
          pdf_url: string | null
          hosted_url: string | null
          invoice_date: string
          period_start: string | null
          period_end: string | null
          refunded_at: string | null
          refund_amount_cents: number | null
          is_seed_data: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
          order_id?: string | null
          amount_cents: number
          currency?: string
          status?: string
          description?: string | null
          pdf_url?: string | null
          hosted_url?: string | null
          invoice_date: string
          period_start?: string | null
          period_end?: string | null
          refunded_at?: string | null
          refund_amount_cents?: number | null
          is_seed_data?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
          order_id?: string | null
          amount_cents?: number
          currency?: string
          status?: string
          description?: string | null
          pdf_url?: string | null
          hosted_url?: string | null
          invoice_date?: string
          period_start?: string | null
          period_end?: string | null
          refunded_at?: string | null
          refund_amount_cents?: number | null
          is_seed_data?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'billing_cache_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          role: Database['public']['Enums']['user_role']
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          onboarding_complete: boolean
          deleted_at: string | null
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: Database['public']['Enums']['user_role']
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          onboarding_complete?: boolean
          deleted_at?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database['public']['Enums']['user_role']
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          onboarding_complete?: boolean
          deleted_at?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          id: string
          profile_id: string
          membership_tier: string
          stripe_customer_id: string | null
          preferred_contact_method: string
          internal_notes: string | null
          preferences: Json
          founding_member: boolean
          subscription_active: boolean
          email_notifications: Json
          default_delivery_address_id: string | null
          preferred_channel: string
          in_app_notification_prefs: Json
          email_notifications_admin_override: Json | null
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          membership_tier?: string
          stripe_customer_id?: string | null
          preferred_contact_method?: string
          internal_notes?: string | null
          preferences?: Json
          founding_member?: boolean
          subscription_active?: boolean
          email_notifications?: Json
          default_delivery_address_id?: string | null
          preferred_channel?: string
          in_app_notification_prefs?: Json
          email_notifications_admin_override?: Json | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          membership_tier?: string
          stripe_customer_id?: string | null
          preferred_contact_method?: string
          internal_notes?: string | null
          preferences?: Json
          founding_member?: boolean
          subscription_active?: boolean
          email_notifications?: Json
          default_delivery_address_id?: string | null
          preferred_channel?: string
          in_app_notification_prefs?: Json
          email_notifications_admin_override?: Json | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_profiles_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      addresses: {
        Row: {
          id: string
          profile_id: string
          label: string
          line1: string
          line2: string | null
          city: string
          state: string
          postal_code: string
          country: string
          is_primary: boolean
          delivery_instructions: string | null
          region_code: string | null
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          label?: string
          line1: string
          line2?: string | null
          city: string
          state: string
          postal_code: string
          country?: string
          is_primary?: boolean
          delivery_instructions?: string | null
          region_code?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          label?: string
          line1?: string
          line2?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          is_primary?: boolean
          delivery_instructions?: string | null
          region_code?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'addresses_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      providers: {
        Row: {
          id: string
          profile_id: string | null
          business_name: string
          contact_name: string
          email: string
          phone: string
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          services: Database['public']['Enums']['service_type'][]
          is_active: boolean
          capacity_per_week: number | null
          turnaround_days_min: number | null
          turnaround_days_max: number | null
          stripe_account_id: string | null
          notes: string | null
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          business_name: string
          contact_name: string
          email: string
          phone: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          services?: Database['public']['Enums']['service_type'][]
          is_active?: boolean
          capacity_per_week?: number | null
          turnaround_days_min?: number | null
          turnaround_days_max?: number | null
          stripe_account_id?: string | null
          notes?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          business_name?: string
          contact_name?: string
          email?: string
          phone?: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          services?: Database['public']['Enums']['service_type'][]
          is_active?: boolean
          capacity_per_week?: number | null
          turnaround_days_min?: number | null
          turnaround_days_max?: number | null
          stripe_account_id?: string | null
          notes?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          client_id: string
          name: string
          sku: string | null
          category: Database['public']['Enums']['item_category']
          brand: string | null
          color: string | null
          size: string | null
          material: string | null
          season: string | null
          purchase_year: number | null
          purchase_price: number | null
          status: Database['public']['Enums']['item_status']
          location_status: Database['public']['Enums']['item_location'] | null
          location_label: string | null
          tags: string[]
          description: string | null
          care_instructions: string | null
          internal_notes: string | null
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          sku?: string | null
          category: Database['public']['Enums']['item_category']
          brand?: string | null
          color?: string | null
          size?: string | null
          material?: string | null
          season?: string | null
          purchase_year?: number | null
          purchase_price?: number | null
          status?: Database['public']['Enums']['item_status']
          location_status?: Database['public']['Enums']['item_location'] | null
          location_label?: string | null
          tags?: string[]
          description?: string | null
          care_instructions?: string | null
          internal_notes?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          sku?: string | null
          category?: Database['public']['Enums']['item_category']
          brand?: string | null
          color?: string | null
          size?: string | null
          material?: string | null
          season?: string | null
          purchase_year?: number | null
          purchase_price?: number | null
          status?: Database['public']['Enums']['item_status']
          location_status?: Database['public']['Enums']['item_location'] | null
          location_label?: string | null
          tags?: string[]
          description?: string | null
          care_instructions?: string | null
          internal_notes?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'items_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      item_photos: {
        Row: {
          id: string
          item_id: string
          uploaded_by: string
          storage_path: string
          storage_bucket: string
          public_url: string | null
          photo_type: string
          sort_order: number
          caption: string | null
          ai_analysis: Json | null
          attribution: Json | null
          related_order_id: string | null
          is_seed_data: boolean
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          uploaded_by: string
          storage_path: string
          storage_bucket?: string
          public_url?: string | null
          photo_type: string
          sort_order?: number
          caption?: string | null
          ai_analysis?: Json | null
          attribution?: Json | null
          related_order_id?: string | null
          is_seed_data?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          uploaded_by?: string
          storage_path?: string
          storage_bucket?: string
          public_url?: string | null
          photo_type?: string
          sort_order?: number
          caption?: string | null
          ai_analysis?: Json | null
          attribution?: Json | null
          related_order_id?: string | null
          is_seed_data?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'item_photos_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      item_conditions: {
        Row: {
          id: string
          item_id: string
          assessed_by: string
          condition_level: Database['public']['Enums']['condition_level']
          notes: string | null
          issues: Json
          is_seed_data: boolean
          assessed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          assessed_by: string
          condition_level: Database['public']['Enums']['condition_level']
          notes?: string | null
          issues?: Json
          is_seed_data?: boolean
          assessed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          assessed_by?: string
          condition_level?: Database['public']['Enums']['condition_level']
          notes?: string | null
          issues?: Json
          is_seed_data?: boolean
          assessed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'item_conditions_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
          id: string
          client_id: string
          order_type: Database['public']['Enums']['order_type']
          status: Database['public']['Enums']['order_status']
          from_location: Database['public']['Enums']['item_location'] | null
          to_address_id: string | null
          requested_delivery_date: string | null
          confirmed_delivery_date: string | null
          provider_id: string | null
          total_cents: number | null
          notes: string | null
          admin_notes: string | null
          corridor_id: string | null
          stripe_invoice_id: string | null
          paid_at: string | null
          refunded_at: string | null
          is_rush: boolean
          is_seed_data: boolean
          outfit_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          order_type: Database['public']['Enums']['order_type']
          status?: Database['public']['Enums']['order_status']
          from_location?: Database['public']['Enums']['item_location'] | null
          to_address_id?: string | null
          requested_delivery_date?: string | null
          confirmed_delivery_date?: string | null
          provider_id?: string | null
          total_cents?: number | null
          notes?: string | null
          admin_notes?: string | null
          corridor_id?: string | null
          stripe_invoice_id?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          is_rush?: boolean
          is_seed_data?: boolean
          outfit_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          order_type?: Database['public']['Enums']['order_type']
          status?: Database['public']['Enums']['order_status']
          from_location?: Database['public']['Enums']['item_location'] | null
          to_address_id?: string | null
          requested_delivery_date?: string | null
          confirmed_delivery_date?: string | null
          provider_id?: string | null
          total_cents?: number | null
          notes?: string | null
          admin_notes?: string | null
          corridor_id?: string | null
          stripe_invoice_id?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          is_rush?: boolean
          is_seed_data?: boolean
          outfit_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'providers'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string
          unit_price_cents: number | null
          notes: string | null
          provider_service_stage: Database['public']['Enums']['provider_service_stage'] | null
          provider_notes: string | null
          damage_flagged: boolean
          is_seed_data: boolean
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          item_id: string
          unit_price_cents?: number | null
          notes?: string | null
          provider_service_stage?: Database['public']['Enums']['provider_service_stage'] | null
          provider_notes?: string | null
          damage_flagged?: boolean
          is_seed_data?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          item_id?: string
          unit_price_cents?: number | null
          notes?: string | null
          provider_service_stage?: Database['public']['Enums']['provider_service_stage'] | null
          provider_notes?: string | null
          damage_flagged?: boolean
          is_seed_data?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: Database['public']['Enums']['order_status']
          actor_profile_id: string | null
          notes: string | null
          is_seed_data: boolean
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: Database['public']['Enums']['order_status']
          actor_profile_id?: string | null
          notes?: string | null
          is_seed_data?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: Database['public']['Enums']['order_status']
          actor_profile_id?: string | null
          notes?: string | null
          is_seed_data?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_status_history_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          }
        ]
      }
      service_tiers: {
        Row: {
          id: string
          name: string
          description: string | null
          monthly_price_cents: number | null
          per_request_base_cents: number | null
          per_item_surcharge_cents: number
          rush_premium_pct: number
          min_lead_time_hours: number
          rush_lead_time_hours: number
          founding_member_discount_pct: number
          active: boolean
          sort_order: number
          stripe_product_id: string | null
          stripe_price_id_current: string | null
          tier_type: string
          billing_cycle: string
          included_services: string[]
          addon_options: Json
          founding_member_eligible: boolean
          tier3_billing_mode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          monthly_price_cents?: number | null
          per_request_base_cents?: number | null
          per_item_surcharge_cents?: number
          rush_premium_pct?: number
          min_lead_time_hours?: number
          rush_lead_time_hours?: number
          founding_member_discount_pct?: number
          active?: boolean
          sort_order?: number
          stripe_product_id?: string | null
          stripe_price_id_current?: string | null
          tier_type?: string
          billing_cycle?: string
          included_services?: string[]
          addon_options?: Json
          founding_member_eligible?: boolean
          tier3_billing_mode?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          monthly_price_cents?: number | null
          per_request_base_cents?: number | null
          per_item_surcharge_cents?: number
          rush_premium_pct?: number
          min_lead_time_hours?: number
          rush_lead_time_hours?: number
          founding_member_discount_pct?: number
          active?: boolean
          sort_order?: number
          stripe_product_id?: string | null
          stripe_price_id_current?: string | null
          tier_type?: string
          billing_cycle?: string
          included_services?: string[]
          addon_options?: Json
          founding_member_eligible?: boolean
          tier3_billing_mode?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_search_logs: {
        Row: {
          id: string
          client_id: string
          query: string
          result_count: number
          input_tokens: number | null
          output_tokens: number | null
          latency_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          query: string
          result_count?: number
          input_tokens?: number | null
          output_tokens?: number | null
          latency_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          query?: string
          result_count?: number
          input_tokens?: number | null
          output_tokens?: number | null
          latency_ms?: number | null
          created_at?: string
        }
        Relationships: []
      }
      concierge_messages: {
        Row: {
          id: string
          client_id: string
          subject: string
          body: string
          status: 'open' | 'in_progress' | 'resolved'
          admin_notes: string | null
          is_seed_data: boolean
          author_profile_id: string | null
          related_order_id: string | null
          thread_id: string | null
          is_provider_message: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          subject: string
          body: string
          status?: 'open' | 'in_progress' | 'resolved'
          admin_notes?: string | null
          is_seed_data?: boolean
          author_profile_id?: string | null
          related_order_id?: string | null
          thread_id?: string | null
          is_provider_message?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          subject?: string
          body?: string
          status?: 'open' | 'in_progress' | 'resolved'
          admin_notes?: string | null
          is_seed_data?: boolean
          author_profile_id?: string | null
          related_order_id?: string | null
          thread_id?: string | null
          is_provider_message?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          id: string
          type: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          created_at: string
        }
        Insert: {
          id: string
          type: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          created_at?: string
        }
        Relationships: []
      }
      client_subscriptions: {
        Row: {
          id: string
          client_id: string
          service_tier_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          founding_member_discount_applied: boolean
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          service_tier_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          founding_member_discount_applied?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          service_tier_id?: string
          stripe_subscription_id?: string
          stripe_price_id?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          founding_member_discount_applied?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_subscriptions_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'client_subscriptions_service_tier_id_fkey'
            columns: ['service_tier_id']
            isOneToOne: false
            referencedRelation: 'service_tiers'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          recipient_profile_id: string
          type: Database['public']['Enums']['notification_type']
          title: string
          snippet: string | null
          link_target: string | null
          metadata: Json
          read_at: string | null
          is_seed_data: boolean
          created_at: string
        }
        Insert: {
          id?: string
          recipient_profile_id: string
          type: Database['public']['Enums']['notification_type']
          title: string
          snippet?: string | null
          link_target?: string | null
          metadata?: Json
          read_at?: string | null
          is_seed_data?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          recipient_profile_id?: string
          type?: Database['public']['Enums']['notification_type']
          title?: string
          snippet?: string | null
          link_target?: string | null
          metadata?: Json
          read_at?: string | null
          is_seed_data?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_recipient_profile_id_fkey'
            columns: ['recipient_profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      email_sends: {
        Row: {
          id: string
          recipient_profile_id: string | null
          template_name: string
          subject: string
          to_address: string
          status: Database['public']['Enums']['email_send_status']
          resend_id: string | null
          error_message: string | null
          created_at: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          recipient_profile_id?: string | null
          template_name: string
          subject: string
          to_address: string
          status?: Database['public']['Enums']['email_send_status']
          resend_id?: string | null
          error_message?: string | null
          created_at?: string
          sent_at?: string | null
        }
        Update: {
          id?: string
          recipient_profile_id?: string | null
          template_name?: string
          subject?: string
          to_address?: string
          status?: Database['public']['Enums']['email_send_status']
          resend_id?: string | null
          error_message?: string | null
          created_at?: string
          sent_at?: string | null
        }
        Relationships: []
      }
      dev_email_inbox: {
        Row: {
          id: string
          recipient: string
          subject: string
          html: string | null
          text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient: string
          subject: string
          html?: string | null
          text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient?: string
          subject?: string
          html?: string | null
          text?: string | null
          created_at?: string
        }
        Relationships: []
      }
      provider_order_assignments: {
        Row: {
          id: string
          order_id: string
          provider_id: string
          assigned_by_profile_id: string | null
          pickup_window_start: string | null
          pickup_window_end: string | null
          delivery_deadline: string | null
          prep_instructions: string | null
          declared_value_total_cents: number | null
          provider_response: Database['public']['Enums']['provider_response_type']
          decline_reason: string | null
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider_id: string
          assigned_by_profile_id?: string | null
          pickup_window_start?: string | null
          pickup_window_end?: string | null
          delivery_deadline?: string | null
          prep_instructions?: string | null
          declared_value_total_cents?: number | null
          provider_response?: Database['public']['Enums']['provider_response_type']
          decline_reason?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider_id?: string
          assigned_by_profile_id?: string | null
          pickup_window_start?: string | null
          pickup_window_end?: string | null
          delivery_deadline?: string | null
          prep_instructions?: string | null
          declared_value_total_cents?: number | null
          provider_response?: Database['public']['Enums']['provider_response_type']
          decline_reason?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'poa_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'poa_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'providers'
            referencedColumns: ['id']
          }
        ]
      }
      order_shipments: {
        Row: {
          id: string
          order_id: string
          direction: Database['public']['Enums']['shipment_direction']
          carrier: Database['public']['Enums']['shipping_carrier'] | null
          carrier_other: string | null
          tracking_number: string | null
          label_url: string | null
          shipped_at: string | null
          expected_delivery_at: string | null
          delivered_at: string | null
          shipping_cost_cents: number | null
          notes: string | null
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          direction?: Database['public']['Enums']['shipment_direction']
          carrier?: Database['public']['Enums']['shipping_carrier'] | null
          carrier_other?: string | null
          tracking_number?: string | null
          label_url?: string | null
          shipped_at?: string | null
          expected_delivery_at?: string | null
          delivered_at?: string | null
          shipping_cost_cents?: number | null
          notes?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          direction?: Database['public']['Enums']['shipment_direction']
          carrier?: Database['public']['Enums']['shipping_carrier'] | null
          carrier_other?: string | null
          tracking_number?: string | null
          label_url?: string | null
          shipped_at?: string | null
          expected_delivery_at?: string | null
          delivered_at?: string | null
          shipping_cost_cents?: number | null
          notes?: string | null
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_shipments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          }
        ]
      }
      corridors: {
        Row: {
          id: string
          slug: string
          display_name: string
          origin_region_code: string
          destination_region_code: string
          active: boolean
          fall_transition_start_date: string | null
          fall_transition_end_date: string | null
          spring_transition_start_date: string | null
          spring_transition_end_date: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          display_name: string
          origin_region_code: string
          destination_region_code: string
          active?: boolean
          fall_transition_start_date?: string | null
          fall_transition_end_date?: string | null
          spring_transition_start_date?: string | null
          spring_transition_end_date?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          display_name?: string
          origin_region_code?: string
          destination_region_code?: string
          active?: boolean
          fall_transition_start_date?: string | null
          fall_transition_end_date?: string | null
          spring_transition_start_date?: string | null
          spring_transition_end_date?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      provider_corridors: {
        Row: {
          id: string
          provider_id: string
          corridor_id: string
          corridor_role: Database['public']['Enums']['corridor_role']
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          corridor_id: string
          corridor_role?: Database['public']['Enums']['corridor_role']
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          corridor_id?: string
          corridor_role?: Database['public']['Enums']['corridor_role']
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'provider_corridors_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'providers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'provider_corridors_corridor_id_fkey'
            columns: ['corridor_id']
            isOneToOne: false
            referencedRelation: 'corridors'
            referencedColumns: ['id']
          }
        ]
      }
      pricing_change_log: {
        Row: {
          id: string
          service_tier_id: string
          actor_profile_id: string | null
          field: string
          before_value: string | null
          after_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          service_tier_id: string
          actor_profile_id?: string | null
          field: string
          before_value?: string | null
          after_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          service_tier_id?: string
          actor_profile_id?: string | null
          field?: string
          before_value?: string | null
          after_value?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pricing_change_log_service_tier_id_fkey'
            columns: ['service_tier_id']
            isOneToOne: false
            referencedRelation: 'service_tiers'
            referencedColumns: ['id']
          }
        ]
      }
      help_articles: {
        Row: {
          id: string
          slug: string
          category: string
          title: string
          body: string
          area_key: string | null
          audience: string
          sort_order: number
          is_published: boolean
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          category: string
          title: string
          body: string
          area_key?: string | null
          audience?: string
          sort_order?: number
          is_published?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          category?: string
          title?: string
          body?: string
          area_key?: string | null
          audience?: string
          sort_order?: number
          is_published?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_tooltips: {
        Row: {
          id: string
          area_key: string
          title: string
          body: string
          linked_article_slug: string | null
          is_published: boolean
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_key: string
          title: string
          body: string
          linked_article_slug?: string | null
          is_published?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_key?: string
          title?: string
          body?: string
          linked_article_slug?: string | null
          is_published?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['user_role']
      }
    }
    CompositeTypes: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'client' | 'provider' | 'admin'
      item_location:
        | 'with_client_wi'
        | 'with_client_az'
        | 'in_storage_wi'
        | 'in_storage_az'
        | 'at_provider_wi'
        | 'at_provider_az'
        | 'in_transit'
        | 'intake_pending'
        | 'delivery_scheduled'
      item_status:
        | 'intake_pending'
        | 'received'
        | 'in_cleaning'
        | 'cleaning_complete'
        | 'stored'
        | 'delivery_scheduled'
        | 'delivered'
        | 'lost'
        | 'damaged'
      condition_level: 'pristine' | 'excellent' | 'good' | 'fair' | 'poor'
      item_category:
        | 'outerwear'
        | 'suiting'
        | 'shirts_blouses'
        | 'trousers_skirts'
        | 'dresses'
        | 'knitwear'
        | 'activewear'
        | 'footwear'
        | 'handbags'
        | 'accessories'
        | 'swimwear'
        | 'lingerie'
        | 'eveningwear'
        | 'other'
      service_type:
        | 'dry_cleaning'
        | 'wet_cleaning'
        | 'hand_wash'
        | 'pressing_steaming'
        | 'alterations'
        | 'repair'
        | 'storage'
        | 'shoe_care'
        | 'leather_care'
      order_type:
        | 'seasonal_rotation'
        | 'on_demand_item'
        | 'return'
      order_status:
        | 'requested'
        | 'confirmed'
        | 'dispatched_to_provider'
        | 'in_preparation'
        | 'shipped'
        | 'delivered'
        | 'return_initiated'
        | 'return_received'
        | 'cancelled'
      notification_type:
        | 'order_confirmed'
        | 'order_status_changed'
        | 'payment_succeeded'
        | 'payment_failed'
        | 'concierge_reply'
        | 'provider_assignment_declined'
        | 'system'
      email_send_status: 'queued' | 'sent' | 'failed' | 'bounced'
      provider_response_type: 'pending' | 'accepted' | 'declined'
      provider_service_stage: 'received' | 'cleaning' | 'pressing' | 'ready_for_pickup'
      shipment_direction: 'outbound' | 'return'
      shipping_carrier: 'ups' | 'fedex' | 'usps' | 'dhl' | 'other'
      corridor_role: 'origin_provider' | 'destination_provider' | 'both'
    }
  }
}
