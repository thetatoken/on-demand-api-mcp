# Theta EdgeCloud On-Demand API MCP Server

Official Model Context Protocol (MCP) server for [Theta EdgeCloud's On-Demand Model APIs](https://www.thetaedgecloud.com). Access 20+ AI models directly from Claude Desktop, Claude Code, Cursor, and other MCP-compatible clients.

## Features

- **20+ AI Models** - Image generation, audio transcription, LLMs, and more
- **Simple Integration** - Works with any MCP-compatible client
- **Sync & Async** - Get results immediately or poll for long-running tasks
- **File Uploads** - Upload local files for processing

## Installation

### For Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "theta-edgecloud": {
      "command": "npx",
      "args": ["@thetalabs/on-demand-api-mcp"],
      "env": {
        "THETA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### For Claude Code

```bash
claude mcp add theta-edgecloud -e THETA_API_KEY=your-api-key-here -- npx @thetalabs/on-demand-api-mcp
```

Replace `your-api-key-here` with your actual API key.

**Verify it's working:**
```bash
claude mcp list
```

You should see `theta-edgecloud` with status `✓ Connected`.

## Getting Your API Key

1. Visit [https://www.thetaedgecloud.com/dashboard/api-keys](https://www.thetaedgecloud.com/dashboard/api-keys)
2. Create a new API key
3. Add it to your MCP configuration

## Available Tools

### `list_services`

Discover available AI models and their capabilities.

```
list_services()
list_services(category="image")
```

### `infer`

Run AI inference on any model.

```
# Transcribe audio
infer(service="whisper", input={"audio_filename": "https://example.com/audio.wav"})

# Generate an image
infer(service="flux-1-schnell", input={"prompt": "A sunset over mountains"})

# Chat with an LLM
infer(service="llama-3-1-8b", input={"messages": [{"role": "user", "content": "Hello!"}]})
```

**Parameters:**
- `service` (required) - Service alias (e.g., "whisper", "flux-1-schnell")
- `input` (required) - Input parameters (varies by service)
- `wait` (optional) - Seconds to wait for result (0-60, default 30)
- `variant` (optional) - Model variant if available (e.g., "turbo")

### `get_request_status`

Check the status of an async inference request.

```
get_request_status(request_id="infer_abc123")
```

### `get_upload_url`

Get a presigned URL to upload a local file.

```
get_upload_url(service="whisper", input_field="audio_filename")
```

## Example Conversations

**User:** "What AI models are available on Theta EdgeCloud?"

**Claude:** *calls list_services()* "Here are the available models..."

---

**User:** "Transcribe this audio file: https://example.com/meeting.wav"

**Claude:** *calls infer(service="whisper", input={"audio_filename": "..."})* "Here's the transcription..."

---

**User:** "Generate an image of a cyberpunk cityscape"

**Claude:** *calls infer(service="flux-1-schnell", input={"prompt": "cyberpunk cityscape at night, neon lights"})* "Here's your image: [URL]"

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `THETA_API_KEY` | Your Theta EdgeCloud API key | Yes |
| `THETA_API_BASE_URL` | API base URL (default: https://api.thetaedgecloud.com) | No |

## Development

```bash
# Clone the repo
git clone https://github.com/thetalabs/on-demand-api-mcp
cd on-demand-api-mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
THETA_API_KEY=your-key npm start
```

## Publishing

### 1. Publish to npm

```bash
# Login to npm (if not already)
npm login

# Publish the package
npm publish --access public
```

The package will be available as `@thetalabs/on-demand-api-mcp` on npm.

### 2. Register with MCP Registry

The [MCP Registry](https://registry.modelcontextprotocol.io) is the official directory for MCP servers. Registering makes the server discoverable by MCP-compatible clients.

```bash
# Clone the registry repo
git clone https://github.com/modelcontextprotocol/registry
cd registry

# Build the publisher tool
make publisher

# Publish your server (requires authentication)
./bin/mcp-publisher --help
```

**Namespace options:**

| Namespace Type | Example | Verification |
|----------------|---------|--------------|
| GitHub-based | `io.github.thetalabs/on-demand-api-mcp` | GitHub OAuth |
| Domain-based | `thetaedgecloud.com/on-demand-api-mcp` | DNS or HTTP challenge |

### 3. Automated Publishing (CI/CD)

For GitHub Actions, use GitHub OIDC authentication:

```yaml
# .github/workflows/publish.yml
name: Publish to MCP Registry
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci && npm run build
      - run: npm publish --access public
      # Add MCP registry publishing step here
```

## License

MIT

## Links

- [Theta EdgeCloud](https://www.thetaedgecloud.com)
- [API Documentation](https://docs.thetaedgecloud.com)
- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Registry](https://registry.modelcontextprotocol.io)
