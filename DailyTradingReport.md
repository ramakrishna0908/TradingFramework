# Daily Trading Report: Discord Market Pulse Tab

## Objective

Add a new HTML tab to the existing Daily Trading Report that analyzes messages from selected Discord commentary channels and converts them into trader-relevant market intelligence. The tab should help traders quickly understand sentiment, active tickers, recurring themes, and actionable trade ideas discussed in the chats.

## Data Sources

- `discord_commentary_channel_urls`: list of Discord channel URLs or channel IDs to fetch.
- `commentary_channel_names`: human-readable channel names for display in the report.

Each channel should be processed independently, but the final tab should present an aggregated view plus per-channel source attribution.

## Time Window

- Default window: last 24 hours.
- Support configurable reporting periods if the report runner already supports them.
- Only new messages since the last successful run should be processed when possible.
- Use a per-channel watermark such as last processed message ID or timestamp to avoid duplicate analysis.

### Required bot permissions

- View Channel.
- Read Message History.

### Fetching behavior

- Use `channel.history()` or equivalent paginated history retrieval.
- Fetch messages within the requested time window only.
- Handle pagination correctly.
- Respect Discord rate limits with retry/backoff logic.
- Support empty channels and permission failures gracefully.

### Message scope

Decide explicitly whether to include:

- Plain text messages.
- Replies.
- Edits.
- Embeds.
- Attachments.
- Reactions.

Recommended default: include plain text messages and replies; ignore reactions unless they are separately meaningful in your app.

## Processing Pipeline

Implement the analysis in three stages:

### 1. Ingestion

Fetch messages from each configured channel.
Normalize message text.
Preserve metadata such as:

- channel name
- channel ID
- timestamp
- author
- message URL if available

### 2. Structuring

Before summarization, extract structured facts from the raw messages:

- Sentiment score from -100 to +100.
- Mentioned tickers/assets.
- Key themes and narratives.
- Actionable trade signals.
- Supporting quotes for each major finding.
- Confidence or relevance score where possible.

### 3. Synthesis

Use an LLM to convert the structured facts into a trader-friendly summary that is:

- concise,
- actionable,
- easy to scan,
- explicitly tied to source channels.

## Required Analysis Outputs

For each reporting run, generate:

### Sentiment

- Overall sentiment score: -100 to +100.
- Short explanation of why the score was assigned.
- Optional per-channel sentiment breakdown.

### Tickers / Assets

- List all explicitly mentioned tickers, crypto pairs, and forex pairs.
- Deduplicate symbols.
- Optionally rank by frequency of mention.

### Key Themes

- Top 3 to 5 themes or narratives.
- Each theme should include a short explanation and one supporting quote.

### Actionable Signals

Extract items such as:

- support/resistance levels,
- breakout/breakdown calls,
- unusual volume comments,
- catalysts,
- strategy mentions,
- risk warnings,
- entries/exits discussed in chat.

### Source Attribution

Every item should identify:

- source channel name,
- optional author,
- supporting quote or excerpt.

## Output Format

Create a new tab in the daily report called:

**📊 Discord Market Pulse**

This tab should be generated in the same output format as the rest of the report, preferably HTML.

## Recommended Tab Layout

- Header block
  - reporting period
  - total messages analyzed
  - number of channels analyzed
  - overall sentiment score
- Sentiment gauge
  - color coded from bearish to bullish
  - clearly visible at the top
- Mentioned tickers
  - compact bullet list or chips/tags
  - frequency ranking if available
- Key themes
  - 3 to 5 bullets/cards
  - include supporting quote and source channel
- Actionable signals
  - structured list of trade ideas, levels, or alerts
  - each item should include why it matters
- Optional appendix
  - per-channel breakdown
  - raw message samples
  - confidence notes

## LLM Output Contract

Do not have the LLM generate final HTML directly.

Instead, require the model to return structured JSON like:

```json
{
  "sentiment_score": 42,
  "sentiment_summary": "Moderately bullish due to AI sector rotation and strong breakout chatter.",
  "tickers": [
    {
      "symbol": "AAPL",
      "mentions": 12,
      "channels": ["Crypto-General"],
      "context": "Discussed around earnings support and momentum."
    }
  ],
  "themes": [
    {
      "title": "AI sector rotation",
      "summary": "Traders are rotating into AI names after recent weakness.",
      "source_channel": "Equities-Chat",
      "quote": "..."
    }
  ],
  "signals": [
    {
      "type": "breakout",
      "asset": "NVDA",
      "level": "$900",
      "summary": "Watch for confirmation above resistance.",
      "source_channel": "Tech-Trades",
      "quote": "..."
    }
  ]
}
```

## Implementation Notes

- Use a checkpoint file or database table to store the last processed message ID per channel.
- Keep ingestion and analysis separated so the pipeline is easy to test.
- Make extraction deterministic where possible.
- Use the LLM only for summarization and interpretation, not for basic parsing that can be done reliably with code.

## Output Quality Goals

The final tab must be:

- trader-focused,
- highly scannable,
- source-attributed,
- concise,
- reliable,
- useful at a glance.

## Design Principle

Prioritize signal quality over verbosity. The tab should answer:

- What are traders talking about?
- Which assets matter?
- What are the likely setups or risks?
- What is the overall bias?

  ***

  How it works end-to-end:
  1. Monitor captures commentary — when a message arrives from any URL in discord_commentary_channel_urls, it's saved to the commentary_messages DB table silently (no trading logic runs)
  2. Market Pulse page — visit http://localhost:8080/pulse (linked from the summary page as "📊 Market Pulse")
  - Shows today's cached result instantly (no API call)
  - If no cache exists, shows a "Generate Now" button
  - Clicking "↻ Regenerate" calls the LLM if the last run was >60 min ago, otherwise shows the cooldown timer
  3. API usage — one Haiku call per day maximum, ~$0.01–0.02. Capped at 300 messages / 15,000 chars per call
  4. To enable — add ANTHROPIC_API_KEY=sk-ant-... as an environment variable when running the Docker container. Commentary channel URLs and names are already in your config.
