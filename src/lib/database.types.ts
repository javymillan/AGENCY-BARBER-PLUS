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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          last_login: string | null
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      appointment_locks: {
        Row: {
          date: string
          expires_at: string
          id: string
          locked_at: string | null
          locked_by: string
          time: string
        }
        Insert: {
          date: string
          expires_at: string
          id?: string
          locked_at?: string | null
          locked_by: string
          time: string
        }
        Update: {
          date?: string
          expires_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string
          time?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string
          created_at: string | null
          date: string
          id: string
          location_id: string | null
          loyalty_points_added: boolean | null
          notes: string | null
          reminder_sent: boolean | null
          service_id: string | null
          status: string | null
          time: string
        }
        Insert: {
          client_email?: string
          client_name: string
          client_phone: string
          created_at?: string | null
          date: string
          id?: string
          location_id?: string | null
          loyalty_points_added?: boolean | null
          notes?: string | null
          reminder_sent?: boolean | null
          service_id?: string | null
          status?: string | null
          time: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string
          created_at?: string | null
          date?: string
          id?: string
          location_id?: string | null
          loyalty_points_added?: boolean | null
          notes?: string | null
          reminder_sent?: boolean | null
          service_id?: string | null
          status?: string | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          created_at: string | null
          id: string
          time_blocks: Json | null
          updated_at: string | null
          week_days: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          time_blocks?: Json | null
          updated_at?: string | null
          week_days?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          time_blocks?: Json | null
          updated_at?: string | null
          week_days?: Json | null
        }
        Relationships: []
      }
      blocked_times: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          id: string
          location_id: string | null
          reason: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          location_id?: string | null
          reason?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          location_id?: string | null
          reason?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_rules: {
        Row: {
          appointment_duration: number | null
          created_at: string | null
          id: string
          max_appointments_per_day: number | null
          max_appointments_per_week: number | null
          min_advance_time: number | null
          min_cancellation_notice: number | null
          num_de_empleados: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_duration?: number | null
          created_at?: string | null
          id: string
          max_appointments_per_day?: number | null
          max_appointments_per_week?: number | null
          min_advance_time?: number | null
          min_cancellation_notice?: number | null
          num_de_empleados?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_duration?: number | null
          created_at?: string | null
          id?: string
          max_appointments_per_day?: number | null
          max_appointments_per_week?: number | null
          min_advance_time?: number | null
          min_cancellation_notice?: number | null
          num_de_empleados?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      business_data: {
        Row: {
          accent_color: string | null
          address: string
          cancellation_policy: string | null
          created_at: string | null
          description: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          location_id: string | null
          logo_url: string | null
          name: string
          phone: string
          primary_color: string | null
        }
        Insert: {
          accent_color?: string | null
          address: string
          cancellation_policy?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          location_id?: string | null
          logo_url?: string | null
          name: string
          phone: string
          primary_color?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string
          cancellation_policy?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          location_id?: string | null
          logo_url?: string | null
          name?: string
          phone?: string
          primary_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_gallery: {
        Row: {
          business_id: string | null
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          order_index: number | null
        }
        Insert: {
          business_id?: string | null
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          order_index?: number | null
        }
        Update: {
          business_id?: string | null
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          day_of_week: number
          end_time: string
          id: string
          is_closed: boolean
          location_id: string | null
          start_time: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_closed?: boolean
          location_id?: string | null
          start_time: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_closed?: boolean
          location_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          city: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          client_name: string
          client_phone: string
          created_at: string | null
          id: string
          last_appointment_id: string | null
          points: number
          total_earned: number
          updated_at: string | null
        }
        Insert: {
          client_name: string
          client_phone: string
          created_at?: string | null
          id?: string
          last_appointment_id?: string | null
          points?: number
          total_earned?: number
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          client_phone?: string
          created_at?: string | null
          id?: string
          last_appointment_id?: string | null
          points?: number
          total_earned?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_last_appointment_id_fkey"
            columns: ["last_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_redemptions: {
        Row: {
          appointment_id: string | null
          client_phone: string
          id: string
          points_used: number
          redeemed_at: string | null
          reward_id: string | null
          status: string
        }
        Insert: {
          appointment_id?: string | null
          client_phone: string
          id?: string
          points_used: number
          redeemed_at?: string | null
          reward_id?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string | null
          client_phone?: string
          id?: string
          points_used?: number
          redeemed_at?: string | null
          reward_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_client_phone_fkey"
            columns: ["client_phone"]
            isOneToOne: false
            referencedRelation: "loyalty_points"
            referencedColumns: ["client_phone"]
          },
          {
            foreignKeyName: "loyalty_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          name: string
          points_required: number
          reward_type: string
          service_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          name: string
          points_required: number
          reward_type: string
          service_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          name?: string
          points_required?: number
          reward_type?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          id: string
          message: string | null
          reminder_type: string
          scheduled_time: string
          sent: boolean | null
          sent_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          reminder_type: string
          scheduled_time: string
          sent?: boolean | null
          sent_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          reminder_type?: string
          scheduled_time?: string
          sent?: boolean | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          duration: number
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          name: string
          price: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          appointment_id: string | null
          client_name: string
          comment: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          rating: number
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_name: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          rating: number
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_name?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      service_promotions: {
        Row: {
          active: boolean
          created_at: string
          days_of_week: Json | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          name: string
          service_id: string
          start_date: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          days_of_week?: Json | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          name: string
          service_id: string
          start_date: string
        }
        Update: {
          active?: boolean
          created_at?: string
          days_of_week?: Json | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          name?: string
          service_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_promotions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlist: {
        Row: {
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          id: string
          notes: string | null
          preferred_date: string | null
          preferred_time_block: Json | null
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          preferred_time_block?: Json | null
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          preferred_time_block?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const