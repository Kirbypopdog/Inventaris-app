
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "app_users": {
                  Row: {
                    "created_at": string,"display_name": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"display_name": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"changed_at": string,"changed_by": string | null,"id": number,"new_data": Json | null,"old_data": Json | null,"row_id": string,"table_name": string
                  }
                  Insert: {
                    "action": string,"changed_at"?: string,"changed_by"?: string | null,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"row_id": string,"table_name": string
                  }
                  Update: {
                    "action"?: string,"changed_at"?: string,"changed_by"?: string | null,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"row_id"?: string,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"customers": {
                  Row: {
                    "address_line": string | null,"archived_at": string | null,"city": string | null,"country": string,"created_at": string,"email": string | null,"id": string,"km_rate_cents": number | null,"name": string,"notes": string | null,"phone": string | null,"postal_code": string | null,"travel_method": Database["public"]['Enums']["travel_method"] | null,"trip_flat_cents": number | null,"type": Database["public"]['Enums']["customer_type"],"updated_at": string,"vat_number": string | null
                  }
                  Insert: {
                    "address_line"?: string | null,"archived_at"?: string | null,"city"?: string | null,"country"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"km_rate_cents"?: number | null,"name": string,"notes"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"travel_method"?: Database["public"]['Enums']["travel_method"] | null,"trip_flat_cents"?: number | null,"type": Database["public"]['Enums']["customer_type"],"updated_at"?: string,"vat_number"?: string | null
                  }
                  Update: {
                    "address_line"?: string | null,"archived_at"?: string | null,"city"?: string | null,"country"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"km_rate_cents"?: number | null,"name"?: string,"notes"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"travel_method"?: Database["public"]['Enums']["travel_method"] | null,"trip_flat_cents"?: number | null,"type"?: Database["public"]['Enums']["customer_type"],"updated_at"?: string,"vat_number"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"hourly_rates": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"id": string,"is_default": boolean,"name": string,"rate_cents": number,"updated_at": string
                  }
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"is_default"?: boolean,"name": string,"rate_cents": number,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"is_default"?: boolean,"name"?: string,"rate_cents"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"jobs": {
                  Row: {
                    "address_line": string | null,"city": string | null,"created_at": string,"customer_id": string,"description": string | null,"ends_on": string | null,"hourly_rate_id": string | null,"id": string,"km_rate_cents": number | null,"material_margin_bp": number | null,"postal_code": string | null,"starts_on": string | null,"status": Database["public"]['Enums']["job_status"],"title": string,"travel_method": Database["public"]['Enums']["travel_method"] | null,"trip_flat_cents": number | null,"updated_at": string,"vat_rate": number | null
                  }
                  Insert: {
                    "address_line"?: string | null,"city"?: string | null,"created_at"?: string,"customer_id": string,"description"?: string | null,"ends_on"?: string | null,"hourly_rate_id"?: string | null,"id"?: string,"km_rate_cents"?: number | null,"material_margin_bp"?: number | null,"postal_code"?: string | null,"starts_on"?: string | null,"status"?: Database["public"]['Enums']["job_status"],"title": string,"travel_method"?: Database["public"]['Enums']["travel_method"] | null,"trip_flat_cents"?: number | null,"updated_at"?: string,"vat_rate"?: number | null
                  }
                  Update: {
                    "address_line"?: string | null,"city"?: string | null,"created_at"?: string,"customer_id"?: string,"description"?: string | null,"ends_on"?: string | null,"hourly_rate_id"?: string | null,"id"?: string,"km_rate_cents"?: number | null,"material_margin_bp"?: number | null,"postal_code"?: string | null,"starts_on"?: string | null,"status"?: Database["public"]['Enums']["job_status"],"title"?: string,"travel_method"?: Database["public"]['Enums']["travel_method"] | null,"trip_flat_cents"?: number | null,"updated_at"?: string,"vat_rate"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "jobs_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jobs_hourly_rate_id_fkey"
      columns: ["hourly_rate_id"]
isOneToOne: false
      referencedRelation: "hourly_rates"
      referencedColumns: ["id"]
    }
                  ]
                },"material_usages": {
                  Row: {
                    "created_at": string,"created_by": string,"description": string,"id": string,"job_id": string,"margin_bp": number,"material_id": string | null,"package_price_cents": number,"quantity": number,"unit": string,"units_per_package": number,"updated_at": string,"used_on": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"description": string,"id"?: string,"job_id": string,"margin_bp": number,"material_id"?: string | null,"package_price_cents": number,"quantity": number,"unit": string,"units_per_package": number,"updated_at"?: string,"used_on"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"description"?: string,"id"?: string,"job_id"?: string,"margin_bp"?: number,"material_id"?: string | null,"package_price_cents"?: number,"quantity"?: number,"unit"?: string,"units_per_package"?: number,"updated_at"?: string,"used_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "material_usages_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_usages_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["id"]
    }
                  ]
                },"materials": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"id": string,"margin_bp": number | null,"name": string,"package_price_cents": number,"supplier": string | null,"unit": string,"units_per_package": number,"updated_at": string
                  }
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"margin_bp"?: number | null,"name": string,"package_price_cents": number,"supplier"?: string | null,"unit": string,"units_per_package": number,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"margin_bp"?: number | null,"name"?: string,"package_price_cents"?: number,"supplier"?: string | null,"unit"?: string,"units_per_package"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "address_line": string | null,"city": string | null,"company_name": string,"created_at": string,"email": string | null,"iban": string | null,"id": string,"km_rate_cents": number,"material_margin_bp": number,"phone": string | null,"postal_code": string | null,"singleton": boolean,"travel_method": Database["public"]['Enums']["travel_method"],"trip_flat_cents": number,"updated_at": string,"vat_number": string | null,"vat_rate": number
                  }
                  Insert: {
                    "address_line"?: string | null,"city"?: string | null,"company_name"?: string,"created_at"?: string,"email"?: string | null,"iban"?: string | null,"id"?: string,"km_rate_cents"?: number,"material_margin_bp"?: number,"phone"?: string | null,"postal_code"?: string | null,"singleton"?: boolean,"travel_method"?: Database["public"]['Enums']["travel_method"],"trip_flat_cents"?: number,"updated_at"?: string,"vat_number"?: string | null,"vat_rate"?: number
                  }
                  Update: {
                    "address_line"?: string | null,"city"?: string | null,"company_name"?: string,"created_at"?: string,"email"?: string | null,"iban"?: string | null,"id"?: string,"km_rate_cents"?: number,"material_margin_bp"?: number,"phone"?: string | null,"postal_code"?: string | null,"singleton"?: boolean,"travel_method"?: Database["public"]['Enums']["travel_method"],"trip_flat_cents"?: number,"updated_at"?: string,"vat_number"?: string | null,"vat_rate"?: number
                  }
                  Relationships: [
                    
                  ]
                },"time_entries": {
                  Row: {
                    "created_at": string,"ended_at": string | null,"hourly_rate_cents": number,"hourly_rate_id": string | null,"id": string,"job_id": string,"note": string | null,"started_at": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"ended_at"?: string | null,"hourly_rate_cents": number,"hourly_rate_id"?: string | null,"id"?: string,"job_id": string,"note"?: string | null,"started_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"ended_at"?: string | null,"hourly_rate_cents"?: number,"hourly_rate_id"?: string | null,"id"?: string,"job_id"?: string,"note"?: string | null,"started_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "time_entries_hourly_rate_id_fkey"
      columns: ["hourly_rate_id"]
isOneToOne: false
      referencedRelation: "hourly_rates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"trips": {
                  Row: {
                    "created_at": string,"created_by": string,"distance_km": number | null,"id": string,"job_id": string,"method": Database["public"]['Enums']["travel_method"],"note": string | null,"rate_cents": number,"trip_date": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"distance_km"?: number | null,"id"?: string,"job_id": string,"method": Database["public"]['Enums']["travel_method"],"note"?: string | null,"rate_cents": number,"trip_date"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"distance_km"?: number | null,"id"?: string,"job_id"?: string,"method"?: Database["public"]['Enums']["travel_method"],"note"?: string | null,"rate_cents"?: number,"trip_date"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trips_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "add_member":
{ Args: { "member_display_name": string,"member_email": string,"member_role": Database["public"]['Enums']["app_role"] }; Returns: string
                           },
"list_members":
{ Args: Record<PropertyKey, never>; Returns: {
              "display_name": string,"email": string,"last_sign_in_at": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
            }[]
                           },
"remove_member":
{ Args: { "target_user_id": string }; Returns: undefined
                           },
"update_member":
{ Args: { "member_display_name": string,"member_role": Database["public"]['Enums']["app_role"],"target_user_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "app_role": "owner"|"admin","customer_type": "private"|"business","job_status": "planned"|"active"|"done"|"cancelled","travel_method": "per_km"|"flat"|"included"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["owner", "admin"],"customer_type": ["private", "business"],"job_status": ["planned", "active", "done", "cancelled"],"travel_method": ["per_km", "flat", "included"]
          }
        }
} as const

