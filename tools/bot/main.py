import os
import logging
import discord
from discord.ext import commands
from discord import app_commands
from dotenv import load_dotenv
from cogs.setup import SetupCog
from cogs.monitor import MonitorCog

# Load environment variables
load_dotenv("../.env")

# Constants
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
WORD_LIST = os.getenv("WORD_LIST").split(",")  # Load WORD_LIST from .env

# Initialize bot
intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# Global logger for general bot logs
global_logger = logging.getLogger("global")
global_logger.setLevel(logging.INFO)
global_logger.addHandler(logging.StreamHandler())


# Load cogs
async def load_cogs():
    await bot.add_cog(SetupCog(bot, WORD_LIST))  # Pass WORD_LIST to SetupCog
    await bot.add_cog(MonitorCog(bot, WORD_LIST))  # Pass WORD_LIST to MonitorCog


# Bot event: on_ready
@bot.event
async def on_ready():
    global_logger.info(f"Logged in as {bot.user.name}")
    await load_cogs()
    await bot.tree.sync()  # Sync slash commands
    global_logger.info("Commands synced.")

# Run the bot
global_logger.info("Starting bot...")
bot.run(DISCORD_TOKEN)
