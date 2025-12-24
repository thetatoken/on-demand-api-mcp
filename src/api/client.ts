/**
 * HTTP Client wrapper for Theta EdgeCloud On-Demand API
 */

import {
  ApiResponse,
  Service,
  ServiceListResponse,
  InferRequest,
  CreateInferRequestParams,
  CreateInferRequestResponse,
  PresignedUrlResponse,
  McpConfig,
} from '../types/index.js';

const DEFAULT_BASE_URL = 'https://ondemand.thetaedgecloud.com';

export class ThetaApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: McpConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-theta-api-key': this.apiKey,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(`API Error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    return data as T;
  }

  /**
   * List all available public services
   */
  async listServices(): Promise<Service[]> {
    const response = await this.request<ApiResponse<ServiceListResponse>>(
      'GET',
      '/service/list'
    );
    return response.body.services;
  }

  /**
   * Get a specific service by ID or alias
   */
  async getService(idOrAlias: string): Promise<Service> {
    const response = await this.request<ApiResponse<{ services: Service[] }>>(
      'GET',
      `/service/${idOrAlias}`
    );
    return response.body.services[0];
  }

  /**
   * Create an inference request
   */
  async createInferRequest(
    serviceAlias: string,
    params: CreateInferRequestParams
  ): Promise<InferRequest> {
    const queryParams = new URLSearchParams();

    if (params.wait !== undefined) {
      queryParams.set('wait', params.wait.toString());
    }
    if (params.prediction) {
      queryParams.set('prediction', params.prediction);
    }

    const queryString = queryParams.toString();
    const path = `/infer_request/${serviceAlias}${queryString ? `?${queryString}` : ''}`;

    const body: Record<string, unknown> = {
      input: params.input,
    };

    if (params.variant) {
      body.variant = params.variant;
    }
    if (params.webhook) {
      body.webhook = params.webhook;
    }

    const response = await this.request<ApiResponse<CreateInferRequestResponse>>(
      'POST',
      path,
      body
    );

    return response.body.infer_requests[0];
  }

  /**
   * Get the status of an inference request
   */
  async getInferRequest(requestId: string): Promise<InferRequest> {
    const response = await this.request<ApiResponse<{ infer_requests: InferRequest[] }>>(
      'GET',
      `/infer_request/${requestId}`
    );
    return response.body.infer_requests[0];
  }

  /**
   * Get presigned URLs for file uploads
   */
  async getPresignedUrls(
    serviceAlias: string,
    inputFields: string[]
  ): Promise<PresignedUrlResponse> {
    const response = await this.request<ApiResponse<PresignedUrlResponse>>(
      'POST',
      `/infer_request/${serviceAlias}/input_presigned_urls`,
      { input_fields: inputFields }
    );
    return response.body;
  }
}

// Singleton instance
let clientInstance: ThetaApiClient | null = null;

export function getClient(): ThetaApiClient {
  if (!clientInstance) {
    const apiKey = process.env.THETA_API_KEY;
    if (!apiKey) {
      throw new Error('THETA_API_KEY environment variable is required');
    }

    const baseUrl = process.env.THETA_API_BASE_URL || DEFAULT_BASE_URL;

    clientInstance = new ThetaApiClient({ apiKey, baseUrl });
  }
  return clientInstance;
}

export function resetClient(): void {
  clientInstance = null;
}
