"""
VisionAgents.ai Video Agent - Development Version Example

This file shows the code pattern from the official VisionAgents example:
https://github.com/GetStream/Vision-Agents/tree/main/examples/other_examples/gemini_live_realtime

⚠️  THIS CODE REQUIRES THE DEVELOPMENT VERSION OF VISIONAGENTS ⚠️

To use this code:
1. Clone the VisionAgents repository:
   git clone https://github.com/GetStream/Vision-Agents.git

2. Install the development version:
   cd Vision-Agents
   pip install -e ./agents-core
   pip install -e ./plugins/getstream
   pip install -e ./plugins/gemini

3. Copy this file and run it with your environment variables set

For the current PyPI release, use app.py instead.
"""

import logging
from dotenv import load_dotenv

# These imports require the development version
# from vision_agents.core.edge.types import User
# from vision_agents.core.agents import Agent, AgentLauncher
# from vision_agents.core import cli
# from vision_agents.plugins import gemini, getstream

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [call_id=%(call_id)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def create_agent(**kwargs):  # -> Agent:
    """
    Create a VisionAgent with GetStream edge connection and Gemini Realtime LLM.

    The agent can see video streams and respond with voice using Gemini Live.
    """
    # Uncomment when using development version:
    # agent = Agent(
    #     edge=getstream.Edge(),
    #     agent_user=User(
    #         name="VisionAgents Video AI"
    #     ),
    #     instructions="Read @video-agent-instructions.md",
    #     llm=gemini.Realtime(),
    #     processors=[],
    # )
    # return agent
    pass


async def join_call(agent, call_type: str, call_id: str, **kwargs) -> None:
    """
    Join a video call with the agent.

    Args:
        agent: The VisionAgent instance
        call_type: Type of call (e.g., "default", "video")
        call_id: Unique identifier for the call
    """
    # Uncomment when using development version:
    # await agent.create_user()
    # call = await agent.create_call(call_type, call_id)
    #
    # with await agent.join(call):
    #     await agent.llm.simple_response(
    #         text="Describe what you see in the video stream and introduce yourself"
    #     )
    #     await agent.finish()
    pass


if __name__ == "__main__":
    """
    Launch the VisionAgent CLI.

    Usage:
        python video_agent_dev_example.py --call-id my-video-call
    """
    # Uncomment when using development version:
    # cli(AgentLauncher(create_agent=create_agent, join_call=join_call))

    print("\n" + "="*70)
    print("  VisionAgents Development Version Example")
    print("="*70)
    print("\n⚠️  This requires the development version of VisionAgents\n")
    print("To run this example:")
    print("1. Clone https://github.com/GetStream/Vision-Agents")
    print("2. Install the development packages (see file header)")
    print("3. Uncomment the code in this file")
    print("4. Run with: python video_agent_dev_example.py --call-id my-call")
    print("\nFor a working example with PyPI release:")
    print("   uv run python app.py")
    print("="*70 + "\n")
