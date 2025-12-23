/**
 * infer tool - Run inference on any available model
 */

import { getClient } from '../api/client.js';

export const inferToolDefinition = {
  name: 'infer',
  description: 'Run AI inference on a Theta EdgeCloud model. Supports image generation, audio transcription, text generation, and more.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      service: {
        type: 'string',
        description: 'Service alias (e.g., "whisper", "flux-1-schnell", "llama-3-1-8b")',
      },
      input: {
        type: 'object',
        description: 'Input parameters for the model (varies by service)',
        additionalProperties: true,
      },
      wait: {
        type: 'number',
        description: 'Seconds to wait for result (0-60, default 30). Use 0 for async processing.',
        minimum: 0,
        maximum: 60,
        default: 30,
      },
      prediction: {
        type: 'string',
        description: 'Specific prediction method if service has multiple (usually not needed)',
      },
      variant: {
        type: 'string',
        description: 'Model variant to use (e.g., "turbo", "large-v3") if available',
      },
    },
    required: ['service', 'input'],
  },
};

interface InferInput {
  service: string;
  input: Record<string, unknown>;
  wait?: number;
  prediction?: string;
  variant?: string;
}

export async function infer(input: InferInput): Promise<string> {
  const client = getClient();

  const waitTime = input.wait ?? 30;

  const inferRequest = await client.createInferRequest(input.service, {
    input: input.input,
    wait: waitTime,
    prediction: input.prediction,
    variant: input.variant,
  });

  // Check if the request completed
  if (inferRequest.state === 'success') {
    return formatSuccessResponse(inferRequest);
  }

  if (inferRequest.state === 'error') {
    return formatErrorResponse(inferRequest);
  }

  // Still processing
  return formatPendingResponse(inferRequest);
}

function formatSuccessResponse(request: {
  id: string;
  output?: Record<string, unknown>;
  cost?: { input: number; output: number };
}): string {
  let output = `Inference completed successfully!\n\n`;
  output += `Request ID: ${request.id}\n\n`;

  if (request.output) {
    // Check for common output types and format nicely
    if (typeof request.output.text === 'string') {
      output += `**Result:**\n${request.output.text}\n`;
    } else if (typeof request.output.url === 'string') {
      output += `**Generated Image URL:**\n${request.output.url}\n`;
    } else if (Array.isArray(request.output.urls)) {
      output += `**Generated Image URLs:**\n`;
      for (const url of request.output.urls) {
        output += `- ${url}\n`;
      }
    } else {
      output += `**Output:**\n\`\`\`json\n${JSON.stringify(request.output, null, 2)}\n\`\`\`\n`;
    }
  }

  if (request.cost) {
    output += `\nCost: ${request.cost.input + request.cost.output} credits`;
  }

  return output;
}

function formatErrorResponse(request: {
  id: string;
  error?: string;
}): string {
  let output = `Inference failed.\n\n`;
  output += `Request ID: ${request.id}\n`;
  output += `Error: ${request.error || 'Unknown error'}\n`;
  return output;
}

function formatPendingResponse(request: {
  id: string;
  state: string;
}): string {
  let output = `Inference request is still processing.\n\n`;
  output += `Request ID: ${request.id}\n`;
  output += `Current State: ${request.state}\n\n`;
  output += `To check the status later, use:\n`;
  output += `get_request_status(request_id="${request.id}")\n`;
  return output;
}
