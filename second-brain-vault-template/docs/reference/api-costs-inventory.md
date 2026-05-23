# API Costs Inventory & Pricing Reference

**Last updated**: 2026-05-16  
**Next review**: 2026-06-16  

---

## Quick Cost Summary (per 1000 operations)

| API | Category | Cost/1k ops | Free Tier | Status |
|-----|----------|------------|-----------|--------|
| Apify | Web Scraping | $0.25-5.00 | 50 credits | ✅ |
| Anthropic Claude | LLM | $0.30 (input) | Trial | ✅ |
| GitHub Actions | CI/CD | Free | Yes | ✅ |
| Slack API | Messaging | Free | Yes | ✅ |
| Discord Bot | Messaging | Free | Yes | ✅ |

---

## Web Scraping & Data Extraction

### Apify

| Property | Details |
|----------|---------|
| **Website** | https://apify.com |
| **Purpose** | Web scraping, Instagram, Google Maps, Amazon, LinkedIn, etc |
| **Pricing Model** | Credit-based (pay-as-you-go) |
| **Cost Breakdown** | Depends on actor (bot type) |
| **Instagram Actor** | ~$0.25-0.50 per 1000 profile posts |
| **Google Maps Actor** | ~$1-2 per 1000 searches |
| **Free Tier** | 50 free credits/month (~$5 value) |
| **Rate Limits** | 100-500 requests/min (varies by actor) |
| **Status** | ✅ Active & Reliable |
| **Last Verified** | 2026-05-16 |
| **Notes** | Excellent support, well-maintained, most stable for Instagram |
| **⚠️ Risk** | Low (official actor, stable) |

**Example Usage Cost**:
```
Instagram competitor analysis: 500 profiles × 10 posts = 5000 requests
Cost: (5000 / 1000) × $0.25 = $1.25
```

### Bright Data (formerly Luminati)

| Property | Details |
|----------|---------|
| **Website** | https://brightdata.com |
| **Purpose** | Web scraping, residential proxies, social media data |
| **Pricing Model** | Pay-per-GB proxy traffic |
| **Cost** | $0.50-2.00 per GB |
| **Free Tier** | 100MB free |
| **Status** | ✅ Active |
| **Last Verified** | 2026-05-16 |
| **⚠️ Risk** | Moderate (more expensive than Apify for Instagram) |

### ScraperAPI

| Property | Details |
|----------|---------|
| **Website** | https://www.scraperapi.com |
| **Purpose** | Generic web scraping with proxy rotation |
| **Pricing** | $10-400/month subscription or $0.003/request |
| **Free Tier** | No |
| **Status** | ✅ Active |
| **⚠️ Risk** | Lower cost alternative but less specialized |

---

## AI & Language Models

### Anthropic Claude API

| Property | Details |
|----------|---------|
| **Website** | https://www.anthropic.com/api |
| **Models** | Claude 3.5 Sonnet, Claude 3 Opus, Haiku |
| **Pricing Model** | Per token (input + output) |
| **Input Cost** | $0.003 per 1M tokens |
| **Output Cost** | $0.015 per 1M tokens |
| **Free Tier** | $5 credit trial |
| **Rate Limits** | 100k tokens/min (varies by plan) |
| **Status** | ✅ Active (Latest model) |
| **Last Verified** | 2026-05-16 |
| **Notes** | Best quality, supports 200k token context, prompt caching |
| **⚠️ Cost Driver** | Output tokens (5x more expensive than input) |

**Example Usage Cost**:
```
Analyzing 50 Instagram posts (2000 tokens per analysis)
Input: 50 × 200 tokens = 10k tokens × $0.003/1M = $0.00003
Output: 50 × 1800 tokens = 90k tokens × $0.015/1M = $0.00135
Total: ~$0.001-0.002 per analysis
```

### OpenAI GPT API

| Property | Details |
|----------|---------|
| **Website** | https://openai.com/api |
| **Models** | GPT-4o, GPT-4 Turbo, GPT-3.5 |
| **Pricing Model** | Per token |
| **Input Cost (4o)** | $0.005 per 1M tokens |
| **Output Cost (4o)** | $0.015 per 1M tokens |
| **Status** | ✅ Active |
| **Last Verified** | 2026-05-16 |
| **⚠️ Cost** | More expensive than Claude for same quality |

### Google Gemini API

| Property | Details |
|----------|---------|
| **Website** | https://ai.google.dev |
| **Models** | Gemini 2.0, Gemini 1.5 |
| **Pricing Model** | Per 1M tokens |
| **Input Cost** | $0.075 per 1M tokens |
| **Output Cost** | $0.3 per 1M tokens |
| **Free Tier** | Generous free tier (60 requests/min) |
| **Status** | ✅ Active |
| **⚠️ Cost** | Cheaper for volume but lower quality |

---

## Workflow & Automation

### GitHub Actions

| Property | Details |
|----------|---------|
| **Website** | https://github.com/features/actions |
| **Purpose** | CI/CD, scheduled workflows, automation |
| **Pricing** | Free for public repos; private repos have free minutes |
| **Free Minutes** | 2000 min/month (private), unlimited (public) |
| **Overage** | $0.008 per minute |
| **Status** | ✅ Free (for our use case) |
| **Last Verified** | 2026-05-16 |
| **Notes** | Perfect for scheduled automations, integrates with Claude |

### n8n (Self-hosted or Cloud)

