import openpyxl
import json
from datetime import datetime
from urllib.parse import urlparse


def log(message):
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    print(f"{timestamp} {message}")


def json_to_excel():
    # Load the JSON data
    log("Loading JSON data...")
    try:
        with open(
            "../Compromised-Discord-Accounts.json", "r", encoding="utf-8"
        ) as file:
            data = json.load(file)
    except FileNotFoundError:
        log("Error: JSON file not found.")
        return

    # Create a new workbook
    workbook = openpyxl.Workbook()
    worksheet = workbook.active

    # Set the header row
    headers = [
        "NOUMBER",
        "FOUND_ON",
        "FOUND_ON_SERVER",
        "DISCORD_ID",
        "USERNAME",
        "BEHAVIOUR",
        "TYPE",
        "METHOD",
        "TARGET",
        "PLATFORM",
        "SURFACE_URL",
        "REGION",
        "STATUS",
    ]
    worksheet.append(headers)

    # Iterate through the JSON data and populate the worksheet
    log("Converting JSON to Excel...")
    for account_key, account_data in data.items():
        row = [
            account_data.get("CASE_NUMBER", ""),
            datetime.fromisoformat(account_data.get("FOUND_ON", ""))
            if account_data.get("FOUND_ON")
            and account_data.get("FOUND_ON") != "Unknown"
            else "",
            account_data.get("FOUND_ON_SERVER", ""),
            account_data.get("DISCORD_ID", ""),
            account_data.get("USERNAME", ""),
            account_data.get("BEHAVIOUR", ""),
            account_data.get("ATTACK_METHOD", ""),
            account_data.get("ATTACK_VECTOR", ""),
            account_data.get("ATTACK_GOAL", ""),
            account_data.get("ATTACK_SURFACE", ""),
            account_data.get("SURFACE_URL", ""),
            account_data.get("SUSPECTED_REGION_OF_ORIGIN", ""),
            account_data.get("SURFACE_URL_STATUS", ""),
        ]
        worksheet.append(row)

    # Save the workbook
    output_path = "../ExporterSheet_Converted.xlsx"
    workbook.save(output_path)
    log(f"Excel file saved to {output_path}")
    log(f"Total accounts converted: {len(data)}")


if __name__ == "__main__":
    json_to_excel()
