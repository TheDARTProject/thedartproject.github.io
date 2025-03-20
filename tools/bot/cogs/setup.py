import os
import json
import discord
import asyncio
from discord.ext import commands
from discord import app_commands
from discord.ui import Select, View
from utils.logging import configure_server_logging
from utils.config import load_server_settings, save_server_settings
from utils.csv_handler import log_message_to_csv
from datetime import datetime


def save_server_config(guild, selected_channels):
    server_settings = load_server_settings()

    # Check if the server already exists
    server_exists = False
    for server_key, server_data in server_settings.items():
        if server_data["Guild ID"] == guild.id:
            server_exists = True
            # Update the existing server entry
            existing_channels = server_data["Monitored Channels"]
            for channel in selected_channels:
                # Check if the channel is already being monitored
                if not any(c["Channel ID"] == channel.id for c in existing_channels):
                    existing_channels.append(
                        {"Channel ID": channel.id, "Channel Name": channel.name}
                    )
            break

    # If the server doesn't exist, create a new entry
    if not server_exists:
        server_count = len(server_settings)
        new_server_key = f"SERVER_NO_{server_count + 1}"
        server_settings[new_server_key] = {
            "Guild ID": guild.id,
            "Server Name": guild.name,
            "Monitored Channels": [
                {"Channel ID": channel.id, "Channel Name": channel.name}
                for channel in selected_channels
            ],
        }

    # Save the updated server settings
    save_server_settings(server_settings)


