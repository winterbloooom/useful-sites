#!/usr/bin/env python3
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Tuple


ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "tool_data.json"
FALLBACK_PATH = ROOT / "tool_data.js"

SECTION_RE = re.compile(r"^###\s+(.+?)\s*$")


def write_output(name: str, value: str) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if output_path:
        with open(output_path, "a", encoding="utf-8") as fh:
            fh.write(f"{name}<<__CODEx__\n{value}\n__CODEx__\n")


def fail(message: str) -> None:
    write_output("status", "error")
    write_output("message", message)
    raise SystemExit(message)


def parse_issue_sections(body: str) -> Dict[str, str]:
    sections: Dict[str, List[str]] = {}
    current = None

    for line in (body or "").splitlines():
        match = SECTION_RE.match(line)
        if match:
            current = match.group(1).strip()
            sections[current] = []
            continue
        if current is not None:
            sections[current].append(line)

    parsed = {}
    for key, lines in sections.items():
        value = "\n".join(lines).strip()
        parsed[key] = value
    return parsed


def normalize_url(url: str) -> str:
    trimmed = (url or "").strip()
    if not trimmed:
        return ""
    if re.match(r"^https?://", trimmed, flags=re.IGNORECASE):
        return trimmed
    return f"https://{trimmed}"


def normalize_category(category: str) -> str:
    return (category or "uncategorized").strip().lower()


def normalize_item(category: str, entry: dict) -> dict:
    return {
        "name": str(entry.get("name", "")).strip(),
        "url": normalize_url(str(entry.get("url", ""))),
        "desc": str(entry.get("desc", "")).strip(),
        "pick": {
            "frequently": bool(entry.get("pick", {}).get("frequently"))
        },
    }


def load_data() -> dict:
    with open(DATA_PATH, "r", encoding="utf-8") as fh:
        raw = json.load(fh)
    normalized = {}
    for category, entries in raw.items():
        if not isinstance(entries, list):
            continue
        normalized[normalize_category(category)] = [normalize_item(category, entry) for entry in entries]
    return normalized


def sort_data(data: dict) -> dict:
    sorted_categories = {}
    for category in sorted(data.keys()):
        entries = sorted(data[category], key=lambda item: item["name"].lower())
        sorted_categories[category] = entries
    return sorted_categories


def save_data(data: dict) -> None:
    ordered = sort_data(data)
    with open(DATA_PATH, "w", encoding="utf-8") as fh:
        json.dump(ordered, fh, ensure_ascii=False, indent=4)
        fh.write("\n")

    with open(FALLBACK_PATH, "w", encoding="utf-8") as fh:
        fh.write("window.TOOL_DATA = ")
        json.dump(ordered, fh, ensure_ascii=False, indent=4)
        fh.write(";\n")


def field(sections: Dict[str, str], key: str, required: bool = False) -> str:
    value = (sections.get(key) or "").strip()
    if required and not value:
        fail(f'Missing required field "{key}" in issue body.')
    return value


def is_checked(value: str, label: str) -> bool:
    for line in value.splitlines():
        if line.strip().lower() == f"- [x] {label}".lower():
            return True
    return False


def find_matches(data: dict, name: str, url: str = "", category: str = "") -> List[Tuple[str, int]]:
    target_name = name.strip().casefold()
    target_url = normalize_url(url).casefold() if url.strip() else ""
    target_category = normalize_category(category) if category.strip() and category.strip().lower() != "unknown" else ""
    matches: List[Tuple[str, int]] = []

    for current_category, entries in data.items():
        if target_category and current_category != target_category:
            continue
        for index, entry in enumerate(entries):
            if entry["name"].strip().casefold() != target_name:
                continue
            if target_url and normalize_url(entry["url"]).casefold() != target_url:
                continue
            matches.append((current_category, index))
    return matches


def ensure_single_match(matches: List[Tuple[str, int]], context: str) -> Tuple[str, int]:
    if not matches:
        fail(f"No entry matched for {context}.")
    if len(matches) > 1:
        fail(f"Multiple entries matched for {context}. Provide URL or category to disambiguate.")
    return matches[0]


