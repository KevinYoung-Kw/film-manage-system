export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          link: string | null
          order_num: number
          title: string
          updated_at: string
          webp_image_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link?: string | null
          order_num?: number
          title: string
          updated_at?: string
          webp_image_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link?: string | null
          order_num?: number
          title?: string
          updated_at?: string
          webp_image_url?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          order_num: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          order_num?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          order_num?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      movies: {
        Row: {
          actors: string[]
          cast: string[] | null
          created_at: string
          description: string
          director: string
          duration: number
          genre: string[]
          id: string
          original_title: string | null
          poster: string
          rating: number | null
          release_date: string
          status: Database["public"]["Enums"]["movie_status"] | null
          title: string
          updated_at: string
          webp_poster: string | null
        }
        Insert: {
          actors: string[]
          cast?: string[] | null
          created_at?: string
          description: string
          director: string
          duration: number
          genre: string[]
          id?: string
          original_title?: string | null
          poster: string
          rating?: number | null
          release_date: string
          status?: Database["public"]["Enums"]["movie_status"] | null
          title: string
          updated_at?: string
          webp_poster?: string | null
        }
        Update: {
          actors?: string[]
          cast?: string[] | null
          created_at?: string
          description?: string
          director?: string
          duration?: number
          genre?: string[]
          id?: string
          original_title?: string | null
          poster?: string
          rating?: number | null
          release_date?: string
          status?: Database["public"]["Enums"]["movie_status"] | null
          title?: string
          updated_at?: string
          webp_poster?: string | null
        }
        Relationships: []
      }
      order_seats: {
        Row: {
          created_at: string
          id: string
          order_id: string
          seat_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          seat_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          seat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_seats_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_seats_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          checked_at: string | null
          created_at: string
          id: string
          paid_at: string | null
          refunded_at: string | null
          showtime_id: string
          status: Database["public"]["Enums"]["order_status"]
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          total_price: number
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          checked_at?: string | null
          created_at?: string
          id: string
          paid_at?: string | null
          refunded_at?: string | null
          showtime_id: string
          status?: Database["public"]["Enums"]["order_status"]
          ticket_status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          total_price: number
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          checked_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          refunded_at?: string | null
          showtime_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          ticket_status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          total_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_showtime_id_fkey"
            columns: ["showtime_id"]
            isOneToOne: false
            referencedRelation: "showtimes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_methods: {
        Row: {
          code: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_method_id: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_method_id: string
          status: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_method_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          }
        ]
      }
      seats: {
        Row: {
          column_num: number
          created_at: string
          id: string
          is_available: boolean
          row_num: number
          seat_type: Database["public"]["Enums"]["seat_type"]
          showtime_id: string
          updated_at: string
        }
        Insert: {
          column_num: number
          created_at?: string
          id?: string
          is_available?: boolean
          row_num: number
          seat_type?: Database["public"]["Enums"]["seat_type"]
          showtime_id: string
          updated_at?: string
        }
        Update: {
          column_num?: number
          created_at?: string
          id?: string
          is_available?: boolean
          row_num?: number
          seat_type?: Database["public"]["Enums"]["seat_type"]
          showtime_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seats_showtime_id_fkey"
            columns: ["showtime_id"]
            isOneToOne: false
            referencedRelation: "showtimes"
            referencedColumns: ["id"]
          }
        ]
      }
      showtimes: {
        Row: {
          created_at: string
          end_time: string
          id: string
          movie_id: string
          price_child: number
          price_normal: number
          price_senior: number
          price_student: number
          start_time: string
          theater_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          movie_id: string
          price_child: number
          price_normal: number
          price_senior: number
          price_student: number
          start_time: string
          theater_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          movie_id?: string
          price_child?: number
          price_normal?: number
          price_senior?: number
          price_student?: number
          start_time?: string
          theater_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "showtimes_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showtimes_theater_id_fkey"
            columns: ["theater_id"]
            isOneToOne: false
            referencedRelation: "theaters"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_operations: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          operation_type: Database["public"]["Enums"]["staff_operation_type"]
          order_id: string | null
          showtime_id: string | null
          staff_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          operation_type: Database["public"]["Enums"]["staff_operation_type"]
          order_id?: string | null
          showtime_id?: string | null
          staff_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          operation_type?: Database["public"]["Enums"]["staff_operation_type"]
          order_id?: string | null
          showtime_id?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_operations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_operations_showtime_id_fkey"
            columns: ["showtime_id"]
            isOneToOne: false
            referencedRelation: "showtimes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_operations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_schedules: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          position: string
          schedule_date: string
          shift: Database["public"]["Enums"]["shift_type"]
          staff_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          position: string
          schedule_date: string
          shift: Database["public"]["Enums"]["shift_type"]
          staff_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          position?: string
          schedule_date?: string
          shift?: Database["public"]["Enums"]["shift_type"]
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      theater_seat_layouts: {
        Row: {
          created_at: string
          id: string
          layout: Json
          theater_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout: Json
          theater_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          theater_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theater_seat_layouts_theater_id_fkey"
            columns: ["theater_id"]
            isOneToOne: false
            referencedRelation: "theaters"
            referencedColumns: ["id"]
          }
        ]
      }
      theaters: {
        Row: {
          columns: number
          created_at: string
          equipment: string[] | null
          id: string
          name: string
          rows: number
          total_seats: number
          updated_at: string
        }
        Insert: {
          columns: number
          created_at?: string
          equipment?: string[] | null
          id?: string
          name: string
          rows: number
          total_seats: number
          updated_at?: string
        }
        Update: {
          columns?: number
          created_at?: string
          equipment?: string[] | null
          id?: string
          name?: string
          rows?: number
          total_seats?: number
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          password_hash: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          id: string
          name: string
          base_price: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          base_price: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          base_price?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_strategies: {
        Row: {
          id: string
          name: string
          description: string | null
          condition_type: string
          condition_value: string | null
          discount_percentage: number | null
          extra_charge: number | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          condition_type: string
          condition_value?: string | null
          discount_percentage?: number | null
          extra_charge?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          condition_type?: string
          condition_value?: string | null
          discount_percentage?: number | null
          extra_charge?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_type_pricing_strategies: {
        Row: {
          id: string
          ticket_type_id: string
          pricing_strategy_id: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_type_id: string
          pricing_strategy_id: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_type_id?: string
          pricing_strategy_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_type_pricing_strategies_pricing_strategy_id_fkey"
            columns: ["pricing_strategy_id"]
            isOneToOne: false
            referencedRelation: "pricing_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_type_pricing_strategies_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      api_admin_stats: {
        Row: {
          cancelled_orders: number | null
          customer_count: number | null
          paid_orders: number | null
          refunded_orders: number | null
          showing_movies: number | null
          total_movies: number | null
          total_orders: number | null
          total_revenue: number | null
          total_users: number | null
          upcoming_showtimes: number | null
        }
        Relationships: []
      }
      api_current_user: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      api_public_movies: {
        Row: {
          actors: string[] | null
          cast: string[] | null
          description: string | null
          director: string | null
          duration: number | null
          genre: string[] | null
          id: string | null
          original_title: string | null
          poster: string | null
          rating: number | null
          release_date: string | null
          status: Database["public"]["Enums"]["movie_status"] | null
          title: string | null
          webp_poster: string | null
        }
        Relationships: []
      }
      api_staff_operations: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string | null
          operation_type: Database["public"]["Enums"]["staff_operation_type"] | null
          order_id: string | null
          showtime_id: string | null
          staff_id: string | null
        }
        Relationships: []
      }
      api_user_orders: {
        Row: {
          cancelled_at: string | null
          checked_at: string | null
          created_at: string | null
          end_time: string | null
          id: string | null
          movie_poster: string | null
          movie_title: string | null
          paid_at: string | null
          refunded_at: string | null
          seat_locations: string[] | null
          showtime_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          theater_name: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_type: Database["public"]["Enums"]["ticket_type"] | null
          total_price: number | null
          user_id: string | null
        }
        Relationships: []
      }
      vw_available_seats: {
        Row: {
          column_num: number | null
          is_available: boolean | null
          row_num: number | null
          seat_id: string | null
          seat_type: Database["public"]["Enums"]["seat_type"] | null
          showtime_id: string | null
        }
        Relationships: []
      }
      vw_coming_soon_movies: {
        Row: {
          actors: string[] | null
          cast: string[] | null
          created_at: string | null
          description: string | null
          director: string | null
          duration: number | null
          genre: string[] | null
          id: string | null
          original_title: string | null
          poster: string | null
          rating: number | null
          release_date: string | null
          status: Database["public"]["Enums"]["movie_status"] | null
          title: string | null
          updated_at: string | null
          webp_poster: string | null
        }
        Relationships: []
      }
      vw_daily_revenue: {
        Row: {
          date: string | null
          ticket_count: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      vw_movie_details: {
        Row: {
          actors: string[] | null
          cast: string[] | null
          created_at: string | null
          description: string | null
          director: string | null
          duration: number | null
          genre: string[] | null
          id: string | null
          original_title: string | null
          poster: string | null
          rating: number | null
          release_date: string | null
          status: Database["public"]["Enums"]["movie_status"] | null
          title: string | null
          total_orders: number | null
          total_revenue: number | null
          total_showtimes: number | null
          updated_at: string | null
          webp_poster: string | null
        }
        Relationships: []
      }
      vw_movie_revenue_ranking: {
        Row: {
          id: string | null
          poster: string | null
          release_date: string | null
          ticket_count: number | null
          title: string | null
          total_revenue: number | null
        }
        Relationships: []
      }
      vw_now_showing_movies: {
        Row: {
          actors: string[] | null
          cast: string[] | null
          created_at: string | null
          description: string | null
          director: string | null
          duration: number | null
          genre: string[] | null
          id: string | null
          original_title: string | null
          poster: string | null
          rating: number | null
          release_date: string | null
          showtime_count: number | null
          status: Database["public"]["Enums"]["movie_status"] | null
          title: string | null
          updated_at: string | null
          webp_poster: string | null
        }
        Relationships: []
      }
      vw_staff_operations: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string | null
          movie_title: string | null
          operation_type: Database["public"]["Enums"]["staff_operation_type"] | null
          order_id: string | null
          showtime_id: string | null
          staff_email: string | null
          staff_id: string | null
          staff_name: string | null
          start_time: string | null
          theater_name: string | null
        }
        Relationships: []
      }
      vw_staff_schedules: {
        Row: {
          created_at: string | null
          id: string | null
          notes: string | null
          position: string | null
          schedule_date: string | null
          shift: Database["public"]["Enums"]["shift_type"] | null
          staff_email: string | null
          staff_id: string | null
          staff_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_theater_occupancy: {
        Row: {
          average_occupancy_rate: number | null
          showtime_count: number | null
          theater_id: string | null
          theater_name: string | null
        }
        Relationships: []
      }
      vw_ticket_type_distribution: {
        Row: {
          percentage: number | null
          ticket_count: number | null
          ticket_type: Database["public"]["Enums"]["ticket_type"] | null
          total_revenue: number | null
        }
        Relationships: []
      }
      vw_today_showtimes: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string | null
          movie_duration: number | null
          movie_id: string | null
          movie_poster: string | null
          movie_title: string | null
          price_child: number | null
          price_normal: number | null
          price_senior: number | null
          price_student: number | null
          start_time: string | null
          theater_id: string | null
          theater_name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_user_orders: {
        Row: {
          cancelled_at: string | null
          checked_at: string | null
          created_at: string | null
          end_time: string | null
          id: string | null
          movie_poster: string | null
          movie_title: string | null
          paid_at: string | null
          refunded_at: string | null
          seat_locations: string[] | null
          showtime_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          theater_name: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_type: Database["public"]["Enums"]["ticket_type"] | null
          total_price: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_order: {
        Args: {
          p_order_id: string
          p_user_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      check_ticket: {
        Args: {
          p_order_id: string
          p_staff_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      create_order: {
        Args: {
          p_user_id: string
          p_showtime_id: string
          p_seat_ids: string[]
          p_ticket_type: string
          p_payment_method_id?: string
        }
        Returns: {
          order_id: string
          message: string
          success: boolean
        }[]
      }
      generate_order_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_seats_for_showtime: {
        Args: {
          p_showtime_id: string
        }
        Returns: number
      }
      refund_ticket: {
        Args: {
          p_order_id: string
          p_staff_id: string
          p_reason: string
        }
        Returns: {
          message: string
          success: boolean
          refund_amount: number
        }[]
      }
      sell_ticket: {
        Args: {
          p_staff_id: string
          p_showtime_id: string
          p_seat_ids: string[]
          p_ticket_type: string
          p_payment_method_id: string
        }
        Returns: {
          order_id: string
          message: string
          success: boolean
          total_price: number
        }[]
      }
    }
    Enums: {
      movie_status: "showing" | "coming_soon" | "off_showing"
      order_status: "pending" | "paid" | "cancelled" | "refunded"
      seat_type: "normal" | "vip" | "couple" | "disabled"
      shift_type: "morning" | "afternoon" | "evening"
      staff_operation_type: "sell" | "check" | "refund" | "modify"
      ticket_status: "unused" | "used" | "expired" | "soon" | "now" | "late"
      ticket_type: "normal" | "student" | "senior" | "child"
      user_role: "admin" | "staff" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 