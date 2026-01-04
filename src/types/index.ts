/**
 * Types for Theta EdgeCloud On-Demand API MCP Server
 */

// API Response wrapper
export interface ApiResponse<T> {
  body: T;
  status: number;
}

// Service types
export interface Service {
  id: string;
  name: string;
  alias: string;
  state: 'public' | 'internal';
  template_id: string;
  workload_type: string;
  predictions: Record<string, Prediction>;
  default_prediction: string;
  min_vram: number;
  min_ram: number;
  executions: number;
  rank: number;
  variant_templates?: Record<string, VariantTemplate>;
  create_time: string;
  update_time: string;
}

export interface Prediction {
  rank: number;
  func_type: string;
  instructions: string;
  cost: number;
  cost_divisor: number;
  input_vars: Record<string, InputVarSpec>;
  output_vars: Record<string, OutputVarSpec>;
  external_price_tier?: string;
  variants?: string[];
}

export interface InputVarSpec {
  type: string;
  index?: number;
  description?: string;
  required?: boolean;
  default?: unknown;
}

export interface OutputVarSpec {
  type: string;
  action?: string;
  results_path?: string;
  description?: string;
}

export interface VariantTemplate {
  template_id: string;
  min_vram?: number;
  min_ram?: number;
}

// Infer Request types
export interface InferRequest {
  id: string;
  service_id: string;
  project_id: string;
  state: 'pending' | 'processing' | 'success' | 'error';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  prediction: string;
  variant?: string;
  cost?: {
    input: number;
    output: number;
  };
  create_time: string;
  update_time: string;
}

export interface CreateInferRequestParams {
  input: Record<string, unknown>;
  prediction?: string;
  variant?: string;
  wait?: number;
  webhook?: string;
}

export interface CreateInferRequestResponse {
  infer_requests: InferRequest[];
}

// Upload URL types
export interface PresignedUrlResponse {
  urls: Record<string, {
    upload_url: string;
    filename: string;
  }>;
}

// Service list response
export interface ServiceListResponse {
  services: Service[];
  pagination?: {
    page: number;
    number: number;
    total: number;
  };
}

// Config
export interface McpConfig {
  apiKey: string;
  baseUrl: string;
}
