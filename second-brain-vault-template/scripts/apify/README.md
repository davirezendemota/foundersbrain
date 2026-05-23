# Apify Scripts

Generic Instagram data extraction tool using Apify.

Outputs JSON data to stdout for AI processing - no file storage.

Built with **Python** (see [[prefer-python-for-scripts]]).

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Apify Token

1. Go to https://apify.com/signup (create account)
2. Get your API token from: https://console.apify.com/account/integrations/api
3. Save as environment variable or in `.env`

### 3. Configure Environment

```bash
# Create .env file from template
cp .env.example .env

# Edit .env with your token
APIFY_TOKEN=your_token_here
```

## Scripts

### instagram_extractor.py

Generic Instagram extractor that outputs JSON data to stdout.

**Basic usage:**

```bash
# Single profile
python instagram_extractor.py -p seu_username

# Multiple profiles
python instagram_extractor.py -p profile1 profile2 profile3

# Custom posts per profile (default: 30)
python instagram_extractor.py -p profile1 profile2 -n 50
```

**Full example with environment variable:**

```bash
APIFY_TOKEN=xyz python instagram_extractor.py \
    -p profile1 profile2 profile3 \
    -n 30
```

**Options:**

- `-p, --profiles` (required): Instagram profile(s) to extract
- `-n, --posts-per-profile` (default: 30): Posts per profile to extract

**Output:**

Logs go to stderr (informational).
JSON output goes to stdout containing:

```json
{
  "extracted_data": {
    "profiles": {
      "username": [
        {
          "id": "123456",
          "caption": "Post text",
          "timestamp": "2025-01-15T10:30:00",
          "likeCount": 42,
          "commentCount": 5,
          "hashtags": ["#tag1", "#tag2"],
          "mentions": ["@user1"],
          "url": "https://instagram.com/p/..."
        }
      ]
    },
    "metadata": { ... }
  },
  "analysis": {
    "profileAnalysis": {
      "username": {
        "postsAnalyzed": 30,
        "totalLikes": 1260,
        "avgLikesPerPost": 42,
        "engagementRate": 47.5,
        "topHashtags": [...]
      }
    },
    "trends": {
      "trendingHashtags": [...],
      "averageEngagement": 47.5
    }
  }
}
```

## Examples

### Single profile
```bash
python instagram_extractor.py -p seu_username
```

### Multiple profiles for comparison
```bash
python instagram_extractor.py -p profile1 profile2 profile3
```

### Extract more posts
```bash
python instagram_extractor.py -p seu_username -n 100
```

### Pipe to file (optional)
```bash
python instagram_extractor.py -p seu_username > data.json
```

### Use with other tools
```bash
python instagram_extractor.py -p profile1 profile2 | jq '.analysis'
```

## What it does

- Extracts posts from Instagram profiles (via Apify)
- Analyzes engagement metrics (likes, comments, hashtags)
- Identifies hashtag trends and patterns
- Returns all data as JSON to stdout
- Logs informational messages to stderr

## Output Format

**Extracted Data:**
- All posts with captions, engagement metrics, hashtags, mentions, URLs

**Analysis:**
- Per-profile metrics (avg likes, comments, engagement rate)
- Most popular posts and top hashtags per profile
- Trending hashtags across all profiles
- Average engagement rate

## Cost Tracking

Each API call costs credits from your Apify account. Monitor usage at:
- https://console.apify.com/account/usage

Reference: `docs/reference/api-costs-inventory.md`

**Cost estimate:**
- 5 profiles × 30 posts = 150 requests
- Cost: ~$0.04/run (with Apify free tier)

## Integration with Claude/AI

The JSON output is designed for AI processing:

```bash
# Extract data and have AI analyze it
python instagram_extractor.py -p profile1 profile2 | \
  claude -c "Analyze this Instagram data and give insights"
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `ModuleNotFoundError: apify_client` | Run `pip install -r requirements.txt` |
| `APIFY_TOKEN not set` | Set env var: `export APIFY_TOKEN=xxx` or add to `.env` |
| `No module named click` | Run `pip install -r requirements.txt` |
| No output | Check stderr for error messages |
| `Results empty` | Check if profile is public and has posts |
| `Rate limit` | Wait or upgrade Apify plan |

## Next Steps

- [ ] Test locally: `python instagram_extractor.py -p seu_username`
- [ ] Integrate with AI processing pipelines
- [ ] Use with GitHub Actions for scheduled extractions
- [ ] Pipe output to Claude for automated analysis
