import discord
from discord.ext import commands
from utils.logging import configure_server_logging
from utils.config import load_server_settings
from utils.csv_handler import log_message_to_csv


class MonitorCog(commands.Cog):
    def __init__(self, bot, word_list):
        self.bot = bot
        self.word_list = word_list  # Store WORD_LIST as an instance variable

    @commands.Cog.listener()
    async def on_ready(self):
        print("MonitorCog is ready.")

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.guild:  # Check if the message is from a guild
            server_settings = load_server_settings()

            # Check if the server is still in the configuration
            server_in_config = any(
                server_data["Guild ID"] == message.guild.id
                for server_data in server_settings.values()
            )

            if not server_in_config:
                return  # Skip monitoring if the server is no longer in the configuration

            logger = configure_server_logging(message.guild.id)
            logger.info(
                f"Message received: {message.content} (Server: {message.guild.name}, Channel: {message.channel.name})"
            )

            for server_key, server_data in server_settings.items():
                if server_data["Guild ID"] == message.guild.id:
                    monitored_channels = [
                        channel["Channel ID"]
                        for channel in server_data["Monitored Channels"]
                    ]
                    if message.channel.id in monitored_channels:
                        if any(
                            word.lower() in message.content.lower()
                            for word in self.word_list
                        ):
                            log_message_to_csv(message)
        await self.bot.process_commands(message)
