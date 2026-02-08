export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      households: {
        Row: {
          id: string;
          name: string;
          currency: string;
          created_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          currency?: string;
          created_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          currency?: string;
          created_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'households_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: string;
          status: string;
          joined_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role: string;
          status?: string;
          joined_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: string;
          status?: string;
          joined_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'household_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      invites: {
        Row: {
          id: string;
          household_id: string;
          email: string;
          token: string;
          invited_by_user_id: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          email: string;
          token?: string;
          invited_by_user_id?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          email?: string;
          token?: string;
          invited_by_user_id?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invites_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invites_invited_by_user_id_fkey';
            columns: ['invited_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      income_sources: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'income_sources_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      incomes: {
        Row: {
          id: string;
          household_id: string;
          amount: number;
          source_id: string | null;
          source_name: string;
          user_id: string | null;
          user_name: string;
          date: string;
          notes: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          amount: number;
          source_id?: string | null;
          source_name: string;
          user_id?: string | null;
          user_name: string;
          date: string;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          amount?: number;
          source_id?: string | null;
          source_name?: string;
          user_id?: string | null;
          user_name?: string;
          date?: string;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'incomes_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incomes_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'income_sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incomes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incomes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          color: string | null;
          needs_or_wants: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          color?: string | null;
          needs_or_wants: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          color?: string | null;
          needs_or_wants?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      monthly_categories: {
        Row: {
          id: string;
          household_id: string;
          category_id: string;
          month: string;
          budget: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id: string;
          month: string;
          budget: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          category_id?: string;
          month?: string;
          budget?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_categories_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'monthly_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          amount: number;
          category_id: string | null;
          category_name: string;
          user_id: string | null;
          user_name: string;
          date: string;
          notes: string | null;
          needs_or_wants: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          amount: number;
          category_id?: string | null;
          category_name: string;
          user_id?: string | null;
          user_name: string;
          date: string;
          notes?: string | null;
          needs_or_wants: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          amount?: number;
          category_id?: string | null;
          category_name?: string;
          user_id?: string | null;
          user_name?: string;
          date?: string;
          notes?: string | null;
          needs_or_wants?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      savings_goals: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'savings_goals_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      savings_contributions: {
        Row: {
          id: string;
          household_id: string;
          goal_id: string;
          amount: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          goal_id: string;
          amount: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          goal_id?: string;
          amount?: number;
          date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'savings_contributions_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'savings_contributions_goal_id_fkey';
            columns: ['goal_id'];
            isOneToOne: false;
            referencedRelation: 'savings_goals';
            referencedColumns: ['id'];
          },
        ];
      };
      alerts: {
        Row: {
          id: string;
          household_id: string;
          type: string;
          category_id: string | null;
          threshold: number;
          current_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          type: string;
          category_id?: string | null;
          threshold: number;
          current_value?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          type?: string;
          category_id?: string | null;
          threshold?: number;
          current_value?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alerts_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alerts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
