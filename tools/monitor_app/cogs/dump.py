import discord
from discord.ext import commands
from discord import app_commands
import os
from utils.logging import configure_server_logging
from utils.embed_utils import add_embed_elements
from utils.decorators import is_inviter


class DumpCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(
        name="dump",
        description="Download a CSV file with all flagged messages for this server.",
    )
    @is_inviter()
    async def dump(self, interaction: discord.Interaction):
        logger = configure_server_logging(interaction.guild.id)
        logger.info(
            f"Dump command invoked by {interaction.user.name} (Server: {interaction.guild.name})"
        )

        # Stage 1: Confirm the user understands the consequences
        stage1_embed = discord.Embed(
            title="Download Flagged Messages",
            description="This command will provide you with a downloadable CSV file containing all the flagged messages for this server.",
            color=discord.Color.blue(),
        )

        # Add common elements to the embed using the utility function
        stage1_embed = add_embed_elements(stage1_embed)

        stage1_embed.add_field(
            name="Warning",
            value="Are you sure you want to proceed? This action will send the CSV file to your DMs.",
            inline=False,
        )

        # Create buttons for Stage 1
        proceed_button = discord.ui.Button(
            label="Proceed",
            style=discord.ButtonStyle.green,
            custom_id="proceed",
        )
        cancel_button = discord.ui.Button(
            label="Cancel", style=discord.ButtonStyle.red, custom_id="cancel"
        )

        async def proceed_callback(proceed_interaction):
            await proceed_interaction.response.defer()

            # Stage 2: Send the CSV file to the user's DMs
            csv_file = os.path.join(
                "data", f"messages_guild_{interaction.guild.id}.csv"
            )
            if os.path.exists(csv_file):
                try:
                    with open(csv_file, "rb") as file:
                        await interaction.user.send(
                            content=f"Here is the CSV file you requested containing all flagged messages for the server **{interaction.guild.name}**:",
                            file=discord.File(file, filename="flagged_messages.csv"),
                        )
                    finish_embed = discord.Embed(
                        title="CSV Sent",
                        description="The CSV file has been sent to your DMs.",
                        color=discord.Color.green(),
                    )
                    finish_embed = add_embed_elements(finish_embed)
                    await proceed_interaction.edit_original_response(
                        embed=finish_embed, view=None
                    )
                    logger.info(
                        f"CSV file sent to {interaction.user.name} for guild: {interaction.guild.name}"
                    )
                except discord.Forbidden:
                    finish_embed = discord.Embed(
                        title="Error",
                        description="I couldn't send you a DM. Please check your privacy settings and try again.",
                        color=discord.Color.red(),
                    )
                    finish_embed = add_embed_elements(finish_embed)
                    await proceed_interaction.edit_original_response(
                        embed=finish_embed, view=None
                    )
                    logger.info(
                        f"Failed to send CSV to {interaction.user.name} for guild: {interaction.guild.name} (DM blocked)"
                    )
            else:
                finish_embed = discord.Embed(
                    title="No Data Found",
                    description="There are no flagged messages for this server.",
                    color=discord.Color.orange(),
                )
                finish_embed = add_embed_elements(finish_embed)
                await proceed_interaction.edit_original_response(
                    embed=finish_embed, view=None
                )
                logger.info(f"No CSV file found for guild: {interaction.guild.name}")

        async def cancel_callback(cancel_interaction):
            await cancel_interaction.response.defer()
            cancel_embed = discord.Embed(
                title="Download Cancelled",
                description="The download process has been cancelled.",
                color=discord.Color.blue(),
            )
            cancel_embed = add_embed_elements(cancel_embed)
            await cancel_interaction.edit_original_response(
                embed=cancel_embed, view=None
            )
            logger.info(f"Download cancelled for guild: {interaction.guild.name}")

        proceed_button.callback = proceed_callback
        cancel_button.callback = cancel_callback

        stage1_view = discord.ui.View()
        stage1_view.add_item(proceed_button)
        stage1_view.add_item(cancel_button)

        await interaction.response.send_message(
            embed=stage1_embed, view=stage1_view, ephemeral=True
        )