class SetupCog(commands.Cog):
    def __init__(self, bot, word_list, safe_limit):
        self.bot = bot
        self.word_list = word_list  # Store WORD_LIST as an instance variable
        self.safe_limit = safe_limit  # Store the safe limit for rate limiting

    @commands.Cog.listener()
    async def on_ready(self):
        print("SetupCog is ready.")

    @app_commands.command(
        name="setup", description="Set up the bot to monitor specific channels."
    )
    async def setup(self, interaction: discord.Interaction):
        logger = configure_server_logging(interaction.guild.id)
        logger.info(
            f"Setup command invoked by {interaction.user.name} (Server: {interaction.guild.name})"
        )
        if interaction.guild is None:
            await interaction.response.send_message(
                "Please set up the bot in a server, not in DMs.", ephemeral=True
            )
            return

        # Create an embed for the setup process
        setup_embed = discord.Embed(
            title="Bot Setup",
            description="Welcome to the bot setup! Please follow the steps below.",
            color=discord.Color.blue(),
        )

        # Header image (Thumbnail)
        setup_embed.set_thumbnail(
            url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Header.png"
        )

        setup_embed.set_author(
            name="CDA Monitor",
            icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Author.png"
        )

        # Step 1: Channel Selection
        setup_embed.add_field(
            name="Step 1: Channel Selection",
            value="Please select the channels you want to monitor from the dropdown below.",
            inline=False,
        )

        # Add a help message
        setup_embed.add_field(
            name="Need Help?",
            value="For additional help, visit [the documentation](https://thatsinewave.github.io/CDA-Project/pages/discord-bot.html) or contact the project's owner <@212020258402205697>.",
            inline=False,
        )

        # Add footer
        setup_embed.set_footer(
            text="Developed by ThatSINEWAVE | CDA Project",
            icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Footer.png",
        )

        # Add Timestamp
        setup_embed.timestamp = datetime.utcnow()

        # Create a dropdown menu for channel selection
        channel_options = [
            discord.SelectOption(label=channel.name, value=str(channel.id))
            for channel in interaction.guild.text_channels
        ]

        # Store selected channels in a class variable
        selected_channels = []

        async def select_callback(select_interaction):
            nonlocal selected_channels
            # Get the selected channel objects
            selected_channels = [
                interaction.guild.get_channel(int(channel_id))
                for channel_id in select_interaction.data["values"]
            ]

            # Update the embed for Step 2: Historical Scan
            step2_embed = discord.Embed(
                title="Bot Setup",
                description="Welcome to the bot setup! Please follow the steps below.",
                color=discord.Color.blue(),
            )

            # Header image
            step2_embed.set_thumbnail(
                url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Header.png"
            )

            step2_embed.set_author(
                name="CDA Monitor",
                icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Author.png"
            )

            step2_embed.add_field(
                name="Step 2: Historical Scan",
                value="Do you want to perform a full historical scan of the selected channels? React with ✅ for yes or ❌ for no.",
                inline=False,
            )

            # Add a help message
            step2_embed.add_field(
                name="Need Help?",
                value="For additional help, visit [the documentation](https://thatsinewave.github.io/CDA-Project/pages/discord-bot.html) or contact the project's owner <@212020258402205697>.",
                inline=False,
            )

            # Add footer
            step2_embed.set_footer(
                text="Developed by ThatSINEWAVE | CDA Project",
                icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Footer.png",
            )

            # Add Timestamp
            step2_embed.timestamp = datetime.utcnow()

            # Create buttons for yes/no
            yes_button = discord.ui.Button(
                label="Yes", style=discord.ButtonStyle.green, custom_id="yes"
            )
            no_button = discord.ui.Button(
                label="No", style=discord.ButtonStyle.red, custom_id="no"
            )

            async def yes_callback(button_interaction):
                for channel in selected_channels:
                    update_embed = discord.Embed(
                        title="Bot Setup",
                        description="Welcome to the bot setup! Please follow the steps below.",
                        color=discord.Color.blue(),
                    )

                    # Header image
                    update_embed.set_thumbnail(
                        url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Header.png"
                    )

                    update_embed.set_author(
                        name="CDA Monitor",
                        icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Author.png"
                    )

                    update_embed.add_field(
                        name="Historical Scan",
                        value=f"Starting historical scan for channel {channel.name}...",
                        inline=False,
                    )

                    update_embed.add_field(
                        name="Need Help?",
                        value="For additional help, visit [the documentation](https://thatsinewave.github.io/CDA-Project/pages/discord-bot.html) or contact the project's owner <@212020258402205697>.",
                        inline=False,
                    )

                    update_embed.set_footer(
                        text="Developed by ThatSINEWAVE | CDA Project",
                        icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Footer.png",
                    )

                    await button_interaction.response.edit_message(
                        embed=update_embed, view=None
                    )
                    await self.historical_scan(channel)

                finish_embed = discord.Embed(
                    title="Bot Setup",
                    description="Welcome to the bot setup! Please follow the steps below.",
                    color=discord.Color.blue(),
                )

                # Header image
                finish_embed.set_thumbnail(
                    url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Header.png"
                )

                finish_embed.set_author(
                    name="CDA Monitor",
                    icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Author.png"
                )

                finish_embed.add_field(
                    name="Setup Complete",
                    value="Monitoring has been set up successfully! The bot will now log messages containing the specified words.",
                    inline=False,
                )

                finish_embed.add_field(
                    name="Need Help?",
                    value="For additional help, visit [the documentation](https://thatsinewave.github.io/CDA-Project/pages/discord-bot.html) or contact the project's owner <@212020258402205697>.",
                    inline=False,
                )

                finish_embed.set_footer(
                    text="Developed by ThatSINEWAVE | CDA Project",
                    icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Footer.png",
                )

                await button_interaction.edit_original_response(embed=finish_embed)

                # Save the server settings
                save_server_config(interaction.guild, selected_channels)
                logger.info(f"Monitoring started for guild: {interaction.guild.name}")

            async def no_callback(button_interaction):
                finish_embed = discord.Embed(
                    title="Bot Setup",
                    description="Welcome to the bot setup! Please follow the steps below.",
                    color=discord.Color.blue(),
                )
                finish_embed.add_field(
                    name="Setup Complete",
                    value="Monitoring has been set up successfully without historical scan! The bot will now log messages containing the specified words.",
                    inline=False,
                )
                await button_interaction.response.edit_message(
                    embed=finish_embed, view=None
                )

                # Save the server settings
                save_server_config(interaction.guild, selected_channels)
                logger.info(
                    f"Monitoring started for guild: {interaction.guild.name} (without historical scan)"
                )

            yes_button.callback = yes_callback
            no_button.callback = no_callback

            step2_view = discord.ui.View()
            step2_view.add_item(yes_button)
            step2_view.add_item(no_button)

            await select_interaction.response.edit_message(
                embed=step2_embed, view=step2_view
            )

        # Create the select menu
        select = discord.ui.Select(
            placeholder="Select channels to monitor...",
            min_values=1,
            max_values=len(channel_options),
            options=channel_options,
        )
        select.callback = select_callback

        setup_view = discord.ui.View()
        setup_view.add_item(select)

        await interaction.response.send_message(
            embed=setup_embed, view=setup_view, ephemeral=True
        )

    async def historical_scan(self, channel):
        logger = configure_server_logging(channel.guild.id)
        logger.info(
            f"Starting historical scan for channel: {channel.name} (Server: {channel.guild.name})"
        )
        async for message in channel.history(limit=None, oldest_first=True):
            if any(word.lower() in message.content.lower() for word in self.word_list):
                log_message_to_csv(message)
            # Sleep to avoid hitting the rate limit
            await asyncio.sleep(1 / self.safe_limit)
        logger.info(
            f"Historical scan completed for channel: {channel.name} (Server: {channel.guild.name})"
        )
