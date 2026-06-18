export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          delivery_instructions: string | null
          id: string
          is_primary: boolean
          is_seed_data: boolean
          label: string
          line1: string
          line2: string | null
          postal_code: string
          profile_id: string
          region_code: string | null
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          delivery_instructions?: string | null
          id?: string
          is_primary?: boolean
          is_seed_data?: boolean
          label?: string
          line1: string
          line2?: string | null
          postal_code: string
          profile_id: string
          region_code?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          delivery_instructions?: string | null
          id?: string
          is_primary?: boolean
          is_seed_data?: boolean
          label?: string
          line1?: string
          line2?: string | null
          postal_code?: string
          profile_id?: string
          region_code?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          is_seed_data: boolean
          metadata: Json
        }
        Insert: {
          action: string
          actor_id: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          is_seed_data?: boolean
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          is_seed_data?: boolean
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_broadcasts: {
        Row: {
          body: string
          channel: string
          id: string
          recipient_count: number
          sent_at: string
          sent_by: string
          subject: string
          target: string
          target_client_ids: string[] | null
          target_tier_id: string | null
        }
        Insert: {
          body: string
          channel?: string
          id?: string
          recipient_count?: number
          sent_at?: string
          sent_by: string
          subject: string
          target?: string
          target_client_ids?: string[] | null
          target_tier_id?: string | null
        }
        Update: {
          body?: string
          channel?: string
          id?: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string
          subject?: string
          target?: string
          target_client_ids?: string[] | null
          target_tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_broadcasts_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_broadcasts_target_tier_id_fkey"
            columns: ["target_tier_id"]
            isOneToOne: false
            referencedRelation: "service_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_search_logs: {
        Row: {
          client_id: string
          created_at: string
          id: string
          input_tokens: number | null
          latency_ms: number | null
          output_tokens: number | null
          query: string
          result_count: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          output_tokens?: number | null
          query: string
          result_count?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          output_tokens?: number | null
          query?: string
          result_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_search_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_history_cache: {
        Row: {
          amount_cents: number
          client_id: string
          created_at: string
          currency: string
          description: string | null
          hosted_url: string | null
          id: string
          invoice_date: string
          is_seed_data: boolean
          order_id: string | null
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          refund_amount_cents: number | null
          refunded_at: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id: string | null
        }
        Insert: {
          amount_cents: number
          client_id: string
          created_at?: string
          currency?: string
          description?: string | null
          hosted_url?: string | null
          id?: string
          invoice_date: string
          is_seed_data?: boolean
          order_id?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          refund_amount_cents?: number | null
          refunded_at?: string | null
          status?: string
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
        }
        Update: {
          amount_cents?: number
          client_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          hosted_url?: string | null
          id?: string
          invoice_date?: string
          is_seed_data?: boolean
          order_id?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          refund_amount_cents?: number | null
          refunded_at?: string | null
          status?: string
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_cache_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_history_cache_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          created_at: string
          default_delivery_address_id: string | null
          email_notifications: Json
          email_notifications_admin_override: Json | null
          founding_member: boolean
          id: string
          in_app_notification_prefs: Json
          internal_notes: string | null
          is_seed_data: boolean
          membership_tier: string
          preferences: Json
          preferred_channel: string
          preferred_contact_method: string
          profile_id: string
          sms_consent: boolean
          sms_consent_at: string | null
          sms_consent_source: string | null
          stripe_customer_id: string | null
          subscription_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_delivery_address_id?: string | null
          email_notifications?: Json
          email_notifications_admin_override?: Json | null
          founding_member?: boolean
          id?: string
          in_app_notification_prefs?: Json
          internal_notes?: string | null
          is_seed_data?: boolean
          membership_tier?: string
          preferences?: Json
          preferred_channel?: string
          preferred_contact_method?: string
          profile_id: string
          sms_consent?: boolean
          sms_consent_at?: string | null
          sms_consent_source?: string | null
          stripe_customer_id?: string | null
          subscription_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_delivery_address_id?: string | null
          email_notifications?: Json
          email_notifications_admin_override?: Json | null
          founding_member?: boolean
          id?: string
          in_app_notification_prefs?: Json
          internal_notes?: string | null
          is_seed_data?: boolean
          membership_tier?: string
          preferences?: Json
          preferred_channel?: string
          preferred_contact_method?: string
          profile_id?: string
          sms_consent?: boolean
          sms_consent_at?: string | null
          sms_consent_source?: string | null
          stripe_customer_id?: string | null
          subscription_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_default_delivery_address_id_fkey"
            columns: ["default_delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          client_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          founding_member_discount_applied: boolean
          id: string
          is_seed_data: boolean
          service_tier_id: string
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          client_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          founding_member_discount_applied?: boolean
          id?: string
          is_seed_data?: boolean
          service_tier_id: string
          status?: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          client_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          founding_member_discount_applied?: boolean
          id?: string
          is_seed_data?: boolean
          service_tier_id?: string
          status?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_service_tier_id_fkey"
            columns: ["service_tier_id"]
            isOneToOne: false
            referencedRelation: "service_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_messages: {
        Row: {
          admin_notes: string | null
          author_profile_id: string | null
          body: string
          client_id: string
          created_at: string
          id: string
          is_provider_message: boolean
          is_seed_data: boolean
          related_order_id: string | null
          status: 'open' | 'in_progress' | 'resolved'
          subject: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          author_profile_id?: string | null
          body: string
          client_id: string
          created_at?: string
          id?: string
          is_provider_message?: boolean
          is_seed_data?: boolean
          related_order_id?: string | null
          status?: string
          subject: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          author_profile_id?: string | null
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          is_provider_message?: boolean
          is_seed_data?: boolean
          related_order_id?: string | null
          status?: string
          subject?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_messages_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_messages_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      corridors: {
        Row: {
          active: boolean
          created_at: string
          destination_region_code: string
          display_name: string
          fall_transition_end_date: string | null
          fall_transition_start_date: string | null
          id: string
          origin_region_code: string
          slug: string
          sort_order: number
          spring_transition_end_date: string | null
          spring_transition_start_date: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination_region_code: string
          display_name: string
          fall_transition_end_date?: string | null
          fall_transition_start_date?: string | null
          id?: string
          origin_region_code: string
          slug: string
          sort_order?: number
          spring_transition_end_date?: string | null
          spring_transition_start_date?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          destination_region_code?: string
          display_name?: string
          fall_transition_end_date?: string | null
          fall_transition_start_date?: string | null
          id?: string
          origin_region_code?: string
          slug?: string
          sort_order?: number
          spring_transition_end_date?: string | null
          spring_transition_start_date?: string | null
        }
        Relationships: []
      }
      data_room_reconcile_log: {
        Row: {
          id: string
          run_at: string
          document_id: string | null
          storage_path: string | null
          prev_status: string | null
          new_status: string | null
          drift: boolean
          detail: string | null
        }
        Insert: {
          id?: string
          run_at?: string
          document_id?: string | null
          storage_path?: string | null
          prev_status?: string | null
          new_status?: string | null
          drift?: boolean
          detail?: string | null
        }
        Update: {
          id?: string
          run_at?: string
          document_id?: string | null
          storage_path?: string | null
          prev_status?: string | null
          new_status?: string | null
          drift?: boolean
          detail?: string | null
        }
        Relationships: []
      }
      dev_email_inbox: {
        Row: {
          created_at: string
          html: string | null
          id: string
          recipient: string
          subject: string
          text: string | null
        }
        Insert: {
          created_at?: string
          html?: string | null
          id?: string
          recipient: string
          subject: string
          text?: string | null
        }
        Update: {
          created_at?: string
          html?: string | null
          id?: string
          recipient?: string
          subject?: string
          text?: string | null
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient_profile_id: string | null
          resend_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_send_status"]
          subject: string
          template_name: string
          to_address: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_profile_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status"]
          subject: string
          template_name: string
          to_address: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_profile_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_send_status"]
          subject?: string
          template_name?: string
          to_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          area_key: string | null
          audience: string
          body: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          is_seed_data: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          area_key?: string | null
          audience?: string
          body: string
          category: string
          created_at?: string
          id?: string
          is_published?: boolean
          is_seed_data?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          area_key?: string | null
          audience?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          is_seed_data?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_tooltips: {
        Row: {
          area_key: string
          body: string
          created_at: string
          id: string
          is_published: boolean
          is_seed_data: boolean
          linked_article_slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area_key: string
          body: string
          created_at?: string
          id?: string
          is_published?: boolean
          is_seed_data?: boolean
          linked_article_slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area_key?: string
          body?: string
          created_at?: string
          id?: string
          is_published?: boolean
          is_seed_data?: boolean
          linked_article_slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      investor_document_views: {
        Row: {
          document_id: string
          id: string
          profile_id: string
          view_type: string
          viewed_at: string
        }
        Insert: {
          document_id: string
          id?: string
          profile_id: string
          view_type?: string
          viewed_at?: string
        }
        Update: {
          document_id?: string
          id?: string
          profile_id?: string
          view_type?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_document_views_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "investor_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_document_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_notification_sends: {
        Row: {
          document_id: string
          id: string
          profile_id: string
          sent_at: string
        }
        Insert: {
          document_id: string
          id?: string
          profile_id: string
          sent_at?: string
        }
        Update: {
          document_id?: string
          id?: string
          profile_id?: string
          sent_at?: string
        }
        Relationships: []
      }
      investor_documents: {
        Row: {
          audience: string
          content_sha256: string | null
          content_status: string
          created_at: string
          description: string | null
          doc_type: string
          file_size_bytes: number | null
          file_type: string
          id: string
          is_published: boolean
          last_reconciled_at: string | null
          published_at: string | null
          published_by: string | null
          section: string
          sort_order: number
          source_name: string | null
          source_ref: string | null
          source_revised_at: string | null
          source_system: string | null
          source_version: string | null
          storage_path: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          content_sha256?: string | null
          content_status?: string
          created_at?: string
          description?: string | null
          doc_type?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          is_published?: boolean
          last_reconciled_at?: string | null
          published_at?: string | null
          published_by?: string | null
          section: string
          sort_order?: number
          source_name?: string | null
          source_ref?: string | null
          source_revised_at?: string | null
          source_system?: string | null
          source_version?: string | null
          storage_path: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          content_sha256?: string | null
          content_status?: string
          created_at?: string
          description?: string | null
          doc_type?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          is_published?: boolean
          last_reconciled_at?: string | null
          published_at?: string | null
          published_by?: string | null
          section?: string
          sort_order?: number
          source_name?: string | null
          source_ref?: string | null
          source_revised_at?: string | null
          source_system?: string | null
          source_version?: string | null
          storage_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      investor_faq: {
        Row: {
          id: string
          question: string
          answer: string
          sort_order: number
          audience: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          answer: string
          sort_order?: number
          audience?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          sort_order?: number
          audience?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      investor_updates: {
        Row: {
          id: string
          title: string
          body: string
          audience: string
          is_published: boolean
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          audience?: string
          is_published?: boolean
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          audience?: string
          is_published?: boolean
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      investor_cta_interactions: {
        Row: { id: string; profile_id: string; cta_id: string; interacted_at: string }
        Insert: { id?: string; profile_id: string; cta_id: string; interacted_at?: string }
        Update: { id?: string; profile_id?: string; cta_id?: string; interacted_at?: string }
        Relationships: [
          {
            foreignKeyName: "investor_cta_interactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_cta_interactions_cta_id_fkey"
            columns: ["cta_id"]
            isOneToOne: false
            referencedRelation: "investor_ctas"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_ctas: {
        Row: { id: string; label: string; action_type: string; action_value: string; is_active: boolean; sort_order: number; created_at: string; updated_at: string }
        Insert: { id?: string; label: string; action_type: string; action_value?: string; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string }
        Update: { id?: string; label?: string; action_type?: string; action_value?: string; is_active?: boolean; sort_order?: number; created_at?: string; updated_at?: string }
        Relationships: []
      }
      investor_config: {
        Row: {
          id: string
          welcome_heading: string
          welcome_body: string
          updated_at: string
        }
        Insert: {
          id?: string
          welcome_heading?: string
          welcome_body?: string
          updated_at?: string
        }
        Update: {
          id?: string
          welcome_heading?: string
          welcome_body?: string
          updated_at?: string
        }
        Relationships: []
      }
      investor_nda_acknowledgments: {
        Row: {
          acknowledged_at: string
          full_name: string
          id: string
          ip_address: string | null
          nda_version: string
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          acknowledged_at?: string
          full_name: string
          id?: string
          ip_address?: string | null
          nda_version?: string
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          acknowledged_at?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          nda_version?: string
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_nda_acknowledgments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_conditions: {
        Row: {
          assessed_at: string
          assessed_by: string
          condition_level: Database["public"]["Enums"]["condition_level"]
          created_at: string
          id: string
          is_seed_data: boolean
          issues: Json
          item_id: string
          notes: string | null
        }
        Insert: {
          assessed_at?: string
          assessed_by: string
          condition_level: Database["public"]["Enums"]["condition_level"]
          created_at?: string
          id?: string
          is_seed_data?: boolean
          issues?: Json
          item_id: string
          notes?: string | null
        }
        Update: {
          assessed_at?: string
          assessed_by?: string
          condition_level?: Database["public"]["Enums"]["condition_level"]
          created_at?: string
          id?: string
          is_seed_data?: boolean
          issues?: Json
          item_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_conditions_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_conditions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_photos: {
        Row: {
          ai_analysis: Json | null
          attribution: Json | null
          caption: string | null
          created_at: string
          id: string
          is_seed_data: boolean
          item_id: string
          photo_type: string
          public_url: string | null
          related_order_id: string | null
          sort_order: number
          storage_bucket: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          ai_analysis?: Json | null
          attribution?: Json | null
          caption?: string | null
          created_at?: string
          id?: string
          is_seed_data?: boolean
          item_id: string
          photo_type: string
          public_url?: string | null
          related_order_id?: string | null
          sort_order?: number
          storage_bucket?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          ai_analysis?: Json | null
          attribution?: Json | null
          caption?: string | null
          created_at?: string
          id?: string
          is_seed_data?: boolean
          item_id?: string
          photo_type?: string
          public_url?: string | null
          related_order_id?: string | null
          sort_order?: number
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_photos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_photos_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          brand: string | null
          care_instructions: string | null
          category: Database["public"]["Enums"]["item_category"]
          client_id: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          internal_notes: string | null
          is_seed_data: boolean
          location_label: string | null
          location_status: Database["public"]["Enums"]["item_location"] | null
          material: string | null
          name: string
          purchase_price: number | null
          purchase_year: number | null
          season: string | null
          size: string | null
          sku: string | null
          status: Database["public"]["Enums"]["item_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          brand?: string | null
          care_instructions?: string | null
          category: Database["public"]["Enums"]["item_category"]
          client_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          is_seed_data?: boolean
          location_label?: string | null
          location_status?: Database["public"]["Enums"]["item_location"] | null
          material?: string | null
          name: string
          purchase_price?: number | null
          purchase_year?: number | null
          season?: string | null
          size?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          brand?: string | null
          care_instructions?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          client_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          is_seed_data?: boolean
          location_label?: string | null
          location_status?: Database["public"]["Enums"]["item_location"] | null
          material?: string | null
          name?: string
          purchase_price?: number | null
          purchase_year?: number | null
          season?: string | null
          size?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_template_config: {
        Row: {
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          label: string
          sms_enabled: boolean
          template_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          label: string
          sms_enabled?: boolean
          template_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          label?: string
          sms_enabled?: boolean
          template_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_template_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_seed_data: boolean
          link_target: string | null
          metadata: Json
          read_at: string | null
          recipient_profile_id: string
          snippet: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_seed_data?: boolean
          link_target?: string | null
          metadata?: Json
          read_at?: string | null
          recipient_profile_id: string
          snippet?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_seed_data?: boolean
          link_target?: string | null
          metadata?: Json
          read_at?: string | null
          recipient_profile_id?: string
          snippet?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          damage_flagged: boolean
          id: string
          is_seed_data: boolean
          item_id: string
          notes: string | null
          order_id: string
          provider_notes: string | null
          provider_service_stage:
            | Database["public"]["Enums"]["provider_service_stage"]
            | null
          unit_price_cents: number | null
        }
        Insert: {
          created_at?: string
          damage_flagged?: boolean
          id?: string
          is_seed_data?: boolean
          item_id: string
          notes?: string | null
          order_id: string
          provider_notes?: string | null
          provider_service_stage?:
            | Database["public"]["Enums"]["provider_service_stage"]
            | null
          unit_price_cents?: number | null
        }
        Update: {
          created_at?: string
          damage_flagged?: boolean
          id?: string
          is_seed_data?: boolean
          item_id?: string
          notes?: string | null
          order_id?: string
          provider_notes?: string | null
          provider_service_stage?:
            | Database["public"]["Enums"]["provider_service_stage"]
            | null
          unit_price_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_shipments: {
        Row: {
          carrier: Database["public"]["Enums"]["shipping_carrier"] | null
          carrier_other: string | null
          created_at: string
          delivered_at: string | null
          direction: Database["public"]["Enums"]["shipment_direction"]
          expected_delivery_at: string | null
          id: string
          is_seed_data: boolean
          label_url: string | null
          notes: string | null
          order_id: string
          shipped_at: string | null
          shipping_cost_cents: number | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: Database["public"]["Enums"]["shipping_carrier"] | null
          carrier_other?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["shipment_direction"]
          expected_delivery_at?: string | null
          id?: string
          is_seed_data?: boolean
          label_url?: string | null
          notes?: string | null
          order_id: string
          shipped_at?: string | null
          shipping_cost_cents?: number | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: Database["public"]["Enums"]["shipping_carrier"] | null
          carrier_other?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["shipment_direction"]
          expected_delivery_at?: string | null
          id?: string
          is_seed_data?: boolean
          label_url?: string | null
          notes?: string | null
          order_id?: string
          shipped_at?: string | null
          shipping_cost_cents?: number | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          id: string
          is_seed_data: boolean
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          id?: string
          is_seed_data?: boolean
          notes?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          id?: string
          is_seed_data?: boolean
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          client_id: string
          confirmed_delivery_date: string | null
          corridor_id: string | null
          created_at: string
          from_location: Database["public"]["Enums"]["item_location"] | null
          id: string
          is_rush: boolean
          is_seed_data: boolean
          notes: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          outfit_id: string | null
          paid_at: string | null
          provider_id: string | null
          refunded_at: string | null
          requested_delivery_date: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_invoice_id: string | null
          to_address_id: string | null
          total_cents: number | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          client_id: string
          confirmed_delivery_date?: string | null
          corridor_id?: string | null
          created_at?: string
          from_location?: Database["public"]["Enums"]["item_location"] | null
          id?: string
          is_rush?: boolean
          is_seed_data?: boolean
          notes?: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          outfit_id?: string | null
          paid_at?: string | null
          provider_id?: string | null
          refunded_at?: string | null
          requested_delivery_date?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_invoice_id?: string | null
          to_address_id?: string | null
          total_cents?: number | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          client_id?: string
          confirmed_delivery_date?: string | null
          corridor_id?: string | null
          created_at?: string
          from_location?: Database["public"]["Enums"]["item_location"] | null
          id?: string
          is_rush?: boolean
          is_seed_data?: boolean
          notes?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          outfit_id?: string | null
          paid_at?: string | null
          provider_id?: string | null
          refunded_at?: string | null
          requested_delivery_date?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_invoice_id?: string | null
          to_address_id?: string | null
          total_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_to_address_id_fkey"
            columns: ["to_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_items: {
        Row: {
          is_seed_data: boolean
          item_id: string
          outfit_id: string
          sort_order: number
        }
        Insert: {
          is_seed_data?: boolean
          item_id: string
          outfit_id: string
          sort_order?: number
        }
        Update: {
          is_seed_data?: boolean
          item_id?: string
          outfit_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "outfit_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_seed_data: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_seed_data?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_seed_data?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_change_log: {
        Row: {
          actor_profile_id: string | null
          after_value: string | null
          before_value: string | null
          created_at: string
          field: string
          id: string
          service_tier_id: string
        }
        Insert: {
          actor_profile_id?: string | null
          after_value?: string | null
          before_value?: string | null
          created_at?: string
          field: string
          id?: string
          service_tier_id: string
        }
        Update: {
          actor_profile_id?: string | null
          after_value?: string | null
          before_value?: string | null
          created_at?: string
          field?: string
          id?: string
          service_tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_change_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_change_log_service_tier_id_fkey"
            columns: ["service_tier_id"]
            isOneToOne: false
            referencedRelation: "service_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string | null
          id: string
          investor_notifications_opt_in: boolean
          investor_tier: string
          is_seed_data: boolean
          nda_acknowledged: boolean
          onboarding_complete: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name?: string | null
          id: string
          investor_notifications_opt_in?: boolean
          investor_tier?: string
          is_seed_data?: boolean
          nda_acknowledged?: boolean
          onboarding_complete?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          investor_notifications_opt_in?: boolean
          investor_tier?: string
          is_seed_data?: boolean
          nda_acknowledged?: boolean
          onboarding_complete?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      provider_corridors: {
        Row: {
          corridor_id: string
          corridor_role: Database["public"]["Enums"]["corridor_role"]
          created_at: string
          id: string
          provider_id: string
        }
        Insert: {
          corridor_id: string
          corridor_role?: Database["public"]["Enums"]["corridor_role"]
          created_at?: string
          id?: string
          provider_id: string
        }
        Update: {
          corridor_id?: string
          corridor_role?: Database["public"]["Enums"]["corridor_role"]
          created_at?: string
          id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_corridors_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_corridors_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_order_assignments: {
        Row: {
          assigned_by_profile_id: string | null
          created_at: string
          declared_value_total_cents: number | null
          decline_reason: string | null
          delivery_deadline: string | null
          id: string
          is_seed_data: boolean
          order_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          prep_instructions: string | null
          provider_id: string
          provider_response: Database["public"]["Enums"]["provider_response_type"]
          updated_at: string
        }
        Insert: {
          assigned_by_profile_id?: string | null
          created_at?: string
          declared_value_total_cents?: number | null
          decline_reason?: string | null
          delivery_deadline?: string | null
          id?: string
          is_seed_data?: boolean
          order_id: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          prep_instructions?: string | null
          provider_id: string
          provider_response?: Database["public"]["Enums"]["provider_response_type"]
          updated_at?: string
        }
        Update: {
          assigned_by_profile_id?: string | null
          created_at?: string
          declared_value_total_cents?: number | null
          decline_reason?: string | null
          delivery_deadline?: string | null
          id?: string
          is_seed_data?: boolean
          order_id?: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          prep_instructions?: string | null
          provider_id?: string
          provider_response?: Database["public"]["Enums"]["provider_response_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_order_assignments_assigned_by_profile_id_fkey"
            columns: ["assigned_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_order_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_order_assignments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_name: string
          capacity_per_week: number | null
          city: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_seed_data: boolean
          notes: string | null
          phone: string
          postal_code: string | null
          profile_id: string | null
          services: Database["public"]["Enums"]["service_type"][]
          state: string | null
          stripe_account_id: string | null
          turnaround_days_max: number | null
          turnaround_days_min: number | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_name: string
          capacity_per_week?: number | null
          city?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          is_seed_data?: boolean
          notes?: string | null
          phone: string
          postal_code?: string | null
          profile_id?: string | null
          services?: Database["public"]["Enums"]["service_type"][]
          state?: string | null
          stripe_account_id?: string | null
          turnaround_days_max?: number | null
          turnaround_days_min?: number | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_name?: string
          capacity_per_week?: number | null
          city?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_seed_data?: boolean
          notes?: string | null
          phone?: string
          postal_code?: string | null
          profile_id?: string | null
          services?: Database["public"]["Enums"]["service_type"][]
          state?: string | null
          stripe_account_id?: string | null
          turnaround_days_max?: number | null
          turnaround_days_min?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_sends: {
        Row: {
          client_id: string
          corridor_id: string
          id: string
          reminder_type: string
          reminder_year: number
          sent_at: string
        }
        Insert: {
          client_id: string
          corridor_id: string
          id?: string
          reminder_type: string
          reminder_year: number
          sent_at?: string
        }
        Update: {
          client_id?: string
          corridor_id?: string
          id?: string
          reminder_type?: string
          reminder_year?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_sends_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_sends_corridor_id_fkey"
            columns: ["corridor_id"]
            isOneToOne: false
            referencedRelation: "corridors"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tiers: {
        Row: {
          active: boolean
          addon_options: Json
          billing_cycle: string
          created_at: string
          description: string | null
          founding_member_discount_pct: number
          founding_member_eligible: boolean
          id: string
          included_services: string[]
          min_lead_time_hours: number
          monthly_price_cents: number | null
          name: string
          per_item_surcharge_cents: number
          per_request_base_cents: number | null
          return_min_lead_hours: number
          rush_lead_time_hours: number
          rush_premium_pct: number
          sort_order: number
          stripe_price_id_current: string | null
          stripe_product_id: string | null
          tier_type: string
          tier3_billing_mode: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          addon_options?: Json
          billing_cycle?: string
          created_at?: string
          description?: string | null
          founding_member_discount_pct?: number
          founding_member_eligible?: boolean
          id?: string
          included_services?: string[]
          min_lead_time_hours?: number
          monthly_price_cents?: number | null
          name: string
          per_item_surcharge_cents?: number
          per_request_base_cents?: number | null
          return_min_lead_hours?: number
          rush_lead_time_hours?: number
          rush_premium_pct?: number
          sort_order?: number
          stripe_price_id_current?: string | null
          stripe_product_id?: string | null
          tier_type?: string
          tier3_billing_mode?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          addon_options?: Json
          billing_cycle?: string
          created_at?: string
          description?: string | null
          founding_member_discount_pct?: number
          founding_member_eligible?: boolean
          id?: string
          included_services?: string[]
          min_lead_time_hours?: number
          monthly_price_cents?: number | null
          name?: string
          per_item_surcharge_cents?: number
          per_request_base_cents?: number | null
          return_min_lead_hours?: number
          rush_lead_time_hours?: number
          rush_premium_pct?: number
          sort_order?: number
          stripe_price_id_current?: string | null
          stripe_product_id?: string | null
          tier_type?: string
          tier3_billing_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      data_room_currency: {
        Row: {
          id: string
          section: string
          title: string
          audience: string
          is_published: boolean
          content_status: string
          source_name: string | null
          source_version: string | null
          published_at: string | null
          last_reconciled_at: string | null
          reconcile_overdue: boolean
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_my_tier: { Args: never; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      condition_level: "pristine" | "excellent" | "good" | "fair" | "poor"
      corridor_role: "origin_provider" | "destination_provider" | "both"
      email_send_status: "queued" | "sent" | "failed" | "bounced"
      item_category:
        | "outerwear"
        | "suiting"
        | "shirts_blouses"
        | "trousers_skirts"
        | "dresses"
        | "knitwear"
        | "activewear"
        | "footwear"
        | "handbags"
        | "accessories"
        | "swimwear"
        | "lingerie"
        | "eveningwear"
        | "other"
      item_location:
        | "with_client_wi"
        | "with_client_az"
        | "in_storage_wi"
        | "in_storage_az"
        | "at_provider_wi"
        | "at_provider_az"
        | "in_transit"
        | "intake_pending"
        | "delivery_scheduled"
      item_status:
        | "intake_pending"
        | "received"
        | "in_cleaning"
        | "cleaning_complete"
        | "stored"
        | "delivery_scheduled"
        | "delivered"
        | "lost"
        | "damaged"
      notification_type:
        | "order_confirmed"
        | "order_status_changed"
        | "payment_succeeded"
        | "payment_failed"
        | "concierge_reply"
        | "provider_assignment_declined"
        | "system"
      order_status:
        | "requested"
        | "confirmed"
        | "dispatched_to_provider"
        | "in_preparation"
        | "shipped"
        | "delivered"
        | "return_initiated"
        | "return_received"
        | "cancelled"
      order_type: "seasonal_rotation" | "on_demand_item" | "return"
      provider_response_type: "pending" | "accepted" | "declined"
      provider_service_stage:
        | "received"
        | "cleaning"
        | "pressing"
        | "ready_for_pickup"
      service_type:
        | "dry_cleaning"
        | "wet_cleaning"
        | "hand_wash"
        | "pressing_steaming"
        | "alterations"
        | "repair"
        | "storage"
        | "shoe_care"
        | "leather_care"
      shipment_direction: "outbound" | "return"
      shipping_carrier: "ups" | "fedex" | "usps" | "dhl" | "other"
      user_role: "client" | "provider" | "admin" | "investor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      condition_level: ["pristine", "excellent", "good", "fair", "poor"],
      corridor_role: ["origin_provider", "destination_provider", "both"],
      email_send_status: ["queued", "sent", "failed", "bounced"],
      item_category: [
        "outerwear",
        "suiting",
        "shirts_blouses",
        "trousers_skirts",
        "dresses",
        "knitwear",
        "activewear",
        "footwear",
        "handbags",
        "accessories",
        "swimwear",
        "lingerie",
        "eveningwear",
        "other",
      ],
      item_location: [
        "with_client_wi",
        "with_client_az",
        "in_storage_wi",
        "in_storage_az",
        "at_provider_wi",
        "at_provider_az",
        "in_transit",
        "intake_pending",
        "delivery_scheduled",
      ],
      item_status: [
        "intake_pending",
        "received",
        "in_cleaning",
        "cleaning_complete",
        "stored",
        "delivery_scheduled",
        "delivered",
        "lost",
        "damaged",
      ],
      notification_type: [
        "order_confirmed",
        "order_status_changed",
        "payment_succeeded",
        "payment_failed",
        "concierge_reply",
        "provider_assignment_declined",
        "system",
      ],
      order_status: [
        "requested",
        "confirmed",
        "dispatched_to_provider",
        "in_preparation",
        "shipped",
        "delivered",
        "return_initiated",
        "return_received",
        "cancelled",
      ],
      order_type: ["seasonal_rotation", "on_demand_item", "return"],
      provider_response_type: ["pending", "accepted", "declined"],
      provider_service_stage: [
        "received",
        "cleaning",
        "pressing",
        "ready_for_pickup",
      ],
      service_type: [
        "dry_cleaning",
        "wet_cleaning",
        "hand_wash",
        "pressing_steaming",
        "alterations",
        "repair",
        "storage",
        "shoe_care",
        "leather_care",
      ],
      shipment_direction: ["outbound", "return"],
      shipping_carrier: ["ups", "fedex", "usps", "dhl", "other"],
      user_role: ["client", "provider", "admin", "investor"],
    },
  },
} as const
