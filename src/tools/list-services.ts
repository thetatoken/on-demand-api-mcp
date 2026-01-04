/**
 * list_services tool - Discover available AI models/services
 */

import { getClient } from '../api/client.js';
import { Service } from '../types/index.js';

export const listServicesToolDefinition = {
  name: 'list_services',
  description: 'List all available AI models and services on Theta EdgeCloud. Returns service names, descriptions, and input/output specifications.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        description: 'Optional filter by category (e.g., "image", "audio", "text")',
      },
    },
    required: [] as string[],
  },
};

interface ListServicesInput {
  category?: string;
}

interface ServiceSummary {
  alias: string;
  name: string;
  description: string;
  category: string;
  input_example: Record<string, unknown>;
  variants?: string[];
}

function categorizeService(service: Service): string {
  const alias = service.alias.toLowerCase();

  if (alias.includes('whisper') || alias.includes('audio') || alias.includes('voice')) {
    return 'audio';
  }
  if (alias.includes('flux') || alias.includes('sdxl') || alias.includes('stable') ||
      alias.includes('image') || alias.includes('upscale')) {
    return 'image';
  }
  if (alias.includes('llama') || alias.includes('llm') || alias.includes('text') ||
      alias.includes('chat') || alias.includes('mistral')) {
    return 'text';
  }
  if (alias.includes('video')) {
    return 'video';
  }
  return 'other';
}

function getInputExample(service: Service): Record<string, unknown> {
  const prediction = service.predictions?.[service.default_prediction];
  if (!prediction?.input_vars || typeof prediction.input_vars !== 'object') {
    return {};
  }

  const example: Record<string, unknown> = {};
  for (const [name, inputVar] of Object.entries(prediction.input_vars)) {
    if (inputVar.type === 'string') {
      if (name.includes('url') || name.includes('filename')) {
        example[name] = 'https://example.com/file';
      } else if (name === 'prompt') {
        example[name] = 'Your prompt here';
      } else {
        example[name] = inputVar.default || 'string value';
      }
    } else if (inputVar.type === 'number' || inputVar.type === 'integer') {
      example[name] = inputVar.default || 1;
    } else if (inputVar.type === 'boolean') {
      example[name] = inputVar.default || false;
    } else if (inputVar.type === 'array') {
      example[name] = inputVar.default || [];
    } else {
      example[name] = inputVar.default || null;
    }
  }
  return example;
}

function getAvailableVariants(service: Service): string[] | undefined {
  const prediction = service.predictions?.[service.default_prediction];
  if (prediction?.variants && prediction.variants.length > 1) {
    return prediction.variants;
  }
  return undefined;
}

export async function listServices(input: ListServicesInput): Promise<string> {
  const client = getClient();
  const services = await client.listServices();

  let filteredServices = services.filter(s => s.state === 'public');

  // Filter by category if provided
  if (input.category) {
    const categoryLower = input.category.toLowerCase();
    filteredServices = filteredServices.filter(
      s => categorizeService(s) === categoryLower
    );
  }

  // Transform to user-friendly format
  const summaries: ServiceSummary[] = filteredServices.map(service => ({
    alias: service.alias,
    name: service.name,
    description: service.predictions?.[service.default_prediction]?.instructions || 'No description available',
    category: categorizeService(service),
    input_example: getInputExample(service),
    variants: getAvailableVariants(service),
  }));

  // Group by category
  const byCategory: Record<string, ServiceSummary[]> = {};
  for (const summary of summaries) {
    if (!byCategory[summary.category]) {
      byCategory[summary.category] = [];
    }
    byCategory[summary.category].push(summary);
  }

  // Format output
  let output = `Found ${summaries.length} available services:\n\n`;

  for (const [category, services] of Object.entries(byCategory)) {
    output += `## ${category.toUpperCase()}\n\n`;
    for (const service of services) {
      output += `### ${service.name} (${service.alias})\n`;
      output += `${service.description}\n`;
      if (service.variants) {
        output += `Variants: ${service.variants.join(', ')}\n`;
      }
      output += `Example input: ${JSON.stringify(service.input_example, null, 2)}\n\n`;
    }
  }

  return output;
}
