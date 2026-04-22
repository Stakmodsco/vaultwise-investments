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
      account_status: {
        Row: {
          blacklist_reason: string | null
          failed_kyc_attempts: number
          kyc_status: Database["public"]["Enums"]["kyc_state"]
          locked_at: string | null
          status: Database["public"]["Enums"]["account_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          blacklist_reason?: string | null
          failed_kyc_attempts?: number
          kyc_status?: Database["public"]["Enums"]["kyc_state"]
          locked_at?: string | null
          status?: Database["public"]["Enums"]["account_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          blacklist_reason?: string | null
          failed_kyc_attempts?: number
          kyc_status?: Database["public"]["Enums"]["kyc_state"]
          locked_at?: string | null
          status?: Database["public"]["Enums"]["account_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          proof_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["deposit_state"]
          tx_hash: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          proof_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["deposit_state"]
          tx_hash?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          proof_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["deposit_state"]
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      gift_card_exchanges: {
        Row: {
          admin_notes: string | null
          brand: string
          card_code: string
          card_value: number
          created_at: string
          id: string
          payout_amount: number
          payout_pct: number
          proof_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["gift_card_state"]
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          brand: string
          card_code: string
          card_value: number
          created_at?: string
          id?: string
          payout_amount: number
          payout_pct?: number
          proof_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["gift_card_state"]
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          brand?: string
          card_code?: string
          card_value?: number
          created_at?: string
          id?: string
          payout_amount?: number
          payout_pct?: number
          proof_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["gift_card_state"]
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          id: string
          invested_amount: number
          invested_at: string
          units: number
          updated_at: string
          user_id: string
          vault_id: string
        }
        Insert: {
          id?: string
          invested_amount?: number
          invested_at?: string
          units?: number
          updated_at?: string
          user_id: string
          vault_id: string
        }
        Update: {
          id?: string
          invested_amount?: number
          invested_at?: string
          units?: number
          updated_at?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          doc_type: string
          full_name: string
          id: string
          id_doc_path: string
          proof_of_funds_path: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_state"]
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          doc_type: string
          full_name: string
          id?: string
          id_doc_path: string
          proof_of_funds_path: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_state"]
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          doc_type?: string
          full_name?: string
          id?: string
          id_doc_path?: string
          proof_of_funds_path?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_state"]
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          change_pct: number | null
          created_at: string
          description: string | null
          id: string
          read: boolean
          title: string
          user_id: string
          variant: string
          vault_id: string | null
          vault_name: string | null
        }
        Insert: {
          change_pct?: number | null
          created_at?: string
          description?: string | null
          id?: string
          read?: boolean
          title: string
          user_id: string
          variant?: string
          vault_id?: string | null
          vault_name?: string | null
        }
        Update: {
          change_pct?: number | null
          created_at?: string
          description?: string | null
          id?: string
          read?: boolean
          title?: string
          user_id?: string
          variant?: string
          vault_id?: string | null
          vault_name?: string | null
        }
        Relationships: []
      }
      payment_wallets: {
        Row: {
          active: boolean
          address: string
          created_at: string
          currency: string
          id: string
          memo: string | null
          network: string
        }
        Insert: {
          active?: boolean
          address: string
          created_at?: string
          currency: string
          id?: string
          memo?: string | null
          network: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          currency?: string
          id?: string
          memo?: string | null
          network?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          type: string
          user_id: string
          vault_id: string | null
          vault_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          type: string
          user_id: string
          vault_id?: string | null
          vault_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          type?: string
          user_id?: string
          vault_id?: string | null
          vault_name?: string | null
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          enabled: boolean
          secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          enabled?: boolean
          secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          enabled?: boolean
          secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          email_alerts: boolean
          id: string
          marketing: boolean
          push_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_alerts?: boolean
          id?: string
          marketing?: boolean
          push_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_alerts?: boolean
          id?: string
          marketing?: boolean
          push_alerts?: boolean
          updated_at?: string
          user_id?: string
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
      vault_prices: {
        Row: {
          previous_price: number
          unit_price: number
          updated_at: string
          vault_id: string
        }
        Insert: {
          previous_price: number
          unit_price: number
          updated_at?: string
          vault_id: string
        }
        Update: {
          previous_price?: number
          unit_price?: number
          updated_at?: string
          vault_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          completes_at: string
          destination: string
          id: string
          processed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["withdrawal_state"]
          user_id: string
          vault_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          completes_at?: string
          destination: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["withdrawal_state"]
          user_id: string
          vault_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          completes_at?: string
          destination?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["withdrawal_state"]
          user_id?: string
          vault_id?: string | null
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
    }
    Enums: {
      account_state: "active" | "locked" | "blacklisted"
      app_role: "admin" | "user"
      deposit_state: "pending" | "approved" | "rejected"
      gift_card_state: "pending" | "approved" | "rejected"
      kyc_state: "not_submitted" | "pending" | "approved" | "rejected"
      payment_method: "crypto" | "card"
      withdrawal_state: "pending" | "approved" | "rejected" | "completed"
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
      account_state: ["active", "locked", "blacklisted"],
      app_role: ["admin", "user"],
      deposit_state: ["pending", "approved", "rejected"],
      gift_card_state: ["pending", "approved", "rejected"],
      kyc_state: ["not_submitted", "pending", "approved", "rejected"],
      payment_method: ["crypto", "card"],
      withdrawal_state: ["pending", "approved", "rejected", "completed"],
    },
  },
} as const
