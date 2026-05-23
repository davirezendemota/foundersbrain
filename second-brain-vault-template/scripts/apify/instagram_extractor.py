#!/usr/bin/env python3
"""
Instagram Data Extractor using Apify.

Generic tool to extract and analyze Instagram profiles.
Outputs JSON data to stdout for processing by AI.

Environment variables:
    APIFY_TOKEN: Required. Get from https://console.apify.com

Usage:
    # Single profile
        python instagram_extractor.py -p seu_username

    # Multiple profiles
    python instagram_extractor.py -p profile1 profile2 profile3

    # Custom posts per profile
        python instagram_extractor.py -p seu_username -n 50

    # Full example
    APIFY_TOKEN=xyz python instagram_extractor.py \\
        -p profile1 profile2 profile3 \\
        -n 30

Output:
    JSON data to stdout containing posts, analysis, and trends
"""

import os
import json
import sys
import logging
from datetime import datetime
from typing import Dict, List
import re

try:
    from apify_client import ApifyClient
    import click
except ImportError as e:
    print(f"Error: {e}", file=sys.stderr)
    print("Install with: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

# Configure logging to stderr only (keep stdout clean for JSON output)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)


class InstagramExtractor:
    """Extract and analyze Instagram profile data using Apify."""

    INSTAGRAM_ACTOR_ID = 'shu8hvrXbJbY3Eb9W'

    def __init__(self, api_token: str, profiles: List[str], posts_per_profile: int = 30):
        """Initialize with configuration."""
        self.client = ApifyClient(token=api_token)
        self.profiles = profiles
        self.posts_per_profile = posts_per_profile

        self.results = {
            'timestamp': datetime.now().isoformat(),
            'profiles': {},
            'metadata': {
                'profiles_scanned': 0,
                'posts_extracted': 0,
                'errors': []
            }
        }

    def extract_hashtags(self, caption: str) -> List[str]:
        """Extract hashtags from caption."""
        if not caption:
            return []
        matches = re.findall(r'#[\w]+', caption)
        return [tag.lower() for tag in matches]

    def extract_mentions(self, caption: str) -> List[str]:
        """Extract mentions from caption."""
        if not caption:
            return []
        return re.findall(r'@[\w.]+', caption)

    def extract_profile(self, username: str) -> List[Dict]:
        """Extract posts from an Instagram profile."""
        try:
            logger.info(f"📸 Extracting @{username}...")

            run_input = {
                'resultsType': 'posts',
                'directUrls': [f'https://www.instagram.com/{username}/'],
                'resultsLimit': self.posts_per_profile,
                'addParentData': False,
            }

            run = self.client.actor(self.INSTAGRAM_ACTOR_ID).call(run_input=run_input)

            processed_posts = []
            for item in self.client.dataset(run['defaultDatasetId']).iterate_items():
                processed_post = {
                    'id': item.get('id') or item.get('shortCode'),
                    'caption': item.get('caption', ''),
                    'timestamp': item.get('timestamp') or datetime.now().isoformat(),
                    'likeCount': item.get('likesCount', 0),  # Apify returns likesCount
                    'commentCount': item.get('commentsCount', 0),  # Apify returns commentsCount
                    'mediaType': item.get('type', 'image'),
                    'url': item.get('url', f'https://instagram.com/p/{item.get("shortCode", "")}'),
                    'videoViewCount': item.get('videoViewCount', 0),
                    'hashtags': self.extract_hashtags(item.get('caption', '')),
                    'mentions': self.extract_mentions(item.get('caption', '')),
                    'topComments': [
                        {
                            'username': c.get('ownerUsername'),
                            'text': c.get('text'),
                            'likes': c.get('likesCount', 0),
                        }
                        for c in item.get('latestComments', [])[:2]  # Top 2 comments
                    ]
                }
                processed_posts.append(processed_post)

            logger.info(f"✅ Got {len(processed_posts)} posts from @{username}")

            self.results['profiles'][username] = processed_posts
            self.results['metadata']['posts_extracted'] += len(processed_posts)
            self.results['metadata']['profiles_scanned'] += 1

            return processed_posts

        except Exception as error:
            logger.error(f"❌ Error extracting @{username}: {error}")
            self.results['metadata']['errors'].append({
                'username': username,
                'error': str(error)
            })
            return []

    def analyze_performance(self, profiles: Dict) -> Dict:
        """Analyze engagement metrics for profiles."""
        analysis = {}

        for username, posts in profiles.items():
            if not posts:
                continue

            total_likes = sum(p.get('likeCount', 0) for p in posts)
            total_comments = sum(p.get('commentCount', 0) for p in posts)

            avg_likes = total_likes / len(posts) if posts else 0
            avg_comments = total_comments / len(posts) if posts else 0

            most_popular = max(
                posts,
                key=lambda p: p.get('likeCount', 0) + p.get('commentCount', 0),
                default={}
            )

            all_hashtags = []
            for post in posts:
                all_hashtags.extend(post.get('hashtags', []))

            hashtag_freq = {}
            for tag in all_hashtags:
                hashtag_freq[tag] = hashtag_freq.get(tag, 0) + 1

            top_hashtags = sorted(
                hashtag_freq.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]

            analysis[username] = {
                'postsAnalyzed': len(posts),
                'totalLikes': total_likes,
                'totalComments': total_comments,
                'avgLikesPerPost': round(avg_likes, 2),
                'avgCommentsPerPost': round(avg_comments, 2),
                'engagementRate': round(avg_likes + avg_comments, 2),
                'mostPopularPost': {
                    'caption': most_popular.get('caption', '')[:100] if most_popular else '',
                    'likes': most_popular.get('likeCount', 0) if most_popular else 0,
                    'comments': most_popular.get('commentCount', 0) if most_popular else 0,
                    'url': most_popular.get('url', '') if most_popular else ''
                },
                'topHashtags': [{'tag': tag, 'count': count} for tag, count in top_hashtags]
            }

        return analysis

    def analyze_trends(self) -> Dict:
        """Analyze trending hashtags across all profiles."""
        all_posts = [
            post for posts in self.results['profiles'].values()
            for post in posts
        ]
        all_hashtags = []

        for post in all_posts:
            all_hashtags.extend(post.get('hashtags', []))

        hashtag_freq = {}
        for tag in all_hashtags:
            hashtag_freq[tag] = hashtag_freq.get(tag, 0) + 1

        trending = sorted(
            hashtag_freq.items(),
            key=lambda x: x[1],
            reverse=True
        )[:20]

        avg_engagement = 0
        if all_posts:
            total_engagement = sum(
                p.get('likeCount', 0) + p.get('commentCount', 0)
                for p in all_posts
            )
            avg_engagement = round(total_engagement / len(all_posts), 2)

        return {
            'trendingHashtags': [{'tag': tag, 'count': count} for tag, count in trending],
            'averageEngagement': avg_engagement,
            'totalPostsAnalyzed': len(all_posts)
        }

    def run(self) -> Dict:
        """Run extraction and return analysis."""
        logger.info(f"🚀 Extracting {len(self.profiles)} profile(s)...\n")

        # Extract all profiles
        for username in self.profiles:
            self.extract_profile(username)

        logger.info("\n📊 Analyzing data...\n")

        # Analyze
        analysis = {
            'timestamp': datetime.now().isoformat(),
            'profileAnalysis': self.analyze_performance(self.results['profiles']),
            'trends': self.analyze_trends(),
        }

        # Combine results and analysis
        output = {
            'extracted_data': self.results,
            'analysis': analysis
        }

        logger.info(f"✅ Extraction complete")
        logger.info(f"Profiles scanned: {self.results['metadata']['profiles_scanned']}")
        logger.info(f"Posts extracted: {self.results['metadata']['posts_extracted']}")

        return output


@click.command()
@click.option(
    '-p', '--profiles',
    multiple=True,
    required=True,
    help='Instagram profile(s) to extract'
)
@click.option(
    '-n', '--posts-per-profile',
    type=int,
    default=30,
    help='Number of posts to extract per profile (default: 30)'
)
def main(profiles, posts_per_profile):
    """Extract Instagram profiles and output JSON data."""
    api_token = os.getenv('APIFY_TOKEN')

    if not api_token:
        click.echo("❌ Error: APIFY_TOKEN environment variable not set", err=True)
        click.echo("Get your token at: https://console.apify.com", err=True)
        sys.exit(1)

    if not profiles:
        click.echo("❌ Error: At least one profile is required (-p profile_name)", err=True)
        sys.exit(1)

    extractor = InstagramExtractor(
        api_token=api_token,
        profiles=list(profiles),
        posts_per_profile=posts_per_profile
    )

    result = extractor.run()

    # Output JSON to stdout
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
