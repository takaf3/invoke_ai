# invoke_ai

A TypeScript-based command line tool that uses OpenRouter's API to get AI responses via streaming.

## Features

- 🚀 Stream AI responses in real-time
- 🎯 Configurable AI models via environment variables
- 💬 Custom system prompts support
- ⚡ ZSH widget for natural language commands
- 📦 Easy global installation via npm
- 🔧 No external HTTP dependencies - uses native fetch

## Requirements

- Node.js 18 or higher
- tsx (will be installed automatically by the wrapper script)
- An OpenRouter API key (get one at https://openrouter.ai/)

## Setup

### 1. Get an OpenRouter API Key

Sign up at [OpenRouter](https://openrouter.ai/) and get your API key.

### 2. Set Environment Variable

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):
```bash
export OPENROUTER_API_KEY="your-api-key-here"
```

### 3. Install the Tool

#### Option 1: Install from GitHub (Recommended)
```bash
# Clone the repository
git clone https://github.com/takaf3/invoke_ai.git
cd invoke_ai

# Install dependencies
npm install

# Install globally
npm install -g .

# Now you can use 'ai' from anywhere
ai "What is the weather like?"
```

#### Option 2: Install directly from GitHub via npm
```bash
npm install -g git+https://github.com/takaf3/invoke_ai.git
```

#### Option 3: Local installation
```bash
cd /path/to/invoke_ai
npm install
./ai "Your prompt here"
```

## Usage

Basic usage:
```bash
ai "How do I list files sorted by size?"
```

The command will stream the AI's response directly to stdout.

## Configuration

Environment variables:
- `OPENROUTER_API_KEY` (required): Your OpenRouter API key
- `AI_MODEL` (optional): The model to use (default: `openai/o3`)
- `AI_SYSTEM_PROMPT` (optional): System prompt to prepend to messages

Example with custom model and system prompt:
```bash
export AI_MODEL="openai/gpt-4o"
export AI_SYSTEM_PROMPT="You are a helpful coding assistant."
ai "explain what a python decorator is"
```

## ZSH Widget

A zsh widget is included that automatically intercepts any command starting with a capital letter and sends it to the AI tool.

**Prerequisites**: Make sure `ai` is installed globally first (see installation options above).

To enable the widget, add this to your `~/.zshrc`:
```bash
source /path/to/invoke_ai/ai-widget.zsh
```

After sourcing, you can simply type:
```bash
How do I list files in reverse order by modification time?
```

And it will automatically be converted to:
```bash
ai "How do I list files in reverse order by modification time?"
```

## Security Note

**Never commit your API key!** Always use environment variables:
- Set `OPENROUTER_API_KEY` in your shell profile
- Or use a `.env` file (already in .gitignore)
- Never hardcode API keys in the source code

## Uninstall

To uninstall:
```bash
npm uninstall -g invoke-ai
```

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)