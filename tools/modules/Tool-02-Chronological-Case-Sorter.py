import json
from datetime import datetime


def log(message):
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    print(f"{timestamp} {message}")


# Load existing data from the JSON file
log("Loading JSON data...")
try:
    with open("../Compromised-Discord-Accounts.json", "r", encoding="utf-8") as file:
        data = json.load(file)
except FileNotFoundError:
    log("JSON file not found. Exiting.")
    exit()

# Convert data into a list of tuples (key, value) and sort by date
log("Sorting cases by date...")
date_count = 0
unknown_dates = 0


def parse_date(account):
    global date_count, unknown_dates
    date_str = account.get("FOUND_ON", "Unknown")
    if date_str == "Unknown":
        unknown_dates += 1
        return datetime.min  # Assign minimum date for unknown values
    try:
        date_count += 1
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        unknown_dates += 1
        return datetime.min


sorted_data = dict(sorted(data.items(), key=lambda item: parse_date(item[1])))

# Print sorting statistics
log(f"Total dates found: {date_count + unknown_dates}")
log(f"Dates sorted: {date_count}")
log(f"Unknown dates: {unknown_dates}")

# Write the sorted data back to the JSON file
log("Saving sorted JSON data...")
with open("../Compromised-Discord-Accounts.json", "w", encoding="utf-8") as file:
    json.dump(sorted_data, file, indent=4, ensure_ascii=False)

log("Sorting complete.")
