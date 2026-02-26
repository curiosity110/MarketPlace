# OpenAI Integration Guide

This marketplace now includes OpenAI GPT-4 integration for AI-powered features.

## Setup

### 1. Get Your OpenAI API Key

1. Visit [platform.openai.com/api/keys](https://platform.openai.com/api/keys)
2. Sign in with your OpenAI account (or create one - ChatGPT Plus subscribers can use the same account)
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)

### 2. Add to Environment

Add to your `.env` file:

```bash
OPENAI_API_KEY=sk-your-key-here
```

For deployments (Vercel, etc.), add `OPENAI_API_KEY` as an environment variable in your provider's dashboard.

## Usage

### From Server Components/Routes

```typescript
// src/app/api/some-route/route.ts
import { askGPT } from "@/lib/openai";

export async function POST(request: Request) {
  const { question } = await request.json();
  const answer = await askGPT(question);
  return Response.json({ answer });
}
```

### From Client Components

```typescript
"use client";

import { useAIChat } from "@/lib/hooks/useAIChat";

export function MyComponent() {
  const { ask, loading, error } = useAIChat({
    systemContext: "You help users describe products for a marketplace",
  });

  async function handleAsk() {
    try {
      const response = await ask("Help me write a product description for...");
      console.log(response);
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  return (
    <button onClick={handleAsk} disabled={loading}>
      {loading ? "Thinking..." : "Ask AI"}
    </button>
  );
}
```

## API Endpoint

**POST** `/api/ai/chat`

Request body:

```json
{
  "question": "Your question here",
  "systemContext": "Optional: Custom system instruction"
}
```

Response:

```json
{
  "answer": "AI response here"
}
```

## Use Cases for Your Marketplace

- **Product Description Generation**: Help sellers write better listings
- **Price Suggestion**: Analyze category and condition to suggest prices
- **Category Suggestion**: Auto-suggest categories based on product description
- **Search Assistance**: Help buyers find products with natural language
- **Content Moderation**: Flag suspicious or inappropriate listings
- **Customer Support**: Auto-reply to common questions

## Streaming Response (Advanced)

For longer responses, use streaming:

```typescript
import { streamGPT } from "@/lib/openai";

const stream = await streamGPT("Your prompt");
for await (const chunk of stream) {
  console.log(chunk.choices[0]?.delta?.content);
}
```

## Models Available

Current: `gpt-4o-mini` (fast, cost-effective)

Alternatives:

- `gpt-4` (more capable, higher cost)
- `gpt-4-turbo` (good balance)

Change the model in `src/lib/openai.ts` in the `askGPT` function.

## Pricing

- **gpt-4o-mini**: ~$0.00015 per 1K input tokens, ~$0.0006 per 1K output tokens
- Visit [openai.com/pricing](https://openai.com/pricing) for current rates

## Troubleshooting

- **"OPENAI_API_KEY not set"**: Add the key to `.env`
- **Rate limit errors**: Implement backoff/retry logic (we recommend exponential backoff)
- **Invalid API key**: Verify the key is correct at platform.openai.com

## Security

- ✅ Never commit API keys to git
- ✅ Keep keys in `.env` (already in `.gitignore`)
- ✅ Use environment variables in production
- ✅ Consider rate limiting to prevent abuse
- ✅ Monitor API usage for unexpected costs

---

Ready to implement AI features! Start with `useAIChat` hook in any client component.
