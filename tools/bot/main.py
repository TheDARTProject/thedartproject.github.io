import os
import json
import logging
import discord
from discord.ext import commands
from dotenv import load_dotenv
from cogs.setup import SetupCog
from cogs.monitor import MonitorCog
from cogs.info import InfoCog
from cogs.reset import ResetCog
from cogs.dump import DumpCog
from cogs.rich_presence import RichPresenceCog
from utils.server_utils import add_server_to_config, remove_server_from_config
from tools.bot.cogs.announcer import AnnouncerCog
from utils.config import load_server_settings

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
    await bot.add_cog(AnnouncerCog(bot))


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

    # Load server settings and start monitoring configured channels
    server_settings = load_server_settings()
    for server_key, server_data in server_settings.items():
        guild_id = server_data["Guild ID"]
        guild = bot.get_guild(guild_id)
        if guild:
            monitored_channels = server_data.get("Monitored Channels", [])
            if monitored_channels:
                global_logger.info(f"Starting monitoring for guild: {guild.name} (ID: {guild_id})")
                for channel_data in monitored_channels:
                    channel_id = channel_data["Channel ID"]
                    channel = guild.get_channel(channel_id)
                    if channel:
                        global_logger.info(f"Monitoring channel: {channel.name} (ID: {channel_id}) in guild: {guild.name}")
                    else:
                        global_logger.warning(f"Channel ID {channel_id} not found in guild: {guild.name}")
            else:
                global_logger.info(f"No channels configured for monitoring in guild: {guild.name}")


# Bot event: on_guild_join
@bot.event
async def on_guild_join(guild):
    """
    Event triggered when the bot joins a new server.
    Adds the server to the servers.json configuration file.
    """
    global_logger.info(f"Bot joined server: {guild.name} (ID: {guild.id})")

    # Fetch the audit logs to find who added the bot
    inviter_id = None
    try:
        async for entry in guild.audit_logs(action=discord.AuditLogAction.bot_add, limit=1):
            if entry.target.id == bot.user.id:  # Check if the bot was the target
                inviter_id = entry.user.id  # Get the user who added the bot
                global_logger.info(f"Inviter ID found: {inviter_id}")
                break
    except discord.Forbidden:
        global_logger.warning(f"Bot does not have permission to view audit logs in guild: {guild.name}")
    except Exception as e:
        global_logger.error(f"Error fetching audit logs for guild {guild.name}: {e}")

    # Add the server to the config with the inviter's ID
    add_server_to_config(guild, inviter_id)


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
