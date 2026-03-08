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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      agent_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          created_by: string
          error_message: string | null
          expires_at: string
          id: string
          idempotency_key: string | null
          job_type: Database["public"]["Enums"]["agent_job_type"]
          max_attempts: number
          payload: Json
          priority: number
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["agent_job_status"]
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_message?: string | null
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          job_type: Database["public"]["Enums"]["agent_job_type"]
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_job_status"]
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          job_type?: Database["public"]["Enums"]["agent_job_type"]
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_job_status"]
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_prompt_templates: {
        Row: {
          content: string
          description: string | null
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          content: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          content?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_daily: {
        Row: {
          count: number
          day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          anon_id: string
          created_at: string
          event_name: string
          id: string
          props: Json | null
          user_id: string | null
        }
        Insert: {
          anon_id: string
          created_at?: string
          event_name: string
          id?: string
          props?: Json | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string
          created_at?: string
          event_name?: string
          id?: string
          props?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          anon_id: string
          choices: Json
          created_at: string
          id: string
          ip_hash: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anon_id: string
          choices?: Json
          created_at?: string
          id?: string
          ip_hash?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string
          choices?: Json
          created_at?: string
          id?: string
          ip_hash?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_draws: {
        Row: {
          card_id: string
          created_at: string
          draw_date: string
          embedding_json: Json | null
          energy_dimensions: Json | null
          energy_score: number | null
          id: string
          interpretation: Json | null
          journal_entry: string | null
          mood: string | null
          orientation: string
          psych_reflection: Json | null
          reflection_question: string | null
          themes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          draw_date?: string
          embedding_json?: Json | null
          energy_dimensions?: Json | null
          energy_score?: number | null
          id?: string
          interpretation?: Json | null
          journal_entry?: string | null
          mood?: string | null
          orientation?: string
          psych_reflection?: Json | null
          reflection_question?: string | null
          themes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          draw_date?: string
          embedding_json?: Json | null
          energy_dimensions?: Json | null
          energy_score?: number | null
          id?: string
          interpretation?: Json | null
          journal_entry?: string | null
          mood?: string | null
          orientation?: string
          psych_reflection?: Json | null
          reflection_question?: string | null
          themes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_leads: {
        Row: {
          consent: boolean
          consent_text: string
          consent_timestamp: string
          created_at: string
          email: string
          email_verified: boolean
          first_name: string | null
          id: string
          session_id: string | null
          spread_id: string | null
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
          verification_sent_at: string | null
          verification_token: string | null
        }
        Insert: {
          consent?: boolean
          consent_text: string
          consent_timestamp?: string
          created_at?: string
          email: string
          email_verified?: boolean
          first_name?: string | null
          id?: string
          session_id?: string | null
          spread_id?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Update: {
          consent?: boolean
          consent_text?: string
          consent_timestamp?: string
          created_at?: string
          email?: string
          email_verified?: boolean
          first_name?: string | null
          id?: string
          session_id?: string | null
          spread_id?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "reading_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          admin_bootstrap_used: boolean
          double_opt_in: boolean | null
          enable_advanced_spreads: boolean | null
          enable_ai_deep_analysis: boolean | null
          enable_audio_readings: boolean | null
          enable_billing: boolean | null
          enable_relationship_analysis: boolean | null
          enable_shop: boolean | null
          enable_unlimited_readings: boolean | null
          enable_waitlist: boolean | null
          id: number
          maintenance_mode: boolean | null
          updated_at: string
        }
        Insert: {
          admin_bootstrap_used?: boolean
          double_opt_in?: boolean | null
          enable_advanced_spreads?: boolean | null
          enable_ai_deep_analysis?: boolean | null
          enable_audio_readings?: boolean | null
          enable_billing?: boolean | null
          enable_relationship_analysis?: boolean | null
          enable_shop?: boolean | null
          enable_unlimited_readings?: boolean | null
          enable_waitlist?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          updated_at?: string
        }
        Update: {
          admin_bootstrap_used?: boolean
          double_opt_in?: boolean | null
          enable_advanced_spreads?: boolean | null
          enable_ai_deep_analysis?: boolean | null
          enable_audio_readings?: boolean | null
          enable_billing?: boolean | null
          enable_relationship_analysis?: boolean | null
          enable_shop?: boolean | null
          enable_unlimited_readings?: boolean | null
          enable_waitlist?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      narrative_memories: {
        Row: {
          created_at: string
          embedding_json: Json | null
          emotional_arc: string | null
          emotional_direction: string | null
          id: string
          key_cards: Json | null
          pattern_data: Json | null
          reading_count: number | null
          summary: string
          themes: string[] | null
          time_range_end: string | null
          time_range_start: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding_json?: Json | null
          emotional_arc?: string | null
          emotional_direction?: string | null
          id?: string
          key_cards?: Json | null
          pattern_data?: Json | null
          reading_count?: number | null
          summary: string
          themes?: string[] | null
          time_range_end?: string | null
          time_range_start?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          embedding_json?: Json | null
          emotional_arc?: string | null
          emotional_direction?: string | null
          id?: string
          key_cards?: Json | null
          pattern_data?: Json | null
          reading_count?: number | null
          summary?: string
          themes?: string[] | null
          time_range_end?: string | null
          time_range_start?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          display_name: string | null
          id: string
          intention: string | null
          onboarding_completed: boolean | null
          preferred_domain: string | null
          referred_by: string | null
          updated_at: string
          zodiac_sign: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          intention?: string | null
          onboarding_completed?: boolean | null
          preferred_domain?: string | null
          referred_by?: string | null
          updated_at?: string
          zodiac_sign?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          intention?: string | null
          onboarding_completed?: boolean | null
          preferred_domain?: string | null
          referred_by?: string | null
          updated_at?: string
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          duration_hours: number
          id: string
          is_active: boolean
          max_uses: number
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          duration_hours?: number
          id?: string
          is_active?: boolean
          max_uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          duration_hours?: number
          id?: string
          is_active?: boolean
          max_uses?: number
        }
        Relationships: []
      }
      reading_results: {
        Row: {
          created_at: string
          embedding_json: Json | null
          id: string
          interpretation: Json | null
          session_id: string
        }
        Insert: {
          created_at?: string
          embedding_json?: Json | null
          id?: string
          interpretation?: Json | null
          session_id: string
        }
        Update: {
          created_at?: string
          embedding_json?: Json | null
          id?: string
          interpretation?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "reading_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          created_at: string
          id: string
          question: string | null
          seed: number | null
          selected_cards: Json
          spread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question?: string | null
          seed?: number | null
          selected_cards?: Json
          spread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question?: string | null
          seed?: number | null
          selected_cards?: Json
          spread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_readings: {
        Row: {
          card_id: string
          card_name_fr: string
          created_at: string
          draw_id: string | null
          expires_at: string
          id: string
          image_url: string | null
          interp_summary: string | null
          interp_title: string | null
          orientation: string
          reading_id: string | null
          referral_code: string | null
          share_id: string
          signup_count: number
          user_id: string
          visit_count: number
        }
        Insert: {
          card_id: string
          card_name_fr?: string
          created_at?: string
          draw_id?: string | null
          expires_at?: string
          id?: string
          image_url?: string | null
          interp_summary?: string | null
          interp_title?: string | null
          orientation?: string
          reading_id?: string | null
          referral_code?: string | null
          share_id?: string
          signup_count?: number
          user_id: string
          visit_count?: number
        }
        Update: {
          card_id?: string
          card_name_fr?: string
          created_at?: string
          draw_id?: string | null
          expires_at?: string
          id?: string
          image_url?: string | null
          interp_summary?: string | null
          interp_title?: string | null
          orientation?: string
          reading_id?: string | null
          referral_code?: string | null
          share_id?: string
          signup_count?: number
          user_id?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_readings_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "daily_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_readings_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "tarot_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          credits_remaining: number | null
          current_period_end: string | null
          id: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          credits_remaining?: number | null
          current_period_end?: string | null
          id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          credits_remaining?: number | null
          current_period_end?: string | null
          id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      synchronicity_insights: {
        Row: {
          expires_at: string
          generated_at: string
          id: string
          insights: Json
          patterns: Json
          total_readings: number
          user_id: string
        }
        Insert: {
          expires_at?: string
          generated_at?: string
          id?: string
          insights?: Json
          patterns?: Json
          total_readings?: number
          user_id: string
        }
        Update: {
          expires_at?: string
          generated_at?: string
          id?: string
          insights?: Json
          patterns?: Json
          total_readings?: number
          user_id?: string
        }
        Relationships: []
      }
      tarot_cards: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          keywords: string[] | null
          keywords_fr: string[] | null
          meaning_reversed: string | null
          meaning_reversed_fr: string | null
          meaning_upright: string | null
          meaning_upright_fr: string | null
          name_en: string | null
          nom_fr: string
          numero: number | null
          type: Database["public"]["Enums"]["card_type"]
        }
        Insert: {
          created_at?: string
          id: string
          image_url?: string | null
          keywords?: string[] | null
          keywords_fr?: string[] | null
          meaning_reversed?: string | null
          meaning_reversed_fr?: string | null
          meaning_upright?: string | null
          meaning_upright_fr?: string | null
          name_en?: string | null
          nom_fr: string
          numero?: number | null
          type: Database["public"]["Enums"]["card_type"]
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          keywords_fr?: string[] | null
          meaning_reversed?: string | null
          meaning_reversed_fr?: string | null
          meaning_upright?: string | null
          meaning_upright_fr?: string | null
          name_en?: string | null
          nom_fr?: string
          numero?: number | null
          type?: Database["public"]["Enums"]["card_type"]
        }
        Relationships: []
      }
      tarot_readings: {
        Row: {
          ai_interpretation: Json | null
          cards: Json
          created_at: string
          id: string
          is_favorite: boolean | null
          question: string | null
          spread_id: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          ai_interpretation?: Json | null
          cards?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          question?: string | null
          spread_id?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          ai_interpretation?: Json | null
          cards?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          question?: string | null
          spread_id?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarot_readings_spread_id_fkey"
            columns: ["spread_id"]
            isOneToOne: false
            referencedRelation: "tarot_spreads"
            referencedColumns: ["id"]
          },
        ]
      }
      tarot_spreads: {
        Row: {
          card_count: number
          created_at: string
          description: string | null
          description_fr: string | null
          icon: string | null
          id: string
          is_enabled: boolean
          layout_key: string | null
          name: string
          name_fr: string
          positions: Json
          sort_order: number
        }
        Insert: {
          card_count?: number
          created_at?: string
          description?: string | null
          description_fr?: string | null
          icon?: string | null
          id: string
          is_enabled?: boolean
          layout_key?: string | null
          name: string
          name_fr: string
          positions?: Json
          sort_order?: number
        }
        Update: {
          card_count?: number
          created_at?: string
          description?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          is_enabled?: boolean
          layout_key?: string | null
          name?: string
          name_fr?: string
          positions?: Json
          sort_order?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          earned_at: string
          id: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          achievement_key: string
          earned_at?: string
          id?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          achievement_key?: string
          earned_at?: string
          id?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      user_karma: {
        Row: {
          created_at: string
          id: string
          last_action_at: string | null
          level: number
          level_name: string
          longest_streak: number
          streak: number
          total_daily_draws: number
          total_journals: number
          total_readings: number
          total_shares: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_action_at?: string | null
          level?: number
          level_name?: string
          longest_streak?: number
          streak?: number
          total_daily_draws?: number
          total_journals?: number
          total_readings?: number
          total_shares?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_action_at?: string | null
          level?: number
          level_name?: string
          longest_streak?: number
          streak?: number
          total_daily_draws?: number
          total_journals?: number
          total_readings?: number
          total_shares?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_karma: { Args: { p_action: string; p_uid: string }; Returns: Json }
      bootstrap_first_admin: {
        Args: { allowed_email: string }
        Returns: boolean
      }
      can_dispatch_agent_job: { Args: { _user_id: string }; Returns: boolean }
      compute_karma_level: {
        Args: { p_xp: number }
        Returns: {
          level: number
          level_name: string
          progress_pct: number
          xp_next_level: number
          xp_this_level: number
        }[]
      }
      decrement_reading_credit: { Args: { uid: string }; Returns: undefined }
      get_card_patterns: {
        Args: { limit_days?: number; uid: string }
        Returns: Json
      }
      get_email_leads_admin_safe: {
        Args: never
        Returns: {
          consent: boolean
          consent_text: string
          consent_timestamp: string
          created_at: string
          email: string
          email_verified: boolean
          first_name: string
          id: string
          session_id: string
          spread_id: string
          unsubscribed_at: string
          updated_at: string
          user_id: string
          verification_sent_at: string
        }[]
      }
      get_energy_dimensions_profile: {
        Args: { limit_days?: number; uid: string }
        Returns: Json
      }
      get_energy_profile: { Args: { uid: string }; Returns: Json }
      get_karma_profile: { Args: { p_uid: string }; Returns: Json }
      get_my_subscription: {
        Args: never
        Returns: {
          cancel_at_period_end: boolean
          created_at: string
          credits_remaining: number
          current_period_end: string
          id: string
          plan: string
          subscription_status: string
          updated_at: string
          user_id: string
        }[]
      }
      get_pending_agent_jobs: {
        Args: { p_limit?: number }
        Returns: {
          attempt_count: number
          created_at: string
          created_by: string
          id: string
          job_type: Database["public"]["Enums"]["agent_job_type"]
          max_attempts: number
          payload: Json
          priority: number
          timeout_seconds: number
        }[]
      }
      get_subscription_status: { Args: { uid: string }; Returns: Json }
      get_synchronicity_patterns: {
        Args: { limit_days?: number; uid: string }
        Returns: Json
      }
      get_theme_patterns: {
        Args: { limit_days?: number; uid: string }
        Returns: Json
      }
      get_user_streak: { Args: { uid: string }; Returns: number }
      has_reading_credits: { Args: { uid: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      redeem_promo_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      agent_job_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "timeout"
        | "cancelled"
      agent_job_type:
        | "ui_qa_check"
        | "content_synthesis"
        | "data_verification"
        | "admin_assist_review"
        | "security_drift_check"
      app_role: "admin" | "user"
      card_type: "major" | "minor"
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
  public: {
    Enums: {
      agent_job_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "timeout",
        "cancelled",
      ],
      agent_job_type: [
        "ui_qa_check",
        "content_synthesis",
        "data_verification",
        "admin_assist_review",
        "security_drift_check",
      ],
      app_role: ["admin", "user"],
      card_type: ["major", "minor"],
    },
  },
} as const
