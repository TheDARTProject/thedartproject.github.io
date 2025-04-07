import openpyxl
import json
from datetime import datetime
from urllib.parse import urlparse
import os


def log(message):
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    print(f"{timestamp} {message}")


def main():
    # File paths
    excel_path = "../ExporterSheet.xlsx"
    json_path = "../Compromised-Discord-Accounts.json"

    # Open the Excel file
    log(f"Loading Excel file from {excel_path}...")
    try:
        workbook = openpyxl.load_workbook(excel_path)
        worksheet = workbook.active
    except Exception as e:
        log(f"Error loading Excel file: {str(e)}")
        return

    # Load existing data from JSON
    log(f"Loading JSON data from {json_path}...")
    try:
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as file:
                data = json.load(file)
        else:
            data = {}
            log("JSON file not found, starting with empty dataset")
    except Exception as e:
        log(f"Error loading JSON file: {str(e)}")
        return

    # Create tracking dictionary {DISCORD_ID: {FOUND_ON_SERVER: account_key}}
    existing_entries = {}
    for account_key, account_data in data.items():
        discord_id = account_data.get("DISCORD_ID", "Unknown")
        found_on_server = account_data.get("FOUND_ON_SERVER", "UNKNOWN")

        if discord_id not in existing_entries:
            existing_entries[discord_id] = {}
        existing_entries[discord_id][found_on_server] = account_key

    # Counters
    json_case_count = len(data)
    excel_case_count = 0
    new_cases = 0
    skipped_cases = 0
    invalid_cases = 0

    # Process Excel rows
    for row_number, row in enumerate(
        worksheet.iter_rows(min_row=2, values_only=True), start=1
    ):
        excel_case_count += 1

        # Unpack row data
        try:
            (
                NOUMBER,
                FOUND_ON,
                FOUND_ON_SERVER,
                DISCORD_ID,
                USERNAME,
                BEHAVIOUR,
                TYPE,
                METHOD,
                TARGET,
                PLATFORM,
                SURFACE_URL,
                REGION,
                STATUS,
            ) = row
        except ValueError as e:
            log(f"Row {row_number} has incorrect number of columns: {str(e)}")
            invalid_cases += 1
            continue

        # Prepare values
        discord_id_str = str(DISCORD_ID) if DISCORD_ID is not None else "Unknown"
        found_on_server_str = (
            str(FOUND_ON_SERVER) if FOUND_ON_SERVER is not None else "UNKNOWN"
        )

        # Skip invalid cases
        if discord_id_str == "Unknown":
            skipped_cases += 1
            continue

        if not any(
            [
                FOUND_ON,
                DISCORD_ID,
                USERNAME,
                BEHAVIOUR,
                TYPE,
                METHOD,
                TARGET,
                PLATFORM,
                SURFACE_URL,
                REGION,
                STATUS,
            ]
        ):
            invalid_cases += 1
            continue

        # Check if case exists
        case_exists = False
        if discord_id_str in existing_entries:
            if found_on_server_str in existing_entries[discord_id_str]:
                case_exists = True

        if case_exists:
            skipped_cases += 1
            continue

        # Add new case
        new_cases += 1
        found_on_str = FOUND_ON.strftime("%Y-%m-%d") if FOUND_ON else "Unknown"
        surface_url_domain = urlparse(SURFACE_URL).netloc if SURFACE_URL else ""
        non_ascii_username = not USERNAME.isascii() if USERNAME else False

        account = {
            "CASE_NUMBER": str(len(data) + 1),
            "FOUND_ON": found_on_str,
            "FOUND_ON_SERVER": found_on_server_str,
            "DISCORD_ID": discord_id_str,
            "USERNAME": USERNAME if USERNAME is not None else "Unknown",
            "ACCOUNT_STATUS": "UNKNOWN",
            "ACCOUNT_TYPE": "UNKNOWN",
            "ACCOUNT_CREATION": "",
            "BEHAVIOUR": BEHAVIOUR if BEHAVIOUR is not None else "Unknown",
            "ATTACK_METHOD": TYPE if TYPE is not None else "Unknown",
            "ATTACK_VECTOR": METHOD if METHOD is not None else "Unknown",
            "ATTACK_GOAL": TARGET if TARGET is not None else "Unknown",
            "ATTACK_SURFACE": PLATFORM if PLATFORM is not None else "Unknown",
            "SUSPECTED_REGION_OF_ORIGIN": REGION if REGION is not None else "Unknown",
            "SURFACE_URL": SURFACE_URL if SURFACE_URL is not None else "Unknown",
            "SURFACE_URL_DOMAIN": surface_url_domain,
            "SURFACE_URL_STATUS": STATUS if STATUS is not None else "Unknown",
            "FINAL_URL": "",
            "FINAL_URL_DOMAIN": "",
            "FINAL_URL_STATUS": "",
            "NON_ASCII_USERNAME": non_ascii_username,
            "LAST_CHECK": datetime.now().isoformat(),
        }

        new_key = f"ACCOUNT_NUMBER_{len(data) + 1}"
        data[new_key] = account

        # Update tracking
        if discord_id_str not in existing_entries:
            existing_entries[discord_id_str] = {}
        existing_entries[discord_id_str][found_on_server_str] = new_key

    # Summary
    log(f"Total cases in JSON before update: {json_case_count}")
    log(f"Total rows processed in Excel: {excel_case_count}")
    log(f"New cases added: {new_cases}")
    log(f"Skipped duplicate cases: {skipped_cases}")
    log(f"Invalid/skipped rows: {invalid_cases}")
    log(f"Total cases after update: {len(data)}")

    # Save updated data
    log("Saving updated JSON data...")
    try:
        with open(json_path, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
        log("Update completed successfully")
    except Exception as e:
        log(f"Error saving JSON file: {str(e)}")


if __name__ == "__main__":
    main()
