# OpenChat

An AI chat application built with [Mastra](https://mastra.ai), [TanStack Start](https://tanstack.com/start), and React 19.

## Features

- Conversational AI assistant with working memory that persists across threads
- Claude models via [Anthropic](https://www.anthropic.com) (switch models on the fly)
- Web search powered by [Exa](https://exa.ai)
- Thread management: create, list, delete, and branch conversations
- Dark/light theme support

## Getting Started

### Prerequisites

- [Bun](https://bun.sh)
- An [Anthropic](https://console.anthropic.com) API key
- An [Exa](https://exa.ai) API key (optional, for web search)

### Setup

```bash
bun install
cp .env.example .env
```

Fill in your API keys in `.env`:

```
ANTHROPIC_API_KEY=your-api-key
EXA_API_KEY=your-exa-api-key
```

### Development

```bash
bun run dev
```

Opens the app at [http://localhost:3000](http://localhost:3000).

### Build

```bash
bun run build
```

### Test

```bash
bun test
```

Smoke test (Playwright, runs against the production build and saves a screenshot of the chat to `test-results/`):

```bash
bunx playwright install chromium   # first run only
bun run build
bun run test:e2e
```

### Lint & Format

```bash
bun run lint
bun run format
bun run check
```

## Tech Stack

- **Framework**: TanStack Start (React 19, TanStack Router, TanStack Query)
- **AI**: Mastra (agents, memory, tools), Vercel AI SDK
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Tooling**: Vite, TypeScript, Bun, Biome, Vitest

## License

[MIT](LICENSE)
