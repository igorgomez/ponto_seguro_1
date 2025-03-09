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
      users: {
        Row: {
          id: string
          cpf: string
          name: string
          user_type: 'admin' | 'employee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cpf: string
          name: string
          user_type: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cpf?: string
          name?: string
          user_type?: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
      }
      time_records: {
        Row: {
          id: string
          user_id: string
          record_type: 'entry' | 'exit'
          timestamp: string
          created_at: string
          location: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          record_type: 'entry' | 'exit'
          timestamp?: string
          created_at?: string
          location?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          record_type?: 'entry' | 'exit'
          timestamp?: string
          created_at?: string
          location?: string | null
          notes?: string | null
        }
      }
    }
  }
}