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
  public: {
    Tables: {
      children: {
        Row: {
          birth_year: number | null
          created_at: string
          id: string
          name: string
          parent_id: string
          team_group: string | null
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          id?: string
          name: string
          parent_id: string
          team_group?: string | null
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string
          team_group?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          credits: number | null
          currency: string
          id: string
          paid_at: string | null
          parent_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          type: Database["public"]["Enums"]["order_type"]
        }
        Insert: {
          amount_cents: number
          created_at?: string
          credits?: number | null
          currency?: string
          id?: string
          paid_at?: string | null
          parent_id: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          type: Database["public"]["Enums"]["order_type"]
        }
        Update: {
          amount_cents?: number
          created_at?: string
          credits?: number | null
          currency?: string
          id?: string
          paid_at?: string | null
          parent_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          type?: Database["public"]["Enums"]["order_type"]
        }
        Relationships: []
      }
      punch_cards: {
        Row: {
          id: string
          parent_id: string
          purchased_at: string
          remaining_credits: number
          status: string
          total_credits: number
        }
        Insert: {
          id?: string
          parent_id: string
          purchased_at?: string
          remaining_credits: number
          status?: string
          total_credits: number
        }
        Update: {
          id?: string
          parent_id?: string
          purchased_at?: string
          remaining_credits?: number
          status?: string
          total_credits?: number
        }
        Relationships: []
      }
      signups: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          punch_card_id: string | null
          session_id: string
          used_subscription: boolean
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
          punch_card_id?: string | null
          session_id: string
          used_subscription?: boolean
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
          punch_card_id?: string | null
          session_id?: string
          used_subscription?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "signups_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signups_punch_card_id_fkey"
            columns: ["punch_card_id"]
            isOneToOne: false
            referencedRelation: "punch_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          parent_id: string
          status: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          parent_id: string
          status?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          parent_id?: string
          status?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          capacity: number
          coach_name: string | null
          created_at: string
          ends_at: string
          id: string
          location: string | null
          starts_at: string
          team_group: string | null
          title: string
        }
        Insert: {
          capacity?: number
          coach_name?: string | null
          created_at?: string
          ends_at: string
          id?: string
          location?: string | null
          starts_at: string
          team_group?: string | null
          title: string
        }
        Update: {
          capacity?: number
          coach_name?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          location?: string | null
          starts_at?: string
          team_group?: string | null
          title?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_order_paid: {
        Args: { _order_id: string }
        Returns: {
          amount_cents: number
          created_at: string
          credits: number | null
          currency: string
          id: string
          paid_at: string | null
          parent_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          type: Database["public"]["Enums"]["order_type"]
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      signup_child_for_session: {
        Args: { _child_id: string; _session_id: string }
        Returns: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          punch_card_id: string | null
          session_id: string
          used_subscription: boolean
        }
        SetofOptions: {
          from: "*"
          to: "signups"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "parent"
      order_status: "pending" | "paid" | "failed"
      order_type: "punch_card" | "subscription"
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
      app_role: ["admin", "parent"],
      order_status: ["pending", "paid", "failed"],
      order_type: ["punch_card", "subscription"],
    },
  },
} as const
