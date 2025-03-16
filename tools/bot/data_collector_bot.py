import discord
from discord import app_commands
from discord.ext import commands
import re
import pandas as pd
import os
import asyncio
import datetime
import json
from dotenv import load_dotenv

# Load the .env file with the correct path
load_dotenv("../.env")

# Retrieve bot token, client ID, and word list from the .env file
TOKEN = os.getenv("DISCORD_TOKEN")
CLIENT_ID = os.getenv("CLIENT_ID")
# Get the comma-separated word list and split it into a list
WORD_LIST = os.getenv("WORD_LIST", "").split(",")

# Define intents
intents = discord.Intents.default()
intents.messages = True
intents.message_content = True  # Add message content intent for reading message content


# Create the bot
class MessageCollectorBot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix="!", intents=intents)
        self.logging_channels = {}  # Store channels for logging by guild_id

    async def setup_hook(self):
        # Sync commands with Discord
        await self.tree.sync()
        print("Commands synced!")


bot = MessageCollectorBot()

# File to save progress state
PROGRESS_FILE = "scan_progress.json"

# Default scan settings
DEFAULT_BATCH_SIZE = 100
DEFAULT_COOLDOWN = 10  # seconds


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

    # Log the loaded word list
    print(f"Monitoring for the following words: {', '.join(WORD_LIST)}")

    # Generate invite URL with proper permissions, now using CLIENT_ID from .env
    invite_url = f"https://discord.com/api/oauth2/authorize?client_id={CLIENT_ID}&permissions=66560&scope=bot%20applications.commands"

    # Print the invite URL for the bot
    print(f"Invite your bot using this URL: {invite_url}")


@bot.event
async def on_message(message):
    # Ignore messages from the bot itself
    if message.author == bot.user:
        return

    # Check if the message contains any of the words from the word list
    content_to_check = message.content.lower()
    has_target_word = any(
        word.lower() in content_to_check for word in WORD_LIST if word
    )

    # Then check embeds if no match in content
    if not has_target_word and message.embeds:
        for embed in message.embeds:
            # Check embed title
            if embed.title and any(
                word.lower() in embed.title.lower() for word in WORD_LIST if word
            ):
                has_target_word = True
                break

            # Check embed description
            if embed.description and any(
                word.lower() in embed.description.lower() for word in WORD_LIST if word
            ):
                has_target_word = True
                break

            # Check embed fields
            for field in embed.fields:
                if any(
                    word.lower() in field.name.lower() for word in WORD_LIST if word
                ) or any(
                    word.lower() in field.value.lower() for word in WORD_LIST if word
                ):
                    has_target_word = True
                    break

    # Process if target word was found anywhere
    if has_target_word:
        # Get basic information
        guild_id = message.guild.id if message.guild else None

        # Check if we're currently logging messages in this guild
        if guild_id in bot.logging_channels:
            log_channel_id = bot.logging_channels[guild_id]
            log_channel = bot.get_channel(log_channel_id)

            if log_channel:
                # Prepare a simple log message with available information
                try:
                    # Extract whatever information we can from the message
                    matched_words = [
                        word
                        for word in WORD_LIST
                        if word.lower() in content_to_check.lower()
                    ]

                    # If content is empty, but we have embeds, get information from embeds
                    if not message.content and message.embeds:
                        embed = message.embeds[0]
                        embed_content = []
                        if embed.title:
                            embed_content.append(embed.title)
                        if embed.description:
                            embed_content.append(embed.description)
                        for field in embed.fields:
                            embed_content.append(f"{field.name}: {field.value}")

                        combined_content = "\n".join(embed_content)
                        matched_words = [
                            word
                            for word in WORD_LIST
                            if word.lower() in combined_content.lower()
                        ]

                    await log_channel.send(
                        f"**Filtered Message Detected**\n"
                        f"**Channel:** {message.channel.mention}\n"
                        f"**Author:** {message.author.mention} ({message.author.name})\n"
                        f"**Matched Words:** {', '.join(matched_words)}\n"
                        f"**Message Content:** {message.content or 'Embedded content'}\n"
                        f"**Detection Time:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    )
                except discord.HTTPException as e:
                    print(f"Error sending log message: {e}")

    # Process commands
    await bot.process_commands(message)


def save_progress(channel_id, last_message_id, matched_messages):
    """Save the current scan progress to a file"""
    progress = {
        "channel_id": channel_id,
        "last_message_id": last_message_id,
        "timestamp": datetime.datetime.now().isoformat(),
        "matched_messages_count": len(matched_messages),
    }

    # Save the matched messages separately to avoid the file getting too large
    df = pd.DataFrame(matched_messages)
    df.to_csv(
        "matched_messages_partial.csv",
        index=False,
        mode="a",
        header=not os.path.exists("matched_messages_partial.csv"),
    )

    # Save the progress state
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f)


