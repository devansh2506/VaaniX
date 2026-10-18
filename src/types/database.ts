export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CheckSource = 'web_mic' | 'web_upload' | 'api' | 'laptop_pipeline';
export type CheckVerdict = 'AI_CLONE' | 'REAL' | 'INCONCLUSIVE';
export type AlertStatus = 'open' | 'confirmed_scam' | 'verified_genuine' | 'dismissed_genuine';
export type ComplaintTarget = 'cyber_cell' | 'bank' | 'portal' | 'api';
export type RadarSource = 'ai_flag' | 'user_report' | 'impersonation_denied';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          phone_e164: string | null;
          state_code: string | null;
          bank_id: string | null;
          telegram_chat_id: number | null;
          telegram_link_token: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          phone_e164?: string | null;
          state_code?: string | null;
          bank_id?: string | null;
          telegram_chat_id?: number | null;
          telegram_link_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          phone_e164?: string | null;
          state_code?: string | null;
          bank_id?: string | null;
          telegram_chat_id?: number | null;
          telegram_link_token?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          aliases: string[];
          relationship: string;
          phone_e164: string;
          telegram_chat_id: number | null;
          join_token: string;
          joined_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          aliases?: string[];
          relationship: string;
          phone_e164: string;
          telegram_chat_id?: number | null;
          join_token?: string;
          joined_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          aliases?: string[];
          relationship?: string;
          phone_e164?: string;
          telegram_chat_id?: number | null;
          join_token?: string;
          joined_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      checks: {
        Row: {
          id: string;
          user_id: string;
          source: CheckSource;
          caller_e164: string | null;
          voice_score: number;
          text_score: number;
          risk_score: number;
          verdict: CheckVerdict;
          is_stub: boolean;
          transcript: string | null;
          transcript_lang: string | null;
          transcript_segments: Json;
          scam_groups: string[];
          scam_words: string[];
          scam_type: string | null;
          claim_type: string | null;
          claim_label: string | null;
          claimed_member_id: string | null;
          audio_path: string | null;
          audio_sha256: string | null;
          timings_ms: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source?: CheckSource;
          caller_e164?: string | null;
          voice_score?: number;
          text_score?: number;
          risk_score?: number;
          verdict: CheckVerdict;
          is_stub?: boolean;
          transcript?: string | null;
          transcript_lang?: string | null;
          transcript_segments?: Json;
          scam_groups?: string[];
          scam_words?: string[];
          scam_type?: string | null;
          claim_type?: string | null;
          claim_label?: string | null;
          claimed_member_id?: string | null;
          audio_path?: string | null;
          audio_sha256?: string | null;
          timings_ms?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: CheckSource;
          caller_e164?: string | null;
          voice_score?: number;
          text_score?: number;
          risk_score?: number;
          verdict?: CheckVerdict;
          is_stub?: boolean;
          transcript?: string | null;
          transcript_lang?: string | null;
          transcript_segments?: Json;
          scam_groups?: string[];
          scam_words?: string[];
          scam_type?: string | null;
          claim_type?: string | null;
          claim_label?: string | null;
          claimed_member_id?: string | null;
          audio_path?: string | null;
          audio_sha256?: string | null;
          timings_ms?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          check_id: string;
          user_id: string;
          status: AlertStatus;
          impersonated_member_id: string | null;
          member_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          check_id: string;
          user_id: string;
          status?: AlertStatus;
          impersonated_member_id?: string | null;
          member_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          check_id?: string;
          user_id?: string;
          status?: AlertStatus;
          impersonated_member_id?: string | null;
          member_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alert_messages: {
        Row: {
          id: string;
          alert_id: string;
          recipient: 'user' | 'member';
          chat_id: number;
          telegram_message_id: number | null;
          ok: boolean;
          error: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          recipient: 'user' | 'member';
          chat_id: number;
          telegram_message_id?: number | null;
          ok?: boolean;
          error?: string | null;
          sent_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          recipient?: 'user' | 'member';
          chat_id?: number;
          telegram_message_id?: number | null;
          ok?: boolean;
          error?: string | null;
          sent_at?: string;
        };
        Relationships: [];
      };
      complaints: {
        Row: {
          id: string;
          alert_id: string;
          user_id: string;
          target: ComplaintTarget;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          user_id: string;
          target: ComplaintTarget;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          user_id?: string;
          target?: ComplaintTarget;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      radar_reports: {
        Row: {
          id: string;
          number_e164: string;
          reporter_user_id: string;
          source: RadarSource;
          check_id: string | null;
          scam_type: string | null;
          excluded: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          number_e164: string;
          reporter_user_id: string;
          source: RadarSource;
          check_id?: string | null;
          scam_type?: string | null;
          excluded?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          number_e164?: string;
          reporter_user_id?: string;
          source?: RadarSource;
          check_id?: string | null;
          scam_type?: string | null;
          excluded?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          check_id: string;
          user_id: string;
          label: 'genuine' | 'scam';
          created_at: string;
        };
        Insert: {
          id?: string;
          check_id: string;
          user_id: string;
          label: 'genuine' | 'scam';
          created_at?: string;
        };
        Update: {
          id?: string;
          check_id?: string;
          user_id?: string;
          label?: 'genuine' | 'scam';
          created_at?: string;
        };
        Relationships: [];
      };
      cyber_cells: {
        Row: {
          state_code: string;
          state_name: string;
          email: string | null;
          portal_url: string;
          source_url: string | null;
          verified: boolean;
          verified_on: string | null;
        };
        Insert: {
          state_code: string;
          state_name: string;
          email?: string | null;
          portal_url?: string;
          source_url?: string | null;
          verified?: boolean;
          verified_on?: string | null;
        };
        Update: {
          state_code?: string;
          state_name?: string;
          email?: string | null;
          portal_url?: string;
          source_url?: string | null;
          verified?: boolean;
          verified_on?: string | null;
        };
        Relationships: [];
      };
      banks: {
        Row: {
          id: string;
          name: string;
          fraud_email: string;
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          fraud_email: string;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          fraud_email?: string;
          is_demo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      api_clients: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          scopes: string[];
          revoked_at: string | null;
          last_used_at: string | null;
          request_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          scopes?: string[];
          revoked_at?: string | null;
          last_used_at?: string | null;
          request_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          key_prefix?: string;
          key_hash?: string;
          scopes?: string[];
          revoked_at?: string | null;
          last_used_at?: string | null;
          request_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          key: string;
          window_start: string;
          count: number;
        };
        Insert: {
          key: string;
          window_start: string;
          count?: number;
        };
        Update: {
          key?: string;
          window_start?: string;
          count?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_user_account: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
