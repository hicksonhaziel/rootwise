/**
 * types/supabase.ts
 *
 * Auto-generated Supabase TypeScript types.
 * Regenerate after schema changes:
 *   npm run db:types
 *
 * This placeholder will be replaced once the Supabase project is linked.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          owner_user_id: string;
          title: string;
          course_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          title: string;
          course_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          title?: string;
          course_code?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      course_members: {
        Row: {
          course_id: string;
          user_id: string;
          role: string;
          joined_at: string;
          group_sharing_opt_in: boolean;
        };
        Insert: {
          course_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
          group_sharing_opt_in?: boolean;
        };
        Update: {
          course_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
          group_sharing_opt_in?: boolean;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          course_id: string;
          uploaded_by: string;
          filename: string;
          mime_type: string;
          storage_path: string;
          processing_status: string;
          processing_error: string | null;
          page_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          uploaded_by: string;
          filename: string;
          mime_type?: string;
          storage_path: string;
          processing_status?: string;
          processing_error?: string | null;
          page_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          uploaded_by?: string;
          filename?: string;
          mime_type?: string;
          storage_path?: string;
          processing_status?: string;
          processing_error?: string | null;
          page_count?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      source_chunks: {
        Row: {
          id: string;
          source_id: string;
          course_id: string;
          page_number: number | null;
          chunk_index: number;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          course_id: string;
          page_number?: number | null;
          chunk_index: number;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          course_id?: string;
          page_number?: number | null;
          chunk_index?: number;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      diagnostic_attempts: {
        Row: {
          id: string;
          course_id: string;
          topic_id: string;
          user_id: string;
          question_text: string;
          student_answer: string;
          assessment_json: Json | null;
          citation_source_ids: string[] | null;
          attempt_type: string;
          confidence: string;
          diagnosis_category: string | null;
          assessment: string | null;
          diagnosis_rejected: boolean;
          confident_error: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          topic_id: string;
          user_id: string;
          question_text: string;
          student_answer: string;
          assessment_json?: Json | null;
          citation_source_ids?: string[] | null;
          attempt_type?: string;
          confidence: string;
          diagnosis_category?: string | null;
          assessment?: string | null;
          diagnosis_rejected?: boolean;
          confident_error?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diagnostic_attempts"]["Insert"]>;
        Relationships: [];
      };
      topic_progress: {
        Row: {
          user_id: string;
          course_id: string;
          topic_id: string;
          status: string;
          status_reason: string | null;
          confident_error: boolean;
          recheck_due_at: string | null;
          last_attempt_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          topic_id: string;
          status?: string;
          status_reason?: string | null;
          confident_error?: boolean;
          recheck_due_at?: string | null;
          last_attempt_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["topic_progress"]["Insert"]>;
        Relationships: [];
      };
      group_contributions: {
        Row: {
          id: string;
          course_id: string;
          topic_id: string | null;
          user_id: string;
          contribution_type: string;
          misconception_cat: string | null;
          consented_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          topic_id?: string | null;
          user_id: string;
          contribution_type: string;
          misconception_cat?: string | null;
          consented_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_contributions"]["Insert"]>;
        Relationships: [];
      };
      room_sessions: {
        Row: {
          id: string;
          host_user_id: string;
          code: string;
          course_id: string | null;
          question_text: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          host_user_id: string;
          code: string;
          course_id?: string | null;
          question_text: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["room_sessions"]["Insert"]>;
        Relationships: [];
      };
      room_answers: {
        Row: {
          id: string;
          room_id: string;
          session_token: string;
          opted_in: boolean;
          confidence: string | null;
          misconception_cat: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          session_token: string;
          opted_in?: boolean;
          confidence?: string | null;
          misconception_cat?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["room_answers"]["Insert"]>;
        Relationships: [];
      };
      fix_tunde_sessions: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          explanation_with_misconception: string;
          planted_misconception_hint: string;
          correct_version: string;
          student_fix: string | null;
          fix_result: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          explanation_with_misconception: string;
          planted_misconception_hint: string;
          correct_version: string;
          student_fix?: string | null;
          fix_result?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fix_tunde_sessions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