def load_progress():
    """Load the last scan progress if available"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return None
    return None


# Hybrid command for collect_messages (works with both / and ! prefix)
@bot.hybrid_command(
    name="collect_messages",
    description="Collects messages containing words from the word list",
)
@app_commands.describe(
    batch_size="Number of messages to fetch in each batch (default: 100)",
    cooldown="Seconds to wait between batches to avoid rate limits (default: 10)",
)
async def collect_messages(
    ctx, batch_size: int = DEFAULT_BATCH_SIZE, cooldown: int = DEFAULT_COOLDOWN
):
    """
    Collects messages containing words from the word list.

    Parameters:
    - batch_size: Number of messages to fetch in each batch (default: 100)
    - cooldown: Seconds to wait between batches to avoid rate limits (default: 10)
    """
    channel = ctx.channel
    progress = load_progress()
    matched_messages = []

    # Status message that will be updated
    status_message = await ctx.send(
        f"Starting message collection for words: {', '.join(WORD_LIST)}..."
    )

    # Recover any progress from a previous scan
    before_message = None
    if progress and progress["channel_id"] == channel.id:
        try:
            before_message = await channel.fetch_message(progress["last_message_id"])
            await status_message.edit(
                content=f"Resuming scan from message ID: {before_message.id}"
            )

            # Load existing matched messages
            if os.path.exists("../matched_messages_partial.csv"):
                existing_df = pd.read_csv("../matched_messages_partial.csv")
                matched_messages = existing_df.to_dict("records")
        except discord.NotFound:
            await status_message.edit(
                content="Could not find the previous message. Starting a new scan."
            )
            before_message = None

    total_processed = 0
    scanned_everything = False

    try:
        while not scanned_everything:
            try:
                # Fetch a batch of messages
                message_batch = []
                if before_message:
                    history = channel.history(limit=batch_size, before=before_message)
                else:
                    history = channel.history(limit=batch_size)

                # Manually collect messages from the async iterator
                async for message in history:
                    message_batch.append(message)

                # If we got fewer messages than requested, we've reached the end
                if len(message_batch) < batch_size:
                    scanned_everything = True

                if not message_batch:
                    break  # No more messages to process

                # Process the batch
                for message in message_batch:
                    # Check message content first
                    content_to_check = message.content.lower()
                    has_target_word = any(
                        word.lower() in content_to_check for word in WORD_LIST if word
                    )
                    matched_word_list = []
                    embed_content = ""

                    # Find which words matched
                    if has_target_word:
                        matched_word_list = [
                            word
                            for word in WORD_LIST
                            if word and word.lower() in content_to_check
                        ]

                    # Then check embeds if no match in content
                    if not has_target_word and message.embeds:
                        for embed in message.embeds:
                            embed_texts = []

                            # Check embed title
                            if embed.title:
                                embed_texts.append(embed.title)

                            # Check embed description
                            if embed.description:
                                embed_texts.append(embed.description)

                            # Check embed fields
                            for field in embed.fields:
                                embed_texts.append(field.name)
                                embed_texts.append(field.value)

                            # Combine all embed texts for checking
                            combined_embed_text = " ".join(embed_texts).lower()

                            # Check if any word matches
                            for word in WORD_LIST:
                                if word and word.lower() in combined_embed_text:
                                    has_target_word = True
                                    matched_word_list.append(word)

                            if has_target_word:
                                embed_content = "\n".join(embed_texts)
                                break

                    # Process if target text was found anywhere
                    if has_target_word:
                        # Use message content or embed content
                        content = message.content or embed_content

                        # Get attachment info if any
                        attachment_info = ""
                        if message.attachments:
                            attachment_urls = [
                                attachment.url for attachment in message.attachments
                            ]
                            attachment_info = ", ".join(attachment_urls)

                        matched_messages.append(
                            {
                                "Author": message.author.name,
                                "Author ID": message.author.id,
                                "Channel": message.channel.name,
                                "Channel ID": message.channel.id,
                                "Guild": message.guild.name if message.guild else "DM",
                                "Guild ID": message.guild.id if message.guild else None,
                                "Message ID": message.id,
                                "Message Content": content,
                                "Matched Words": ", ".join(matched_word_list),
                                "Attachment Info": attachment_info,
                                "Timestamp": message.created_at.isoformat(),
                            }
                        )

                # Update the before_message for the next batch
                before_message = message_batch[-1]
                total_processed += len(message_batch)

                # Save progress
                save_progress(channel.id, before_message.id, matched_messages)

                # Update status
                await status_message.edit(
                    content=f"Processed {total_processed} messages, found {len(matched_messages)} matches. Last message date: {before_message.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
                )

                # Cooldown to avoid rate limits
                await asyncio.sleep(cooldown)

            except discord.errors.HTTPException as e:
                if e.status == 429:  # Rate limited
                    retry_after = (
                        e.retry_after if hasattr(e, "retry_after") else cooldown * 5
                    )
                    await status_message.edit(
                        content=f"Rate limited! Cooling down for {retry_after} seconds. Will resume after cooldown."
                    )
                    await asyncio.sleep(retry_after)
                else:
                    await status_message.edit(
                        content=f"HTTP Error: {str(e)}. Pausing for {cooldown * 2} seconds."
                    )
                    await asyncio.sleep(cooldown * 2)

    except Exception as e:
        await status_message.edit(
            content=f"Error during scan: {str(e)}. Progress saved - use !collect_messages to resume."
        )
        raise e

    # When done, save final results
    if matched_messages:
        df = pd.DataFrame(matched_messages)
        df.to_csv("matched_messages.csv", index=False)
        await status_message.edit(
            content=f"✅ Complete! Processed {total_processed} messages, found {len(matched_messages)} matches. Results saved to `matched_messages.csv`."
        )
    else:
        await status_message.edit(
            content=f"✅ Complete! Processed {total_processed} messages, but no matches were found."
        )

    # Clean up the progress file
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)
    if os.path.exists("../matched_messages_partial.csv"):
        os.remove("../matched_messages_partial.csv")


# Hybrid command for scan_status
@bot.hybrid_command(
    name="scan_status", description="Check the status of the current or last scan"
)
async def scan_status(ctx):
    """Check the status of the current or last scan"""
    progress = load_progress()
    if progress:
        channel = bot.get_channel(progress["channel_id"])
        channel_name = channel.name if channel else "Unknown Channel"

        time_diff = datetime.datetime.now() - datetime.datetime.fromisoformat(
            progress["timestamp"]
        )
        hours, remainder = divmod(time_diff.total_seconds(), 3600)
        minutes, seconds = divmod(remainder, 60)

        status = f"**Scan Status**\n"
        status += f"Channel: {channel_name} (ID: {progress['channel_id']})\n"
        status += f"Last message ID: {progress['last_message_id']}\n"
        status += f"Matched messages so far: {progress['matched_messages_count']}\n"
        status += f"Last updated: {progress['timestamp']} ({int(hours)}h {int(minutes)}m {int(seconds)}s ago)"

        await ctx.send(status)
    else:
        await ctx.send("No scan in progress or previous scan data available.")


# Hybrid command for cancel_scan
@bot.hybrid_command(
    name="cancel_scan", description="Cancel an ongoing scan and clean up progress files"
)
async def cancel_scan(ctx):
    """Cancel an ongoing scan and clean up progress files"""
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)
        await ctx.send("Scan canceled and progress data deleted.")
    else:
        await ctx.send("No scan in progress.")


# New command to start logging messages with words from the word list
@bot.hybrid_command(
    name="start_logging",
    description="Start logging messages containing words from the word list in this channel",
)
async def start_logging(ctx):
    """Start logging messages containing words from the word list in this channel"""
    guild_id = ctx.guild.id if ctx.guild else None

    if not guild_id:
        await ctx.send("This command can only be used in a server.")
        return

    # Set the current channel as the logging channel for this guild
    bot.logging_channels[guild_id] = ctx.channel.id

    await ctx.send(
        f"✅ Now logging messages containing the following words in this channel: {', '.join(WORD_LIST)}"
    )


# Command to stop logging messages
@bot.hybrid_command(
    name="stop_logging",
    description="Stop logging messages containing words from the word list",
)
async def stop_logging(ctx):
    """Stop logging messages containing words from the word list"""
    guild_id = ctx.guild.id if ctx.guild else None

    if not guild_id:
        await ctx.send("This command can only be used in a server.")
        return

    if guild_id in bot.logging_channels:
        del bot.logging_channels[guild_id]
        await ctx.send("✅ Stopped logging messages.")
    else:
        await ctx.send("❌ No active logging in this server.")


# Command to list current word list
@bot.hybrid_command(
    name="list_words",
    description="List the words currently being monitored",
)
async def list_words(ctx):
    """List the words currently being monitored"""
    if WORD_LIST and any(WORD_LIST):
        await ctx.send(
            f"Currently monitoring for the following words: {', '.join(WORD_LIST)}"
        )
    else:
        await ctx.send(
            "No words are currently being monitored. Please add words to the WORD_LIST in your .env file."
        )


# Run the bot
bot.run(TOKEN)
