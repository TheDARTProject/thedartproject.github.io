import json
import os
import asyncio
import discord
from discord.ext import commands

# Paths to the announcement files
ANNOUNCEMENT_MD = "config/announcement.md"  # Update this path if needed
ANNOUNCEMENT_JSON = "config/announcement.json"  # Update this path if needed
SERVERS_JSON = "config/servers.json"


class AnnouncerCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.bot.loop.create_task(self.check_announcement())

    def read_announcement_md(self):
        """
        Reads the announcement.md file and extracts the content (excluding YAML front matter).
        """
        with open(ANNOUNCEMENT_MD, "r", encoding="utf-8") as file:
            content = file.read().split("---", 2)  # Split by YAML front matter
            if len(content) > 2:
                return content[2].strip()  # Return the content after the YAML
            return content[0].strip()  # If no YAML, return the entire content

    def read_announcement_json(self):
        """
        Reads the announcement.json file and returns the date, time, and timezone.
        """
        if not os.path.exists(ANNOUNCEMENT_JSON):
            # If the file doesn't exist, create it with default values
            default_data = {"date": "1970-01-01", "time": "00:00", "timezone": "UTC"}
            with open(ANNOUNCEMENT_JSON, "w", encoding="utf-8") as file:
                json.dump(default_data, file, indent=4)
            return default_data["date"], default_data["time"], default_data["timezone"]

        with open(ANNOUNCEMENT_JSON, "r", encoding="utf-8") as file:
            data = json.load(file)
            return data.get("date"), data.get("time"), data.get("timezone")

    def read_servers_json(self):
        """
        Reads the servers.json file and returns a list of inviter IDs.
        """
        with open(SERVERS_JSON, "r", encoding="utf-8") as file:
            servers = json.load(file)
            return [
                server_data.get("Inviter ID")
                for server_data in servers.values()
                if server_data.get("Inviter ID")
            ]

    async def send_announcement_to_inviters(self, content, inviter_ids):
        """
        Sends the announcement content to all inviters via DMs.
        """
        for inviter_id in inviter_ids:
            try:
                user = await self.bot.fetch_user(inviter_id)
                await user.send(content)
                print(f"Sent announcement to inviter: {user.name} (ID: {inviter_id})")
            except discord.Forbidden:
                print(
                    f"Could not send DM to inviter (ID: {inviter_id}). User has DMs disabled."
                )
            except discord.NotFound:
                print(f"Inviter (ID: {inviter_id}) not found.")
            except Exception as e:
                print(f"Failed to send announcement to inviter (ID: {inviter_id}): {e}")

    async def check_announcement(self):
        """
        Checks if the announcement.md date or time is different from announcement.json.
        If different, sends the announcement to all inviters and updates the JSON file.
        """
        await self.bot.wait_until_ready()

        while not self.bot.is_closed():
            try:
                # Read the announcement files
                md_date, md_time, md_timezone = self.read_announcement_md_yaml()
                json_date, json_time, json_timezone = self.read_announcement_json()

                # Compare date and time
                if md_date != json_date or md_time != json_time:
                    print(
                        "Announcement date or time has changed. Sending updates to inviters..."
                    )
                    content = self.read_announcement_md()
                    inviter_ids = self.read_servers_json()
                    await self.send_announcement_to_inviters(content, inviter_ids)

                    # Update the announcement.json with the new date and time
                    with open(ANNOUNCEMENT_JSON, "w", encoding="utf-8") as file:
                        json.dump(
                            {"date": md_date, "time": md_time, "timezone": md_timezone},
                            file,
                            indent=4,
                        )
                    print("Updated announcement.json with the new date and time.")
                else:
                    print(
                        "Announcement date and time are the same. No updates to send."
                    )

            except FileNotFoundError as e:
                print(f"Error: {e}. Ensure the file exists at the correct path.")
            except Exception as e:
                print(f"An error occurred: {e}")

            # Wait 5 minutes before checking again
            await asyncio.sleep(10)  # 300 seconds = 5 minutes

    def read_announcement_md_yaml(self):
        """
        Reads the YAML front matter from announcement.md and extracts the date, time, and timezone.
        """
        with open(ANNOUNCEMENT_MD, "r", encoding="utf-8") as file:
            content = file.read().split("---", 2)  # Split by YAML front matter
            if len(content) > 1:
                yaml_content = content[1].strip()
                yaml_lines = yaml_content.split("\n")
                yaml_data = {}
                for line in yaml_lines:
                    if ":" in line:
                        key, value = line.split(":", 1)
                        yaml_data[key.strip()] = value.strip().strip('"')
                return (
                    yaml_data.get("date"),
                    yaml_data.get("time"),
                    yaml_data.get("timezone"),
                )
            return None, None, None


async def setup(bot):
    await bot.add_cog(AnnouncerCog(bot))
