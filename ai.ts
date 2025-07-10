#!/usr/bin/env tsx

import chalk from 'chalk';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

// Configure marked to use terminal renderer
marked.setOptions({
  renderer: new TerminalRenderer({
    code: chalk.yellow,
    blockquote: chalk.gray.italic,
    html: chalk.gray,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow,
    del: chalk.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  }) as any
});

// Keywords that likely indicate a need for web search
const WEB_SEARCH_KEYWORDS = [
  'latest', 'recent', 'current', 'today', 'yesterday', 'news',
  'update', 'price', 'stock', 'weather', 'score', 'result',
  'released', 'announced', 'trending', 'happening', 'now',
  'breaking', '2024', '2025', 'this week', 'this month',
  'real-time', 'live', 'status', 'outage', 'down'
];

// Keywords that indicate informational queries that might benefit from web search
const INFO_KEYWORDS = [
  'what is', 'who is', 'where is', 'when is', 'how to',
  'tell me about', 'explain', 'define', 'information about'
];

// Keywords that indicate no web search needed
const NO_SEARCH_KEYWORDS = [
  'hi', 'hello', 'hey', 'thanks', 'thank you', 'bye', 
  'goodbye', 'please', 'help me write', 'code', 'implement',
  'fix', 'debug', 'create', 'make', 'build'
];

function shouldUseWebSearch(command: string, forceSearch?: boolean, noSearch?: boolean): boolean {
  // Explicit control via flags
  if (forceSearch) return true;
  if (noSearch) return false;
  
  const lowerCommand = command.toLowerCase();
  
  // Check for no-search keywords first
  if (NO_SEARCH_KEYWORDS.some(keyword => lowerCommand.includes(keyword))) {
    // Unless it also contains strong web search indicators
    if (!WEB_SEARCH_KEYWORDS.some(keyword => lowerCommand.includes(keyword))) {
      return false;
    }
  }
  
  // Check for web search keywords
  if (WEB_SEARCH_KEYWORDS.some(keyword => lowerCommand.includes(keyword))) {
    return true;
  }
  
  // Check for informational queries with specific patterns
  if (INFO_KEYWORDS.some(keyword => lowerCommand.startsWith(keyword))) {
    // Only use web search if it seems to be asking about current events or people
    return lowerCommand.match(/\b(company|person|event|place|product)\b/) !== null;
  }
  
  return false;
}

interface Citation {
  url: string;
  title: string;
  content?: string;
}

// Buffer for accumulating markdown content
class MarkdownBuffer {
  private buffer: string = '';
  private inCodeBlock: boolean = false;
  
  append(content: string): string {
    this.buffer += content;
    
    // Try to extract complete markdown elements
    let output = '';
    let lastProcessedIndex = 0;
    
    // Process the buffer character by character
    for (let i = 0; i < this.buffer.length; i++) {
      // Check for code blocks
      if (this.buffer.substring(i).startsWith('```')) {
        if (!this.inCodeBlock) {
          // Starting a code block
          const langMatch = this.buffer.substring(i + 3).match(/^(\w+)?\n/);
          if (langMatch) {
            this.inCodeBlock = true;
            // Output everything before the code block
            if (i > lastProcessedIndex) {
              output += marked(this.buffer.substring(lastProcessedIndex, i));
            }
            lastProcessedIndex = i;
          }
        } else {
          // Check if we're ending the code block
          const endMatch = this.buffer.substring(i + 3).match(/^\n/);
          if (endMatch) {
            // Found the end of code block
            this.inCodeBlock = false;
            const codeContent = this.buffer.substring(lastProcessedIndex, i + 4);
            output += marked(codeContent);
            lastProcessedIndex = i + 4;
            i = i + 3; // Skip past the closing ```
          }
        }
      }
    }
    
    // If we're not in a code block, process complete lines
    if (!this.inCodeBlock) {
      const lines = this.buffer.substring(lastProcessedIndex).split('\n');
      // Process all complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        output += marked(lines[i] + '\n');
      }
      // Keep the last incomplete line in the buffer
      this.buffer = lines[lines.length - 1];
    } else {
      // Keep unprocessed content in buffer
      this.buffer = this.buffer.substring(lastProcessedIndex);
    }
    
