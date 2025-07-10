# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based command-line AI tool that interfaces with the OpenRouter API to provide streaming AI responses. The project includes a unique ZSH widget that intercepts commands starting with capital letters.

## Development Commands

### Running the AI Tool
```bash
# Basic usage
./ai "your prompt here"

# Or directly with tsx
tsx ai.ts "your prompt here"
```

### Installing Dependencies
```bash
npm install
```

### Making Scripts Executable
```bash
chmod +x ai ai.ts ai-widget.zsh
```

## Architecture

The project consists of three main components:

1. **ai.ts** - Core TypeScript application that:
   - Handles command-line arguments
   - Makes streaming requests to OpenRouter API
   - Processes Server-Sent Events (SSE) for real-time output
   - Uses native fetch API (no external HTTP libraries)

2. **ai** - Bash wrapper that:
   - Auto-installs tsx if not present
   - Executes ai.ts with proper context

3. **ai-widget.zsh** - ZSH integration that:
   - Intercepts terminal commands starting with capital letters
   - Automatically routes them to the AI tool
   - Enables natural language queries in the shell

## Environment Configuration

Required environment variables:
- `OPENROUTER_API_KEY` - API key for OpenRouter service

Optional environment variables:
- `AI_MODEL` - AI model to use (default: "openai/o3")
- `AI_SYSTEM_PROMPT` - System prompt to prepend to messages
- `AI_WEB_SEARCH_MAX_RESULTS` - Maximum web search results (default: 5, range: 1-10)
- `AI_VERBOSE` - Enable debug logging when set to "true"

## Key Implementation Details

### Streaming Response Handling
The application processes streaming responses using:
- TextDecoder for chunk processing
- Buffer management for incomplete SSE lines
- JSON parsing of data events
- Proper cleanup with reader.cancel()

### Web Search Integration
The tool includes intelligent web search detection:
- Automatically detects queries needing current information
- Keywords-based detection with three categories:
  - Web search triggers: "latest", "news", "current", "price", etc.
  - No-search keywords: "hi", "hello", "code", "implement", etc.
  - Info queries: evaluated based on context
- Manual override with `--search`/`-s` and `--no-search`/`-n` flags
- Appends `:online` to model name when web search is needed
- Configurable max results via `AI_WEB_SEARCH_MAX_RESULTS`

### Error Handling
- Validates required environment variables
- Handles HTTP errors with status codes
- Graceful handling of malformed JSON in SSE stream
- Enhanced error messages include response body for debugging

### Node.js Requirements
- Minimum version: Node.js 18
- Uses native fetch API (available in Node 18+)
- TypeScript execution via tsx

## Common Development Tasks

### Testing Changes
Since there's no test suite, manually test by:
```bash
export OPENROUTER_API_KEY="your-key"
./ai "test prompt"

# Test web search detection
./ai "What's the latest news?"  # Should auto-enable web search
./ai "Hi there"  # Should NOT use web search
./ai --search "Python documentation"  # Force web search
./ai --no-search "Current weather"  # Disable web search

# Test with verbose mode
export AI_VERBOSE=true
./ai "test prompt"  # Will show model and web search status
```

### Adding New Environment Variables
Update these locations when adding new configuration:
1. ai.ts - Add variable reading logic
2. README.md - Document the new variable
3. This file - Update the Environment Configuration section

### Modifying the ZSH Widget
The widget uses pattern matching (`^[A-Z]`) to detect capital letters. To change the trigger pattern, modify the regex in ai-widget.zsh.