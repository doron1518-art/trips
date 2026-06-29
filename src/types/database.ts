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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          destination: string | null
          start_date: string | null
          end_date: string | null
          cover_image_url: string | null
          join_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          destination?: string | null
          start_date?: string | null
          end_date?: string | null
          cover_image_url?: string | null
          join_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          destination?: string | null
          start_date?: string | null
          end_date?: string | null
          cover_image_url?: string | null
          join_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trips_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      trip_members: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: 'owner' | 'editor'
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          role?: 'owner' | 'editor'
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          role?: 'owner' | 'editor'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_members_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trip_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      itinerary_items: {
        Row: {
          id: string
          trip_id: string
          created_by: string
          date: string
          title: string
          type: 'event' | 'hotel' | 'transit' | 'other' | 'concert' | 'tour'
          description: string | null
          location: string | null
          time: string | null
          sort_order: number
          attachment_urls: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          created_by: string
          date: string
          title: string
          type?: 'event' | 'hotel' | 'transit' | 'other' | 'concert' | 'tour'
          description?: string | null
          location?: string | null
          time?: string | null
          sort_order?: number
          attachment_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          created_by?: string
          date?: string
          title?: string
          type?: 'event' | 'hotel' | 'transit' | 'other' | 'concert' | 'tour'
          description?: string | null
          location?: string | null
          time?: string | null
          sort_order?: number
          attachment_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'itinerary_items_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          }
        ]
      }
      ideas: {
        Row: {
          id: string
          trip_id: string
          created_by: string
          name: string
          description: string | null
          category: 'food' | 'music' | 'culture' | 'nature' | 'adventure' | 'shopping' | 'other'
          image_url: string | null
          attachment_urls: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          created_by: string
          name: string
          description?: string | null
          category?: 'food' | 'music' | 'culture' | 'nature' | 'adventure' | 'shopping' | 'other'
          image_url?: string | null
          attachment_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          created_by?: string
          name?: string
          description?: string | null
          category?: 'food' | 'music' | 'culture' | 'nature' | 'adventure' | 'shopping' | 'other'
          image_url?: string | null
          attachment_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ideas_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          }
        ]
      }
      diary_entries: {
        Row: {
          id: string
          trip_id: string
          created_by: string
          date: string
          notes: string | null
          photo_urls: string[]
          attachment_urls: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          created_by: string
          date: string
          notes?: string | null
          photo_urls?: string[]
          attachment_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          created_by?: string
          date?: string
          notes?: string | null
          photo_urls?: string[]
          attachment_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'diary_entries_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          }
        ]
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
