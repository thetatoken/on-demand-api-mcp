/**
 * get_upload_url tool - Get presigned URLs for file uploads
 */

import { getClient } from '../api/client.js';

export const getUploadUrlToolDefinition = {
  name: 'get_upload_url',
  description: 'Get a presigned URL to upload a file for inference. Use this when you need to upload a local file (audio, image, etc.) before running inference.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      service: {
        type: 'string',
        description: 'Service alias (e.g., "whisper", "sdxl")',
      },
      input_field: {
        type: 'string',
        description: 'Which input field needs the file (e.g., "audio_filename", "image")',
      },
    },
    required: ['service', 'input_field'],
  },
};

interface GetUploadUrlInput {
  service: string;
  input_field: string;
}

export async function getUploadUrl(input: GetUploadUrlInput): Promise<string> {
  const client = getClient();

  const response = await client.getPresignedUrls(input.service, [input.input_field]);

  const urlInfo = response.urls[input.input_field];

  if (!urlInfo) {
    return `Error: Could not get upload URL for field "${input.input_field}". ` +
           `Make sure the field name is correct for the ${input.service} service.`;
  }

  let output = `**Upload URL Generated**\n\n`;
  output += `Upload your file using a PUT request to:\n`;
  output += `\`${urlInfo.upload_url}\`\n\n`;
  output += `After uploading, use this filename in your infer() call:\n`;
  output += `\`${urlInfo.filename}\`\n\n`;
  output += `**Example cURL command:**\n`;
  output += `\`\`\`bash\n`;
  output += `curl -X PUT -T your-file.wav "${urlInfo.upload_url}"\n`;
  output += `\`\`\`\n\n`;
  output += `**Then run inference:**\n`;
  output += `\`\`\`\n`;
  output += `infer(\n`;
  output += `  service="${input.service}",\n`;
  output += `  input={"${input.input_field}": "${urlInfo.filename}"}\n`;
  output += `)\n`;
  output += `\`\`\`\n`;

  return output;
}
