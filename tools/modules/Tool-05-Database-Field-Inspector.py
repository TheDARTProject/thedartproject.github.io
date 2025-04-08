import json


def process_json(json_file, output_file):
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    unique_values = {
        "FOUND_ON_SERVER": set(),
        "ACCOUNT_STATUS": set(),
        "ACCOUNT_TYPE": set(),
        "BEHAVIOUR": set(),
        "ATTACK_METHOD": set(),
        "ATTACK_VECTOR": set(),
        "ATTACK_GOAL": set(),
        "ATTACK_SURFACE": set(),
        "SUSPECTED_REGION_OF_ORIGIN": set(),
        "FINAL_URL_STATUS": set(),
        "SURFACE_URL_STATUS": set()
    }

    for case in data.values():
        for field in unique_values:
            unique_values[field].add(case[field])

    case_count = len(data)

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"Total Cases: {case_count}\n\n")
        for field, values in unique_values.items():
            f.write(f"{field}:\n")
            for value in values:
                f.write(f"- {value}\n")
            f.write("\n")


if __name__ == "__main__":
    process_json("../Compromised-Discord-Accounts.json", "../inspection.txt")
