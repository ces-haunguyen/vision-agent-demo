"""
VisionAgents.ai Video Agent - CLI Example

NOTE: This example is based on the VisionAgents development version shown in:
https://github.com/GetStream/Vision-Agents/tree/main/examples/other_examples/gemini_live_realtime

The current PyPI release (vision-agents 0.1.13) has a different API structure.
This file demonstrates the intended usage pattern. To run this example with the
development version, clone the VisionAgents repository and install it locally:

    git clone https://github.com/GetStream/Vision-Agents.git
    cd Vision-Agents
    pip install -e ./agents-core
    pip install -e ./plugins/getstream
    pip install -e ./plugins/gemini

For a working example with the current PyPI release, see app.py (Flask web server).
"""

import logging
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def check_requirements():
    """
    Check if required environment variables are set.
    """
    required_vars = ['STREAM_API_KEY', 'STREAM_API_SECRET', 'GOOGLE_API_KEY']
    missing = [var for var in required_vars if not os.getenv(var)]

    if missing:
        logger.error(f"❌ Missing required environment variables: {', '.join(missing)}")
        logger.info("📝 Please copy .env.example to .env and fill in your API keys")
        logger.info("   - STREAM_API_KEY: Get from https://getstream.io/")
        logger.info("   - STREAM_API_SECRET: Get from https://getstream.io/")
        logger.info("   - GOOGLE_API_KEY: Get from https://aistudio.google.com/app/apikey")
        return False

    return True


async def run_example():
    """
    Example placeholder for the VisionAgent.

    This demonstrates the pattern from the official example, but cannot
    run with the current PyPI release.
    """
    logger.info("🤖 VisionAgents Video Agent Example")
    logger.info("")
    logger.info("📌 This example demonstrates the VisionAgents pattern from:")
    logger.info("   https://github.com/GetStream/Vision-Agents/tree/main/examples/other_examples/gemini_live_realtime")
    logger.info("")
    logger.info("⚠️  The current PyPI release has a different API structure.")
    logger.info("")
    logger.info("To run this example:")
    logger.info("1. Clone the VisionAgents repository")
    logger.info("2. Install the development version locally")
    logger.info("3. Run this script with the required environment variables")
    logger.info("")
    logger.info("For a working example with the current release:")
    logger.info("   uv run python app.py  # Runs Flask web server on http://localhost:4000")
    logger.info("")


if __name__ == "__main__":
    """
    Entry point for the video agent example.

    This demonstrates the intended usage pattern based on the official
    VisionAgents examples, but requires the development version to run.
    """
    print("\n" + "="*70)
    print("  VisionAgents.ai Video Agent - CLI Example")
    print("="*70 + "\n")

    if not check_requirements():
        exit(1)

    asyncio.run(run_example())
