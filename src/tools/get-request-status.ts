/**
 * get_request_status tool - Check status of an async inference request
 */

import { getClient } from '../api/client.js';

export const getRequestStatusToolDefinition = {
  name: 'get_request_status',
  description: 'Check the status of an inference request. Use this to get results of async requests.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      request_id: {
        type: 'string',
        description: 'The inference request ID (returned from infer tool)',
      },
    },
    required: ['request_id'],
  },
};

interface GetRequestStatusInput {
  request_id: string;
}

export async function getRequestStatus(input: GetRequestStatusInput): Promise<string> {
  const client = getClient();

  const inferRequest = await client.getInferRequest(input.request_id);

  let output = `Request ID: ${inferRequest.id}\n`;
  output += `State: ${inferRequest.state}\n`;
  output += `Created: ${inferRequest.create_time}\n`;
  output += `Updated: ${inferRequest.update_time}\n\n`;

  if (inferRequest.state === 'success') {
    if (inferRequest.output) {
      // Check for common output types and format nicely
      if (typeof inferRequest.output.text === 'string') {
        output += `**Result:**\n${inferRequest.output.text}\n`;
      } else if (typeof inferRequest.output.url === 'string') {
        output += `**Generated Image URL:**\n${inferRequest.output.url}\n`;
      } else if (Array.isArray(inferRequest.output.urls)) {
        output += `**Generated Image URLs:**\n`;
        for (const url of inferRequest.output.urls) {
          output += `- ${url}\n`;
        }
      } else {
        output += `**Output:**\n\`\`\`json\n${JSON.stringify(inferRequest.output, null, 2)}\n\`\`\`\n`;
      }
    }

    if (inferRequest.cost) {
      output += `\nCost: ${inferRequest.cost.input + inferRequest.cost.output} credits`;
    }
  } else if (inferRequest.state === 'error') {
    output += `**Error:** ${inferRequest.error || 'Unknown error'}\n`;
  } else if (inferRequest.state === 'pending' || inferRequest.state === 'processing') {
    output += `The request is still ${inferRequest.state}. Check again in a few seconds.\n`;
  }

  return output;
}
