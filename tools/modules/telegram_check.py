import json
import requests


def check_telegram_url(url):
    print(f"Checking Telegram URL: {url}")
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        print(f"Response status code: {response.status_code}")
        if response.status_code == 200:
            return "ACTIVE"
        else:
            return "INACTIVE"
    except requests.RequestException as e:
        print(f"Error checking URL: {e}")
        return "INACTIVE"


def update_telegram_cases(file_path):
    print(f"Loading JSON file: {file_path}")
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    for case_key, case_value in data.items():
        surface_url = case_value.get("SURFACE_URL", "")

        if surface_url.startswith("https://t.me/"):
            print(f"Processing case: {case_key}")
            status = check_telegram_url(surface_url)

            # Update fields
            case_value["SURFACE_URL_STATUS"] = status
            case_value["FINAL_URL"] = surface_url
            case_value["FINAL_URL_DOMAIN"] = "t.me"
            case_value["FINAL_URL_STATUS"] = status
            print(f"Updated case {case_key}: FINAL_URL_STATUS = {status}")

    print(f"Saving updated JSON file: {file_path}")
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)
    print("Update process completed.")


# Usage
file_path = "../Compromised-Discord-Accounts.json"
update_telegram_cases(file_path)
