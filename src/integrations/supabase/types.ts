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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon_url: string | null
          id: string
          rarity: string
          requirement_type: string
          requirement_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon_url?: string | null
          id?: string
          rarity: string
          requirement_type: string
          requirement_value: number
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon_url?: string | null
          id?: string
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_generated_quests: {
        Row: {
          created_at: string
          description: string
          difficulty: number
          generated_by: string
          generation_prompt: string | null
          id: string
          is_active: boolean
          latitude: number | null
          location: string
          longitude: number | null
          quest_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty?: number
          generated_by?: string
          generation_prompt?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location: string
          longitude?: number | null
          quest_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: number
          generated_by?: string
          generation_prompt?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          quest_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_logs: {
        Row: {
          confidence: number | null
          confidence_score: number | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_id: string | null
          model_used: string
          output: Json | null
          status: string
          submission_id: string
          task_type: string | null
          user_id: string
          verification_id: string | null
        }
        Insert: {
          confidence?: number | null
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_id?: string | null
          model_used: string
          output?: Json | null
          status: string
          submission_id: string
          task_type?: string | null
          user_id: string
          verification_id?: string | null
        }
        Update: {
          confidence?: number | null
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_id?: string | null
          model_used?: string
          output?: Json | null
          status?: string
          submission_id?: string
          task_type?: string | null
          user_id?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "Submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "ai_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_verifications: {
        Row: {
          admin_override: boolean | null
          admin_override_by: string | null
          admin_override_reason: string | null
          analysis_report: string | null
          analyzed_at: string | null
          authenticity_score: number | null
          created_at: string | null
          deepfake_confidence: number | null
          deepfake_verdict: string | null
          exif_latitude: number | null
          exif_longitude: number | null
          exif_timestamp: string | null
          final_confidence: number | null
          geolocation_match_score: number | null
          id: string
          model_used: string | null
          photo_url: string
          quest_id: string | null
          quest_match_score: number | null
          reason: string
          scene_relevance_score: number | null
          submission_id: string
          updated_at: string | null
          user_id: string
          verdict: string
          verified_at: string | null
        }
        Insert: {
          admin_override?: boolean | null
          admin_override_by?: string | null
          admin_override_reason?: string | null
          analysis_report?: string | null
          analyzed_at?: string | null
          authenticity_score?: number | null
          created_at?: string | null
          deepfake_confidence?: number | null
          deepfake_verdict?: string | null
          exif_latitude?: number | null
          exif_longitude?: number | null
          exif_timestamp?: string | null
          final_confidence?: number | null
          geolocation_match_score?: number | null
          id?: string
          model_used?: string | null
          photo_url: string
          quest_id?: string | null
          quest_match_score?: number | null
          reason: string
          scene_relevance_score?: number | null
          submission_id: string
          updated_at?: string | null
          user_id: string
          verdict: string
          verified_at?: string | null
        }
        Update: {
          admin_override?: boolean | null
          admin_override_by?: string | null
          admin_override_reason?: string | null
          analysis_report?: string | null
          analyzed_at?: string | null
          authenticity_score?: number | null
          created_at?: string | null
          deepfake_confidence?: number | null
          deepfake_verdict?: string | null
          exif_latitude?: number | null
          exif_longitude?: number | null
          exif_timestamp?: string | null
          final_confidence?: number | null
          geolocation_match_score?: number | null
          id?: string
          model_used?: string | null
          photo_url?: string
          quest_id?: string | null
          quest_match_score?: number | null
          reason?: string
          scene_relevance_score?: number | null
          submission_id?: string
          updated_at?: string | null
          user_id?: string
          verdict?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_verifications_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "Quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_verifications_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "Submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      Badges: {
        Row: {
          description: string | null
          icon_url: string | null
          id: string
          name: string
          quest_id: string | null
        }
        Insert: {
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          quest_id?: string | null
        }
        Update: {
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          quest_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Badges_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "Quests"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string
          end_date: string
          id: string
          is_active: boolean | null
          requirement_type: string
          requirement_value: number
          reward_points: number
          reward_xp: number
          start_date: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          end_date: string
          id?: string
          is_active?: boolean | null
          requirement_type: string
          requirement_value: number
          reward_points?: number
          reward_xp?: number
          start_date: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          requirement_type?: string
          requirement_value?: number
          reward_points?: number
          reward_xp?: number
          start_date?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      community_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          image_urls: string[] | null
          post_type: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          post_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          post_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crew_members: {
        Row: {
          crew_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          crew_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          crew_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_id: string | null
          max_members: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          max_members?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          max_members?: number
          name?: string
        }
        Relationships: []
      }
      daily_exercises: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date: string
          exercises_completed: string[] | null
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date: string
          exercises_completed?: string[] | null
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date?: string
          exercises_completed?: string[] | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          receiver_id: string
          reply_to: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          receiver_id: string
          reply_to?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          receiver_id?: string
          reply_to?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      event_quests: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          quest_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          quest_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          quest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_quests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "Quests"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          reward_type: string | null
          reward_value: number | null
          start_date: string
          theme: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description: string
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          reward_type?: string | null
          reward_value?: number | null
          start_date: string
          theme: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          reward_type?: string | null
          reward_value?: number | null
          start_date?: string
          theme?: string
        }
        Relationships: []
      }
      follow_requests: {
        Row: {
          created_at: string | null
          id: string
          requester_id: string | null
          responded_at: string | null
          status: string | null
          target_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          requester_id?: string | null
          responded_at?: string | null
          status?: string | null
          target_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          requester_id?: string | null
          responded_at?: string | null
          status?: string | null
          target_id?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          categories: string[] | null
          confidence: number | null
          content_type: string
          created_at: string | null
          flagged: boolean
          id: string
          is_allowed: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          categories?: string[] | null
          confidence?: number | null
          content_type: string
          created_at?: string | null
          flagged: boolean
          id?: string
          is_allowed: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          categories?: string[] | null
          confidence?: number | null
          content_type?: string
          created_at?: string | null
          flagged?: boolean
          id?: string
          is_allowed?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          push_notifications: boolean | null
          quest_updates: boolean | null
          social_interactions: boolean | null
          team_activities: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          push_notifications?: boolean | null
          quest_updates?: boolean | null
          social_interactions?: boolean | null
          team_activities?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          push_notifications?: boolean | null
          quest_updates?: boolean | null
          social_interactions?: boolean | null
          team_activities?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          submission_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          submission_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          submission_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: []
      }
      powerups: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string
          duration_hours: number
          effect_type: string
          icon_url: string | null
          id: string
          multiplier: number | null
          name: string
          rarity: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description: string
          duration_hours: number
          effect_type: string
          icon_url?: string | null
          id?: string
          multiplier?: number | null
          name: string
          rarity?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string
          duration_hours?: number
          effect_type?: string
          icon_url?: string | null
          id?: string
          multiplier?: number | null
          name?: string
          rarity?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          interests: string[] | null
          is_private: boolean | null
          latitude: number | null
          level: number | null
          location: string | null
          location_last_updated: string | null
          longitude: number | null
          shopping_points: number | null
          total_points: number | null
          updated_at: string
          username: string | null
          wallet_address: string | null
          wallet_private_key_encrypted: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          interests?: string[] | null
          is_private?: boolean | null
          latitude?: number | null
          level?: number | null
          location?: string | null
          location_last_updated?: string | null
          longitude?: number | null
          shopping_points?: number | null
          total_points?: number | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_private_key_encrypted?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          is_private?: boolean | null
          latitude?: number | null
          level?: number | null
          location?: string | null
          location_last_updated?: string | null
          longitude?: number | null
          shopping_points?: number | null
          total_points?: number | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_private_key_encrypted?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      Quests: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: number | null
          difficulty_level: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_limited_time: boolean | null
          location: string | null
          quest_type: string | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: number | null
          difficulty_level?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_limited_time?: boolean | null
          location?: string | null
          quest_type?: string | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: number | null
          difficulty_level?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_limited_time?: boolean | null
          location?: string | null
          quest_type?: string | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Quests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
        ]
      }
      Submissions: {
        Row: {
          description: string | null
          geo_location: string | null
          id: string
          image_urls: string[] | null
          photo_url: string | null
          quest_id: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          description?: string | null
          geo_location?: string | null
          id?: string
          image_urls?: string[] | null
          photo_url?: string | null
          quest_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          description?: string | null
          geo_location?: string | null
          id?: string
          image_urls?: string[] | null
          photo_url?: string | null
          quest_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Submissions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "Quests"
            referencedColumns: ["id"]
          },
        ]
      }
      suggested_quests: {
        Row: {
          category: string
          created_at: string
          description: string
          difficulty: number
          estimated_duration: number
          expires_at: string
          generated_at: string
          generation_context: Json | null
          id: string
          is_accepted: boolean
          is_active: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          quest_type: string
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          difficulty: number
          estimated_duration: number
          expires_at?: string
          generated_at?: string
          generation_context?: Json | null
          id?: string
          is_accepted?: boolean
          is_active?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          quest_type?: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          difficulty?: number
          estimated_duration?: number
          expires_at?: string
          generated_at?: string
          generation_context?: Json | null
          id?: string
          is_accepted?: boolean
          is_active?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          quest_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      team_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          completions: number | null
          id: string
          is_completed: boolean | null
          team_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          completions?: number | null
          id?: string
          is_completed?: boolean | null
          team_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          completions?: number | null
          id?: string
          is_completed?: boolean | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "team_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_challenge_progress_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_challenges: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          quest_id: string | null
          required_completions: number | null
          reward_badge_id: string | null
          reward_points: number | null
          start_date: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          quest_id?: string | null
          required_completions?: number | null
          reward_badge_id?: string | null
          reward_points?: number | null
          start_date?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          quest_id?: string | null
          required_completions?: number | null
          reward_badge_id?: string | null
          reward_points?: number | null
          start_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_challenges_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "Quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_challenges_reward_badge_id_fkey"
            columns: ["reward_badge_id"]
            isOneToOne: false
            referencedRelation: "Badges"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          message: string
          reply_to: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          message: string
          reply_to?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          reply_to?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_quest_completions: {
        Row: {
          completed_at: string
          completed_by: string | null
          id: string
          quest_id: string | null
          team_id: string | null
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          id?: string
          quest_id?: string | null
          team_id?: string | null
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          id?: string
          quest_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_quest_completions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "Quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_quest_completions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_id: string | null
          max_members: number | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          max_members?: number | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          max_members?: number | null
          name?: string
        }
        Relationships: []
      }
      "User Badges": {
        Row: {
          badge_id: string | null
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "User Badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "Badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User Badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          progress: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_powerups: {
        Row: {
          activated_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          powerup_id: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          powerup_id: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          powerup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_powerups_powerup_id_fkey"
            columns: ["powerup_id"]
            isOneToOne: false
            referencedRelation: "powerups"
            referencedColumns: ["id"]
          },
        ]
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
      Users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          id?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          id?: string
          username?: string
        }
        Relationships: []
      }
      verification_ledger: {
        Row: {
          achievement_id: number | null
          badge_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          status: string
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          achievement_id?: number | null
          badge_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: number | null
          badge_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_ledger_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "Badges"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_logs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          points: number
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          source: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_powerup: {
        Args: { p_user_powerup_id: string }
        Returns: undefined
      }
      add_xp_to_user: {
        Args: {
          p_description?: string
          p_source: string
          p_user_id: string
          p_xp: number
        }
        Returns: undefined
      }
      archive_expired_quests: { Args: never; Returns: undefined }
      check_and_unlock_achievement: {
        Args: { p_achievement_id: string; p_user_id: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_message: string
          p_related_id?: string
          p_related_type?: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      delete_submission_admin: {
        Args: { p_submission_id: string }
        Returns: Json
      }
      get_followers: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          followed_at: string
          is_mutual: boolean
          user_id: string
          username: string
        }[]
      }
      get_following: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          followed_at: string
          is_mutual: boolean
          user_id: string
          username: string
        }[]
      }
      get_suggested_users: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          follower_count: number
          mutual_count: number
          user_id: string
          username: string
        }[]
      }
      has_role:
        | { Args: { role_name: string; user_id: string }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      is_verification_in_progress: {
        Args: { p_badge_id: string; p_user_id: string }
        Returns: boolean
      }
      purchase_powerup: {
        Args: { p_cost: number; p_powerup_id: string; p_user_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_follow: { Args: { p_target_user_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      notification_type:
        | "quest_approved"
        | "quest_rejected"
        | "badge_earned"
        | "comment_received"
        | "like_received"
        | "team_invite"
        | "challenge_completed"
        | "daily_challenge_reset"
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
      app_role: ["admin", "moderator", "user"],
      notification_type: [
        "quest_approved",
        "quest_rejected",
        "badge_earned",
        "comment_received",
        "like_received",
        "team_invite",
        "challenge_completed",
        "daily_challenge_reset",
      ],
    },
  },
} as const
