import json
import time
import requests
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
DISCORD_RATE_LIMIT = 20  # Max API calls per second

# Ensure log directory and file exist
LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "log.txt")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

def log_message(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_message = f"[{timestamp}] {message}"
    print(formatted_message)
    with open(LOG_FILE, "a", encoding="utf-8") as log_file:
        log_file.write(formatted_message + "\n")
        log_file.flush()
        os.fsync(log_file.fileno())  # Ensure data is written to disk immediately

def get_discord_username(discord_id, bot_token, request_tracker):
    log_message(f"Fetching username for Discord ID: {discord_id}")
    url = f"https://discord.com/api/v10/users/{discord_id}"
    headers = {"Authorization": f"Bot {bot_token}"}

    request_tracker["count"] += 1
    enforce_rate_limit(request_tracker)

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        username = response.json().get("username", "")
        log_message(f"Retrieved username: {username}")
        return username
    elif response.status_code == 401:
        log_message(
            f"ERROR: Unauthorized access for Discord ID {discord_id}. Invalid token or insufficient permissions.")
    return None

def check_discord_invite_status(url, request_tracker, cache):
    if "discord.gg" not in url and "discord.com" not in url:
        return None

    invite_code = url.split("/")[-1]
    if invite_code in cache:
        log_message(f"Using cached status for invite: {invite_code} -> {cache[invite_code]}")
        return cache[invite_code]

    log_message(f"Checking status for Discord invite: {invite_code}")
    api_url = f"https://discord.com/api/v10/invites/{invite_code}"
    headers = {"Authorization": f"Bot {DISCORD_BOT_TOKEN}"}

    request_tracker["count"] += 1
    enforce_rate_limit(request_tracker)

    response = requests.get(api_url, headers=headers)
    status = "ACTIVE" if response.status_code == 200 else "INACTIVE"
    cache[invite_code] = status
    log_message(f"Invite {invite_code} is {status}")
    return status

def enforce_rate_limit(request_tracker):
    elapsed_time = time.perf_counter() - request_tracker["start_time"]
    if request_tracker["count"] >= DISCORD_RATE_LIMIT:
        if elapsed_time < 1:
            log_message("Rate limit reached. Pausing requests...")
            time.sleep(1 - elapsed_time)
        request_tracker["start_time"] = time.perf_counter()
        request_tracker["count"] = 0

def load_json_data(file_path):
    log_message(f"Loading data from {file_path}...")
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)

def save_json(data, filename):
    log_message(f"Saving updated data to {filename}...")
    with open(filename, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

def update_case_numbers(data):
    log_message("Updating case numbers for accounts...")
    sorted_accounts = sorted(data.items(), key=lambda x: int(x[1].get("CASE_NUMBER", "0")))
    updated_data = {f"ACCOUNT_NUMBER_{i + 1}": {**account, "CASE_NUMBER": str(i + 1)} for i, (_, account) in
                    enumerate(sorted_accounts)}
    log_message("Case numbers updated.")
    return updated_data

def process_accounts(data, filename):
    start_time = time.perf_counter()
    log_message(f"Processing {len(data)} accounts...")
    request_tracker = {"count": 0, "start_time": time.perf_counter()}
    invite_cache = {}

    data = update_case_numbers(data)
    save_json(data, filename)

    for account_key, account in data.items():
        log_message(f"Processing account: {account_key}")
        discord_id = account.get("DISCORD_ID")
        surface_url = account.get("SURFACE_URL")
        final_url = account.get("FINAL_URL")

        if discord_id:
            new_username = get_discord_username(discord_id, DISCORD_BOT_TOKEN, request_tracker)
            if new_username and new_username != account.get("USERNAME"):
                log_message(f"Updating username for {discord_id}: {account.get('USERNAME')} -> {new_username}")
                account["USERNAME"] = new_username
            else:
                log_message(f"Username for {discord_id} is already correct. Skipping update.")

        if surface_url:
            account["SURFACE_URL_STATUS"] = check_discord_invite_status(surface_url, request_tracker,
                                                                        invite_cache) or "UNKNOWN"

        if final_url:
            final_status = check_discord_invite_status(final_url, request_tracker, invite_cache)
            account["FINAL_URL_STATUS"] = final_status
            if final_status == "INACTIVE":
                account["SURFACE_URL_STATUS"] = "INACTIVE"

    save_json(data, filename)
    log_message("Finished processing all accounts.")

    total_time = time.perf_counter() - start_time
    log_message(f"Total processing time: {total_time:.2f} seconds.")

def main():
    filename = "Compromised-Discord-Accounts.json"
    if not os.path.exists(filename):
        log_message("ERROR: Data file not found!")
        return

    data = load_json_data(filename)
    if not data:
        log_message("No data to process.")
        return

    process_accounts(data, filename)
    log_message("Processing completed.")

if __name__ == "__main__":
    main()