def handle_add(data: dict, sections: Dict[str, str]) -> str:
    name = field(sections, "Name", required=True)
    url = normalize_url(field(sections, "URL", required=True))
    category = normalize_category(field(sections, "Category", required=True))
    desc = field(sections, "Description")
    frequently = is_checked(field(sections, "Options"), "Mark as frequently used")

    for existing in data.get(category, []):
        if existing["name"].strip().casefold() == name.strip().casefold():
            if normalize_url(existing["url"]).casefold() == url.casefold():
                fail(f'"{name}" already exists in "{category}".')

    data.setdefault(category, []).append({
        "name": name.strip(),
        "url": url,
        "desc": desc,
        "pick": {"frequently": frequently},
    })
    return f'Added "{name}" to "{category}".'


def handle_edit(data: dict, sections: Dict[str, str]) -> str:
    current_name = field(sections, "Current name", required=True)
    current_url = field(sections, "Current URL")
    new_name = field(sections, "New name")
    new_url = field(sections, "New URL")
    new_category = field(sections, "New category")
    new_description = field(sections, "New description")
    frequently_used = field(sections, "Frequently used")

    match = ensure_single_match(
        find_matches(data, current_name, current_url),
        f'edit "{current_name}"'
    )
    current_category, index = match
    entry = data[current_category][index]

    next_category = current_category if new_category in ("", "No change") else normalize_category(new_category)
    next_name = entry["name"] if not new_name else new_name.strip()
    next_url = entry["url"] if not new_url else normalize_url(new_url)
    next_desc = entry["desc"] if not new_description else new_description.strip()
    next_frequently = entry["pick"]["frequently"]
    if frequently_used == "Yes":
        next_frequently = True
    elif frequently_used == "No":
        next_frequently = False

    changed = (
        next_category != current_category or
        next_name != entry["name"] or
        next_url != entry["url"] or
        next_desc != entry["desc"] or
        next_frequently != entry["pick"]["frequently"]
    )
    if not changed:
        fail("No effective change was provided.")

    for category_name, entries in data.items():
        for idx, existing in enumerate(entries):
            if category_name == current_category and idx == index:
                continue
            if category_name != next_category:
                continue
            if existing["name"].strip().casefold() == next_name.casefold() and normalize_url(existing["url"]).casefold() == next_url.casefold():
                fail(f'"{next_name}" already exists in "{next_category}".')

    if next_category != current_category:
        del data[current_category][index]
        if not data[current_category]:
            del data[current_category]
        data.setdefault(next_category, []).append({
            "name": next_name,
            "url": next_url,
            "desc": next_desc,
            "pick": {"frequently": next_frequently},
        })
    else:
        data[current_category][index] = {
            "name": next_name,
            "url": next_url,
            "desc": next_desc,
            "pick": {"frequently": next_frequently},
        }

    return f'Updated "{current_name}".'


def handle_delete(data: dict, sections: Dict[str, str]) -> str:
    name = field(sections, "Name", required=True)
    url = field(sections, "URL")
    category = field(sections, "Category")

    current_category, index = ensure_single_match(
        find_matches(data, name, url, category),
        f'delete "{name}"'
    )
    del data[current_category][index]
    if not data[current_category]:
        del data[current_category]
    return f'Deleted "{name}" from "{current_category}".'


def main() -> None:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        fail("GITHUB_EVENT_PATH is not set.")

    with open(event_path, "r", encoding="utf-8") as fh:
        event = json.load(fh)

    issue = event.get("issue") or {}
    labels = {label.get("name") for label in issue.get("labels", [])}
    body = issue.get("body", "")
    sections = parse_issue_sections(body)
    data = load_data()

    if "tool-add" in labels:
        message = handle_add(data, sections)
    elif "tool-edit" in labels:
        message = handle_edit(data, sections)
    elif "tool-delete" in labels:
        message = handle_delete(data, sections)
    else:
        fail("Issue does not have a supported tool label.")

    save_data(data)
    write_output("status", "success")
    write_output("message", message)
    print(message)


if __name__ == "__main__":
    main()
