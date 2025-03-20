import discord
from discord.ext import commands
from discord import app_commands
from utils.config import load_server_settings, save_server_settings
from utils.logging import configure_server_logging
from utils.embed_utils import add_embed_elements  # Import the function


class ResetCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(
        name="reset", description="Reset the bot's configuration for this server."
    )
    async def reset(self, interaction: discord.Interaction):
        # Initialize the logger in the outer scope
        logger = configure_server_logging(interaction.guild.id)
        logger.info(
            f"Reset command invoked by {interaction.user.name} (Server: {interaction.guild.name})"
        )

        # Stage 1: Confirm the user understands the consequences
        stage1_embed = discord.Embed(
            title="Reset Configuration",
            description="This command will reset all configurations made for this server. Monitoring will be stopped until the `/setup` command is run again.",
            color=discord.Color.orange(),
        )

        # Add common elements to the embed using the utility function
        stage1_embed = add_embed_elements(stage1_embed)

        stage1_embed.add_field(
            name="Warning",
            value="Are you sure you want to proceed? This action cannot be undone.",
            inline=False,
        )

        # Create buttons for Stage 1
        understand_button = discord.ui.Button(
            label="I Understand",
            style=discord.ButtonStyle.green,
            custom_id="understand",
        )
        cancel_button = discord.ui.Button(
            label="Cancel", style=discord.ButtonStyle.red, custom_id="cancel"
        )

        async def understand_callback(understand_interaction):
            await understand_interaction.response.defer()

            # Stage 2: Final confirmation before reset
            stage2_embed = discord.Embed(
                title="Reset Configuration",
                description="You are about to reset the configuration for this server. This action is **not reversible**.",
                color=discord.Color.red(),
            )

            # Add common elements to the embed using the utility function
            stage2_embed = add_embed_elements(stage2_embed)

            stage2_embed.add_field(
                name="Final Warning",
                value="Do you want to proceed with the reset?",
                inline=False,
            )

            # Create buttons for Stage 2
            reset_button = discord.ui.Button(
                label="Reset", style=discord.ButtonStyle.danger, custom_id="reset"
            )
            cancel_button_stage2 = discord.ui.Button(
                label="Cancel",
                style=discord.ButtonStyle.secondary,
                custom_id="cancel_stage2",
            )

            async def reset_callback(reset_interaction):
                await reset_interaction.response.defer()

                # Reset the server configuration
                server_settings = load_server_settings()
                for server_key, server_data in server_settings.items():
                    if server_data["Guild ID"] == interaction.guild.id:
                        del server_settings[server_key]
                        break

                save_server_settings(server_settings)

                # Send confirmation message
                finish_embed = discord.Embed(
                    title="Reset Complete",
                    description="The configuration for this server has been reset. Monitoring has been stopped.",
                    color=discord.Color.green(),
                )

                # Add common elements to the embed using the utility function
                finish_embed = add_embed_elements(finish_embed)

                await reset_interaction.edit_original_response(
                    embed=finish_embed, view=None
                )

                # Log that monitoring has stopped for this server
                logger.info(
                    f"Monitoring stopped for guild: {interaction.guild.name}"
                )  # Reuse the outer scope logger

            async def cancel_callback_stage2(cancel_interaction):
                await cancel_interaction.response.defer()
                cancel_embed = discord.Embed(
                    title="Reset Cancelled",
                    description="The reset process has been cancelled.",
                    color=discord.Color.blue(),
                )

                # Add common elements to the embed using the utility function
                cancel_embed = add_embed_elements(cancel_embed)

                await cancel_interaction.edit_original_response(
                    embed=cancel_embed, view=None
                )
                logger.info(
                    f"Reset cancelled for guild: {interaction.guild.name}"
                )  # Reuse the outer scope logger

            reset_button.callback = reset_callback
            cancel_button_stage2.callback = cancel_callback_stage2

            stage2_view = discord.ui.View()
            stage2_view.add_item(reset_button)
            stage2_view.add_item(cancel_button_stage2)

            await understand_interaction.edit_original_response(
                embed=stage2_embed, view=stage2_view
            )

        async def cancel_callback(cancel_interaction):
            await cancel_interaction.response.defer()
            cancel_embed = discord.Embed(
                title="Reset Cancelled",
                description="The reset process has been cancelled.",
                color=discord.Color.blue(),
            )

            # Add common elements to the embed using the utility function
            cancel_embed = add_embed_elements(cancel_embed)

            await cancel_interaction.edit_original_response(
                embed=cancel_embed, view=None
            )
            logger.info(
                f"Reset cancelled for guild: {interaction.guild.name}"
            )  # Reuse the outer scope logger

        understand_button.callback = understand_callback
        cancel_button.callback = cancel_callback

        stage1_view = discord.ui.View()
        stage1_view.add_item(understand_button)
        stage1_view.add_item(cancel_button)

        await interaction.response.send_message(
            embed=stage1_embed, view=stage1_view, ephemeral=True
        )
