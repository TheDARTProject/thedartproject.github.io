import os
import json
import logging
import discord
from discord.ext import commands
from discord import app_commands
from dotenv import load_dotenv
from cogs.setup import SetupCog
from cogs.monitor import MonitorCog
from cogs.info import InfoCog
from cogs.reset import ResetCog
from cogs.dump import DumpCog
from cogs.rich_presence import RichPresenceCog
from utils.server_utils import add_server_to_config, remove_server_from_config

# Load environment variables
load_dotenv(".env")

# Constants
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")

# Rate limit constants
RATE_LIMIT = 50  # Discord's rate limit is 50 requests per second
SAFE_LIMIT = RATE_LIMIT - 5  # Stay 5 requests below the limit


# Load wordlist from wordlist.json
def load_wordlist():
    config_dir = "config"
    wordlist_file = os.path.join(config_dir, "wordlist.json")
    if os.path.exists(wordlist_file):
        with open(wordlist_file, "r") as file:
            data = json.load(file)
            return data.get("words", [])  # Return the list of words
    return []  # Return an empty list if the file doesn't exist


WORD_LIST = load_wordlist()  # Load the wordlist

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
    await bot.add_cog(SetupCog(bot, WORD_LIST, SAFE_LIMIT))
    await bot.add_cog(MonitorCog(bot, WORD_LIST))
    await bot.add_cog(InfoCog(bot, WORD_LIST))
    await bot.add_cog(RichPresenceCog(bot))
    await bot.add_cog(ResetCog(bot))
    await bot.add_cog(DumpCog(bot))


# Bot event: on_ready
@bot.event
async def on_ready():
    global_logger.info(f"Logged in as {bot.user.name}")
    global_logger.info(
        f"Rate limit: {RATE_LIMIT} requests per second. Safe limit set to: {SAFE_LIMIT} requests per second."
    )
    await load_cogs()
    await bot.tree.sync()  # Sync slash commands
    global_logger.info("Commands synced.")


# Bot event: on_guild_join
@bot.event
async def on_guild_join(guild):
    """
    Event triggered when the bot joins a new server.
    Adds the server to the servers.json configuration file.
    """
    global_logger.info(f"Bot joined server: {guild.name} (ID: {guild.id})")
    add_server_to_config(guild)  # Add the server to the config


# Bot event: on_guild_remove
@bot.event
async def on_guild_remove(guild):
    """
    Event triggered when the bot is kicked or banned from a server.
    Removes the server from the servers.json configuration file.
    """
    global_logger.info(f"Bot removed from server: {guild.name} (ID: {guild.id})")
    remove_server_from_config(guild.id)  # Remove the server from the config


# Run the bot
global_logger.info("Starting bot...")
bot.run(DISCORD_TOKEN)
