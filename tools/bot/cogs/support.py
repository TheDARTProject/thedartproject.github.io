import discord
from discord.ext import commands
from discord import app_commands
from utils.embed_utils import add_embed_elements
from utils.config import load_owner_id
from utils.decorators import is_inviter  # Import the decorator


class SupportCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(
        name="support", description="Send a support request to the bot's developer."
    )
    @is_inviter()  # Apply the decorator
    async def support(self, interaction: discord.Interaction):
        # Stage 1: Confirm the user wants to send a support request
        stage1_embed = discord.Embed(
            title="Support Request",
            description="This command will send a support request to the bot's developer. Are you sure you want to proceed?",
            color=discord.Color.blue(),
        )

        # Add common elements to the embed
        stage1_embed = add_embed_elements(stage1_embed)

        # Create buttons for Stage 1
        proceed_button = discord.ui.Button(
            label="Proceed",
            style=discord.ButtonStyle.green,
            custom_id="proceed",
        )
        cancel_button = discord.ui.Button(
            label="Cancel",
            style=discord.ButtonStyle.red,
            custom_id="cancel",
        )

        async def proceed_callback(proceed_interaction):
            # Stage 2: Ask the user to type their support message
            stage2_embed = discord.Embed(
                title="Support Request",
                description="Please type your support message below. This will be sent directly to the bot's developer.",
                color=discord.Color.blue(),
            )

            # Add common elements to the embed
            stage2_embed = add_embed_elements(stage2_embed)

            # Create a text input for the support message
            support_input = discord.ui.TextInput(
                label="Your Message",
                style=discord.TextStyle.long,
                placeholder="Type your support message here...",
                required=True,
                max_length=1000,
            )

            async def submit_callback(submit_interaction):
                await submit_interaction.response.defer()

                # Get the owner's ID
                owner_id = load_owner_id()
                if not owner_id:
                    await submit_interaction.followup.send(
                        "The bot's developer ID is not configured. Please contact the bot owner.",
                        ephemeral=True,
                    )
                    return

                # Get the owner's user object
                owner = await self.bot.fetch_user(owner_id)
                if not owner:
                    await submit_interaction.followup.send(
                        "The bot's developer could not be contacted. Please try again later.",
                        ephemeral=True,
                    )
                    return

                # Get the bot's permissions in the server
                bot_permissions = interaction.guild.me.guild_permissions
                permissions_list = [perm for perm, value in bot_permissions if value]

                # Send the support message to the owner as a normal message
                message_content = (
                    f"# New Support Request\n"
                    f"**Message:** {support_input.value}\n\n"
                    f"**Server:** {interaction.guild.name} (ID: {interaction.guild.id})\n"
                    f"**User:** {interaction.user.name} (ID: {interaction.user.id})\n"
                    f"**Channel:** {interaction.channel.name} (ID: {interaction.channel.id})\n"
                    f"**Bot Joined Server:** {interaction.guild.me.joined_at.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                    f"**Bot Permissions:** {', '.join(permissions_list)}\n"
                )

                await owner.send(message_content)

                # Confirm to the user that the message was sent
                finish_embed = discord.Embed(
                    title="Support Request Sent",
                    description="Your support request has been sent to the bot's developer. Thank you!",
                    color=discord.Color.green(),
                )

                # Add common elements to the embed
                finish_embed = add_embed_elements(finish_embed)

                await submit_interaction.followup.send(
                    embed=finish_embed, ephemeral=True
                )

            # Create a modal for the support message
            modal = discord.ui.Modal(title="Support Request")
            modal.add_item(support_input)
            modal.on_submit = submit_callback

            # Send the modal immediately without deferring
            await proceed_interaction.response.send_modal(modal)

        async def cancel_callback(cancel_interaction):
            await cancel_interaction.response.defer()
            cancel_embed = discord.Embed(
                title="Support Request Cancelled",
                description="The support request process has been cancelled.",
                color=discord.Color.red(),
            )

            # Add common elements to the embed
            cancel_embed = add_embed_elements(cancel_embed)

            await cancel_interaction.edit_original_response(
                embed=cancel_embed, view=None
            )

        proceed_button.callback = proceed_callback
        cancel_button.callback = cancel_callback

        stage1_view = discord.ui.View()
        stage1_view.add_item(proceed_button)
        stage1_view.add_item(cancel_button)

        await interaction.response.send_message(
            embed=stage1_embed, view=stage1_view, ephemeral=True
        )


async def setup(bot):
    await bot.add_cog(SupportCog(bot))