| Property | Details |
|----------|---------|
| **Website** | https://n8n.io |
| **Purpose** | Workflow automation, integration hub |
| **Pricing (Cloud)** | Free tier exists, then $20/month+ |
| **Pricing (Self-hosted)** | Free (you host it) |
| **Status** | ✅ Active |
| **Last Verified** | 2026-05-16 |
| **Notes** | Good for complex workflows; self-host to save money |

---

## Communication & Notifications

### Slack API

| Property | Details |
|----------|---------|
| **Website** | https://api.slack.com |
| **Purpose** | Send messages, post to channels, webhooks |
| **Pricing** | Free for most uses |
| **Status** | ✅ Free |
| **Last Verified** | 2026-05-16 |
| **Notes** | Essential for notifications |

### Discord Bot API

| Property | Details |
|----------|---------|
| **Website** | https://discord.com/developers |
| **Purpose** | Send messages, bot automation |
| **Pricing** | Completely free |
| **Status** | ✅ Free |
| **Last Verified** | 2026-05-16 |
| **Notes** | Best for cost; your Discord server is free |

---

## Cost Calculation Examples

### Scenario 1: Daily Instagram Competitor Analysis

**Automação**: Monitor 5 competitors' Instagram daily, analyze with Claude

```
Daily execution:
- Apify (5 profiles × 10 posts): 50 requests
  Cost: (50/1000) × $0.25 = $0.0125
  
- Claude analysis (5 analyses × 2k tokens input, 1k output):
  Input: (5 × 2000 / 1M) × $0.003 = $0.00003
  Output: (5 × 1000 / 1M) × $0.015 = $0.000075
  Cost: $0.000105
  
- GitHub Actions: Free

DAILY COST: ~$0.013
MONTHLY COST: ~$0.39
ANNUAL COST: ~$4.70

CLIENT PRICING:
With 120% markup: $0.39 × 2.2 = $0.86/month → ~$10/year
```

### Scenario 2: PR Review Bot (GitHub Actions triggered)

```
Per PR (10 prs/month average):
- Claude review (3k tokens input, 2k output):
  Input: (3000/1M) × $0.003 = $0.009
  Output: (2000/1M) × $0.015 = $0.03
  Cost per PR: $0.039
  
- GitHub Actions: Free
- GitHub API: Free

MONTHLY COST: 10 × $0.039 = $0.39
ANNUAL COST: ~$4.70

CLIENT PRICING: $0.39 × 2.2 = $0.86/month
```

### Scenario 3: Content Generation Pipeline

```
Generating 20 posts/month:

- Claude generation (1k input, 3k output per post):
  Input: (20 × 1000 / 1M) × $0.003 = $0.00006
  Output: (20 × 3000 / 1M) × $0.015 = $0.0009
  Cost: $0.00096
  
- Slack notifications: Free
- GitHub Actions: Free

MONTHLY COST: ~$0.01
ANNUAL COST: ~$0.12

CLIENT PRICING: $0.01 × 2.5 = $0.025/month (minimum engagement)
```

---

## Pricing Strategy for Clients

### Markup Recommendations

| Cost Level | Recommended Markup | Reason |
|-----------|------------------|--------|
| < $1/month | 150-200% | Minimum service charge |
| $1-10/month | 100-150% | Cover operations overhead |
| $10-100/month | 75-100% | Moderate markup |
| > $100/month | 50-75% | Higher volume discount |

**Formula**: `Client Price = API Cost × (1 + Markup%)`

### Example Proposal Structure

```markdown
## Automação: Daily Instagram Competitor Analysis

### API Costs (Monthly)
- Apify (Instagram scraper): $1.25
- Claude API (analysis): $0.30
- GitHub Actions: $0
**Total API Cost: $1.55/month**

### Service Pricing
API Cost + 100% markup = $1.55 × 2 = **$3.10/month**
Annual commitment: $3.10 × 12 = **$37.20/year**

### What's included:
- Daily monitoring of 5 competitors
- AI-powered analysis and insights
- Slack/Discord notifications
- Monthly performance report
- Support & adjustments
```

---

## Monitoring & Alerts

### APIs to Review Monthly:
- [ ] Apify pricing (scraping rates change)
- [ ] Claude API pricing (new models may be cheaper)
- [ ] Bright Data (alternative, compare costs)

### When to Migrate:
- If alternative API is 30% cheaper for same functionality
- If current API has reliability issues (2+ downtime incidents/quarter)
- If new API offers significantly better features

---

## Deprecated / Not Recommended

| API | Reason | Alternative |
|-----|--------|-------------|
| Selenium-based scraping | Slow, expensive infrastructure | Apify |
| Puppeteer cloud | Lower quality than Apify | Apify |
| Instagram Graph API (for scraping) | Limited, requires approval | Apify |
| GPT-4 (standard) | More expensive than Claude/4o | Claude Sonnet |

---

## Cost Tracking Template

Use this to track actual vs estimated costs:

```markdown
## Project: [Client Name - Automation Name]

| Period | Estimated | Actual | Variance | Notes |
|--------|-----------|--------|----------|-------|
| Month 1 | $1.55 | $1.52 | -$0.03 | Less API volume |
| Month 2 | $1.55 | $1.68 | +$0.13 | More profiles |
| Month 3 | $1.55 | $1.54 | -$0.01 | Normal |

**Margin**: If charging $3.10/month, actual cost $1.55 avg = 100% margin ✅
```

---

## How to Use This Document

1. **Before proposing automation** → Find APIs in this doc
2. **Estimate monthly cost** → Use examples as reference
3. **Add markup** → Apply 100-150% based on total cost
4. **Track actual usage** → Monitor vs estimate
5. **Update monthly** → Keep prices fresh (first business day)
