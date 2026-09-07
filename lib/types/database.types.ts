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
      baseline_pendencias_detalhe: {
        Row: {
          colaborador_nome: string
          created_at: string
          estrutura_id: string
          id: string
          macro_estrutura_id: string
          matricula: string
          qualis: boolean | null
          snapshot_id: string
          treinamento_id: string
          turno: Database["public"]["Enums"]["turno_tipo"] | null
        }
        Insert: {
          colaborador_nome: string
          created_at?: string
          estrutura_id: string
          id?: string
          macro_estrutura_id: string
          matricula: string
          qualis?: boolean | null
          snapshot_id: string
          treinamento_id: string
          turno?: Database["public"]["Enums"]["turno_tipo"] | null
        }
        Update: {
          colaborador_nome?: string
          created_at?: string
          estrutura_id?: string
          id?: string
          macro_estrutura_id?: string
          matricula?: string
          qualis?: boolean | null
          snapshot_id?: string
          treinamento_id?: string
          turno?: Database["public"]["Enums"]["turno_tipo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "baseline_pendencias_detalhe_estrutura_id_fkey"
            columns: ["estrutura_id"]
            isOneToOne: false
            referencedRelation: "estruturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_pendencias_detalhe_macro_estrutura_id_fkey"
            columns: ["macro_estrutura_id"]
            isOneToOne: false
            referencedRelation: "macro_estruturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_pendencias_detalhe_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "baseline_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_pendencias_detalhe_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      baseline_snapshot_itens: {
        Row: {
          estrutura_id: string
          id: string
          macro_estrutura_id: string
          snapshot_id: string
          total_concluidos: number
          total_pendencias: number
        }
        Insert: {
          estrutura_id: string
          id?: string
          macro_estrutura_id: string
          snapshot_id: string
          total_concluidos?: number
          total_pendencias?: number
        }
        Update: {
          estrutura_id?: string
          id?: string
          macro_estrutura_id?: string
          snapshot_id?: string
          total_concluidos?: number
          total_pendencias?: number
        }
        Relationships: [
          {
            foreignKeyName: "baseline_snapshot_itens_estrutura_id_fkey"
            columns: ["estrutura_id"]
            isOneToOne: false
            referencedRelation: "estruturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_snapshot_itens_macro_estrutura_id_fkey"
            columns: ["macro_estrutura_id"]
            isOneToOne: false
            referencedRelation: "macro_estruturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_snapshot_itens_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "baseline_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      baseline_snapshots: {
        Row: {
          ativo: boolean
          criado_em: string
          criado_por: string | null
          data_referencia: string
          descricao: string | null
          id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          data_referencia: string
          descricao?: string | null
          id?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          data_referencia?: string
          descricao?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baseline_snapshots_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          ativo: boolean
          created_at: string
          estrutura_id: string
          id: string
          matricula: string
          nome: string
          turno: Database["public"]["Enums"]["turno_tipo"] | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          estrutura_id: string
          id?: string
          matricula: string
          nome: string
          turno?: Database["public"]["Enums"]["turno_tipo"] | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          estrutura_id?: string
          id?: string
          matricula?: string
          nome?: string
          turno?: Database["public"]["Enums"]["turno_tipo"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_estrutura_id_fkey"
            columns: ["estrutura_id"]
            isOneToOne: false
            referencedRelation: "estruturas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          id: boolean
          login_bg_atualizado_em: string | null
          logo_atualizado_em: string | null
        }
        Insert: {
          id?: boolean
          login_bg_atualizado_em?: string | null
          logo_atualizado_em?: string | null
        }
        Update: {
          id?: boolean
          login_bg_atualizado_em?: string | null
          logo_atualizado_em?: string | null
        }
        Relationships: []
      }
      estruturas: {
        Row: {
          codigo: string
          created_at: string
          id: string
          macro_estrutura_id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          macro_estrutura_id: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          macro_estrutura_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "estruturas_macro_estrutura_id_fkey"
            columns: ["macro_estrutura_id"]
            isOneToOne: false
            referencedRelation: "macro_estruturas"
            referencedColumns: ["id"]
          },
        ]
      }
      gestor_estruturas: {
        Row: {
          created_at: string
          estrutura_id: string
          gestor_id: string
        }
        Insert: {
          created_at?: string
          estrutura_id: string
          gestor_id: string
        }
        Update: {
          created_at?: string
          estrutura_id?: string
          gestor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gestor_estruturas_estrutura_id_fkey"
            columns: ["estrutura_id"]
            isOneToOne: false
            referencedRelation: "estruturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestor_estruturas_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      importacao_erros: {
        Row: {
          erro_mensagem: string
          id: string
          importacao_id: string
          linha_numero: number
          linha_raw: Json
        }
        Insert: {
          erro_mensagem: string
          id?: string
          importacao_id: string
          linha_numero: number
          linha_raw: Json
        }
        Update: {
          erro_mensagem?: string
          id?: string
          importacao_id?: string
          linha_numero?: number
          linha_raw?: Json
        }
        Relationships: [
          {
            foreignKeyName: "importacao_erros_importacao_id_fkey"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "importacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      importacoes: {
        Row: {
          arquivo_nome: string
          arquivo_storage_path: string | null
          finalizado_em: string | null
          id: string
          importado_por: string
          iniciado_em: string
          mapeamento_template_id: string | null
          mapeamento_utilizado: Json
          status: Database["public"]["Enums"]["importacao_status"]
          total_erro: number
          total_linhas: number
          total_sucesso: number
        }
        Insert: {
          arquivo_nome: string
          arquivo_storage_path?: string | null
          finalizado_em?: string | null
          id?: string
          importado_por: string
          iniciado_em?: string
          mapeamento_template_id?: string | null
          mapeamento_utilizado: Json
          status?: Database["public"]["Enums"]["importacao_status"]
          total_erro?: number
          total_linhas?: number
          total_sucesso?: number
        }
        Update: {
          arquivo_nome?: string
          arquivo_storage_path?: string | null
          finalizado_em?: string | null
          id?: string
          importado_por?: string
          iniciado_em?: string
          mapeamento_template_id?: string | null
          mapeamento_utilizado?: Json
          status?: Database["public"]["Enums"]["importacao_status"]
          total_erro?: number
          total_linhas?: number
          total_sucesso?: number
        }
        Relationships: [
          {
            foreignKeyName: "importacoes_importado_por_fkey"
            columns: ["importado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "importacoes_mapeamento_template_id_fkey"
            columns: ["mapeamento_template_id"]
            isOneToOne: false
            referencedRelation: "mapeamentos_importacao"
            referencedColumns: ["id"]
          },
        ]
      }
      macro_estruturas: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      mapeamentos_importacao: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          mapeamento: Json
          nome: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          mapeamento: Json
          nome: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          mapeamento?: Json
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapeamentos_importacao_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      treinamentos: {
        Row: {
          created_at: string
          id: string
          id_treina: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_treina: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          id_treina?: string
          nome?: string
        }
        Relationships: []
      }
      treinamentos_colaboradores: {
        Row: {
          colaborador_id: string
          created_at: string
          data_status: string | null
          estrutura_id: string
          id: string
          importacao_id: string | null
          macro_estrutura_id: string
          qualis: boolean | null
          status: Database["public"]["Enums"]["status_treinamento"]
          treinamento_id: string
          turno: Database["public"]["Enums"]["turno_tipo"] | null
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data_status?: string | null
          estrutura_id: string
          id?: string
          importacao_id?: string | null
          macro_estrutura_id: string
          qualis?: boolean | null
          status: Database["public"]["Enums"]["status_treinamento"]
          treinamento_id: string
          turno?: Database["public"]["Enums"]["turno_tipo"] | null
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data_status?: string | null
          estrutura_id?: string
          id?: string
          importacao_id?: string | null
          macro_estrutura_id?: string
          qualis?: boolean | null
          status?: Database["public"]["Enums"]["status_treinamento"]
          treinamento_id?: string
          turno?: Database["public"]["Enums"]["turno_tipo"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tc_importacao"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "importacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamentos_colaboradores_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamentos_colaboradores_estrutura_id_fkey"
            columns: ["estrutura_id"]
            isOneToOne: false
            referencedRelation: "estruturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamentos_colaboradores_macro_estrutura_id_fkey"
            columns: ["macro_estrutura_id"]
            isOneToOne: false
            referencedRelation: "macro_estruturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamentos_colaboradores_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      estruturas_permitidas: { Args: never; Returns: string[] }
      is_admin: { Args: never; Returns: boolean }
      rpc_definir_baseline: {
        Args: { p_data_referencia: string; p_descricao?: string }
        Returns: string
      }
      rpc_grafico_estrutura: {
        Args: {
          p_gestor_id?: string
          p_macro_ids?: string[]
          p_qualis?: boolean
          p_treinamento_id?: string
          p_turno_grupo?: string
        }
        Returns: {
          atual_pendencias: number
          baseline_pendencias: number
          codigo: string
          estrutura_id: string
          nome: string
        }[]
      }
      rpc_grafico_macro_estrutura: {
        Args: {
          p_estrutura_id?: string
          p_gestor_id?: string
          p_macro_ids?: string[]
          p_qualis?: boolean
          p_treinamento_id?: string
          p_turno_grupo?: string
        }
        Returns: {
          atual_pendencias: number
          baseline_pendencias: number
          codigo: string
          macro_estrutura_id: string
          nome: string
        }[]
      }
      rpc_importar_pendencias: {
        Args: {
          p_arquivo_nome: string
          p_colaboradores: Json
          p_pendencias: Json
          p_treinamentos: Json
        }
        Returns: {
          importacao_id: string
          total_colaboradores: number
          total_erros: number
          total_pendencias: number
          total_treinamentos: number
        }[]
      }
      rpc_indicadores_geral: {
        Args: {
          p_estrutura_id?: string
          p_gestor_id?: string
          p_macro_ids?: string[]
          p_qualis?: boolean
          p_treinamento_id?: string
          p_turno_grupo?: string
        }
        Returns: {
          indice_conclusao: number
          total_concluidos: number
          total_pendencias: number
        }[]
      }
      rpc_pendencias_por_estrutura_turno: {
        Args: {
          p_estrutura_id?: string
          p_macro_estrutura_id?: string
          p_qualis?: boolean
          p_treinamento_id?: string
        }
        Returns: {
          codigo: string
          estrutura_id: string
          nome: string
          total: number
          turno: Database["public"]["Enums"]["turno_tipo"]
        }[]
      }
      rpc_pendencias_por_turno: {
        Args: {
          p_estrutura_id?: string
          p_macro_estrutura_id?: string
          p_qualis?: boolean
          p_treinamento_id?: string
        }
        Returns: {
          total: number
          turno: Database["public"]["Enums"]["turno_tipo"]
        }[]
      }
      rpc_tabela_detalhada: {
        Args: {
          p_estrutura_id?: string
          p_macro_estrutura_id?: string
          p_order_by?: string
          p_order_dir?: string
          p_page?: number
          p_page_size?: number
          p_qualis?: boolean
          p_treinamento_id?: string
          p_turno_grupo?: string
        }
        Returns: {
          colaborador: string
          id_treina: string
          matricula: string
          total_count: number
          treinamento: string
          turno: Database["public"]["Enums"]["turno_tipo"]
        }[]
      }
      rpc_treinamentos_por_estrutura: {
        Args: { p_estrutura_id?: string }
        Returns: {
          id: string
          nome: string
        }[]
      }
      rpc_visao_individual: {
        Args: {
          p_estrutura_id?: string
          p_macro_estrutura_id: string
          p_qualis?: boolean
          p_treinamento_id?: string
          p_turno?: Database["public"]["Enums"]["turno_tipo"]
        }
        Returns: {
          total_pendencias: number
        }[]
      }
    }
    Enums: {
      importacao_status:
        | "processando"
        | "concluida"
        | "concluida_com_erros"
        | "falhou"
      status_treinamento: "pendente" | "concluido"
      turno_tipo: "diurno" | "vespertino" | "noturno" | "fixo"
      user_role: "administrador" | "gestor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      importacao_status: [
        "processando",
        "concluida",
        "concluida_com_erros",
        "falhou",
      ],
      status_treinamento: ["pendente", "concluido"],
      turno_tipo: ["diurno", "vespertino", "noturno", "fixo"],
      user_role: ["administrador", "gestor"],
    },
  },
} as const
