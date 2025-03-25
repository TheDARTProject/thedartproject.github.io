import json
import os
import asyncio
from discord.ext import commands
from discord import Activity, ActivityType
from dotenv import load_dotenv


def get_activity_type(activity_type_str):
    # Map the activity type string to the corresponding ActivityType
    activity_type_map = {
        "playing": ActivityType.playing,
        "listening": ActivityType.listening,
        "watching": ActivityType.watching,
        "streaming": ActivityType.streaming,
    }
    return activity_type_map.get(activity_type_str, ActivityType.playing)


class RichPresenceCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.message_sets = []
        self.current_set_index = 0
        self.timer_interval = 10  # Default interval in seconds
        self.load_presences()

    def load_presences(self):
        config_dir = "config"
        rich_presence_file = os.path.join(config_dir, "rich_presence.json")
        if os.path.exists(rich_presence_file):
            with open(rich_presence_file, "r") as file:
                data = json.load(file)
                self.message_sets = data.get("message_sets", [])
                self.timer_interval = data.get("timer_interval", 10)

    async def update_presence(self):
        while self.message_sets:
            # Get the current message set
            message_set = self.message_sets[self.current_set_index]

            # Build the activity
            activity = Activity(
                name=message_set["details"]["text"]
                if message_set["details"]["enabled"]
                else "",
                state=message_set["state"]["text"]
                if message_set["state"]["enabled"]
                else "",
                type=get_activity_type(message_set["type"]),
            )

            # Update the bot's presence
            await self.bot.change_presence(activity=activity)

            # Move to the next message set
            self.current_set_index = (self.current_set_index + 1) % len(
                self.message_sets
            )

            # Wait for the next update
            await asyncio.sleep(self.timer_interval)

    async def cog_load(self):
        # Start the presence update task when the cog is loaded
        if self.message_sets:
            self.bot.loop.create_task(self.update_presence())

    def cog_unload(self):
        # Clear the bot's presence when the cog is unloaded
        asyncio.create_task(self.bot.change_presence(activity=None))


async def setup(bot):
    await bot.add_cog(RichPresenceCog(bot))