    return output;
  }
  
  flush(): string {
    if (this.buffer.length > 0) {
      const output = marked(this.buffer) as string;
      this.buffer = '';
      return output;
    }
    return '';
  }
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Check for flags
  let forceSearch = false;
  let noSearch = false;
  let commandArgs = args;
  
  // Process flags
  if (args.includes('--search') || args.includes('-s')) {
    forceSearch = true;
    commandArgs = args.filter(arg => arg !== '--search' && arg !== '-s');
  }
  
  if (args.includes('--no-search') || args.includes('-n')) {
    noSearch = true;
    commandArgs = args.filter(arg => arg !== '--no-search' && arg !== '-n');
  }
  
  if (commandArgs.length === 0) {
    console.error(chalk.red('Usage: ai.ts [--search|-s] [--no-search|-n] <command>'));
    console.error(chalk.gray('  --search, -s     Force web search'));
    console.error(chalk.gray('  --no-search, -n  Disable web search'));
    process.exit(1);
  }
  
  const command = commandArgs.join(' ');

  // Get API key from environment variable
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('Error: OPENROUTER_API_KEY environment variable not set'));
    process.exit(1);
  }

  // Get model from environment variable or use default
  const model = process.env.AI_MODEL || 'openai/gpt-4.1-mini';
  
  // Determine if we should use web search
  const useWebSearch = shouldUseWebSearch(command, forceSearch, noSearch);
  
  // Modify model name if web search is needed
  const finalModel = useWebSearch && !model.includes(':online') ? `${model}:online` : model;

  // Get system prompt from environment variable
  const systemPrompt = process.env.AI_SYSTEM_PROMPT;
  
  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Build messages array
  const messages: Array<{ role: string; content: string }> = [];
  
  // Always include date in system prompt (date comes first)
  const datePrompt = `Today's date is ${currentDate}.`;
  if (systemPrompt) {
    messages.push({ role: 'system', content: `${datePrompt}\n\n${systemPrompt}` });
  } else {
    messages.push({ role: 'system', content: datePrompt });
  }
  
  messages.push({ role: 'user', content: command });

  // Build request body
  const requestBody: any = {
    model: finalModel,
    messages: messages,
    stream: true,
  };
  
  // Add custom web search configuration if using web search
  if (useWebSearch) {
    const maxResults = process.env.AI_WEB_SEARCH_MAX_RESULTS 
      ? parseInt(process.env.AI_WEB_SEARCH_MAX_RESULTS, 10) 
      : 5;
    
    // Custom search prompt that asks for clean answers without inline citations
    const searchDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    requestBody.plugins = [{
      id: 'web',
      max_results: maxResults,
      search_prompt: `A web search was conducted on ${searchDate}. Use the following web search results to answer the user's question.

IMPORTANT: Do NOT include URLs or citations in your answer. Just provide a clean, natural response based on the information found. The sources will be displayed separately.`
    }];
  }

  try {
    // Debug logging if verbose mode is enabled
    if (process.env.AI_VERBOSE === 'true') {
      console.error(chalk.dim(`[AI] Using model: ${finalModel}`));
      console.error(chalk.dim(`[AI] Web search: ${useWebSearch ? 'enabled' : 'disabled'}`));
      if (useWebSearch) {
        console.error(chalk.dim(`[AI] Max search results: ${process.env.AI_WEB_SEARCH_MAX_RESULTS || '5'}`));
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    const citations: Citation[] = [];
    const markdownBuffer = new MarkdownBuffer();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        while (true) {
          const lineEnd = buffer.indexOf('\n');
          if (lineEnd === -1) break;

          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Flush any remaining markdown
              const remaining = markdownBuffer.flush();
              if (remaining) {
                // Remove trailing newlines from markdown output
                process.stdout.write(remaining.trimEnd());
              }
              
              // Display citations if any were found
              if (citations.length > 0) {
                console.log(chalk.gray('\n\n---\nSources:'));
                citations.forEach((citation, index) => {
                  console.log(chalk.cyan(`[${index + 1}] ${citation.title}`));
                  console.log(chalk.gray(`    ${citation.url}`));
                });
              }
              
              // Always end with a single newline
              console.log();
              
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // Process content through markdown buffer
                const formatted = markdownBuffer.append(content);
                if (formatted) {
                  process.stdout.write(formatted);
                }
                fullContent += content;
              }
              
              // Check for annotations in the response
              const annotations = parsed.choices?.[0]?.delta?.annotations || 
                                parsed.choices?.[0]?.message?.annotations;
              
              if (annotations && Array.isArray(annotations)) {
                annotations.forEach((annotation: any) => {
                  if (annotation.type === 'url_citation' && annotation.url_citation) {
                    const citation = annotation.url_citation;
                    // Check if we already have this URL
                    if (!citations.some(c => c.url === citation.url)) {
                      const newCitation = {
                        url: citation.url,
                        title: citation.title || 'Untitled',
                        content: citation.content
                      };
                      citations.push(newCitation);
                      
                      // Debug: print web search results if verbose mode is on
                      if (process.env.AI_VERBOSE === 'true' && citation.content) {
                        console.error(chalk.dim(`\n[AI] Web search result from ${citation.url}:`));
                        console.error(chalk.dim(`[AI] Title: ${citation.title || 'Untitled'}`));
                        console.error(chalk.dim(`[AI] Content preview: ${citation.content.substring(0, 200)}...`));
                      }
                    }
                  }
                });
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }
    } finally {
      reader.cancel();
    }

  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});