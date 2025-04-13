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
      movies: {
        Row: {
          id: string
          title: string
          description: string
          poster: string | null
          webpPoster: string | null
          backdrop: string | null
          duration: number
          rating: number
          status: string
          releaseDate: string
          director: string
          cast: string[]
          genre: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          poster?: string | null
          webpPoster?: string | null
          backdrop?: string | null
          duration: number
          rating: number
          status: string
          releaseDate: string
          director: string
          cast: string[]
          genre: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          poster?: string | null
          webpPoster?: string | null
          backdrop?: string | null
          duration?: number
          rating?: number
          status?: string
          releaseDate?: string
          director?: string
          cast?: string[]
          genre?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          showtime_id: string
          ticket_type: string
          total_price: number
          status: string
          ticket_status: string | null
          created_at: string
          paid_at: string | null
          cancelled_at: string | null
          refunded_at: string | null
          checked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          showtime_id: string
          ticket_type: string
          total_price: number
          status: string
          ticket_status?: string | null
          created_at?: string
          paid_at?: string | null
          cancelled_at?: string | null
          refunded_at?: string | null
          checked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          showtime_id?: string
          ticket_type?: string
          total_price?: number
          status?: string
          ticket_status?: string | null
          created_at?: string
          paid_at?: string | null
          cancelled_at?: string | null
          refunded_at?: string | null
          checked_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          password_hash: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password_hash: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password_hash?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      // 其他表格定义...
    }
    Views: {
      // 视图定义
      vw_user_orders: {
        Row: {
          id: string
          user_id: string
          showtime_id: string
          ticket_type: string
          total_price: number
          status: string
          ticket_status: string | null
          created_at: string
          paid_at: string | null
          cancelled_at: string | null
          refunded_at: string | null
          checked_at: string | null
          movie_title: string
          movie_poster: string | null
          start_time: string
          end_time: string
          theater_name: string
          seat_locations: string[]
        }
        Insert: never
        Update: never
      }
    }
    Functions: {
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
      // 其他函数定义...
    }
  }
} 