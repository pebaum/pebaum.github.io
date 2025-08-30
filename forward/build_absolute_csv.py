#!/usr/bin/env python3
import csv
from pathlib import Path

root = Path(r"c:\Users\pebaum\Documents\GitHub\pebaum.github.io\forward")
src = root / "FORWARD CARDS DB - v5 8.29.25.csv"
out = root / "FORWARD CARDS - absolute.csv"

# Columns in source
SRC_COLS = [
    "Card_Type",
    "Card_ID (assoc. location)",
    "Title",
    "Image_Source // Idea",
    "Rules_Text",
    "Flavor_Text",
    "?Lore_Text?",
]

# Columns in output (exactly as requested)
OUT_COLS = [
    "Abs_No",
    "Card_Type",
    "Associated_Location",
    "Title",
    "Image_Source_Idea",
    "Rules_Text",
    "Flavor_Text",
]


def normalize_type(t: str) -> str:
    t = (t or "").strip()
    if not t:
        return "Spare"
    # Normalize lowercase 'spare' to 'Spare'
    if t.lower() == "spare":
        return "Spare"
    return t


def main():
    if not src.exists():
        raise FileNotFoundError(src)

    with src.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        # Ensure we can access by expected source columns even if minor header typos
        field_map = {k: k for k in SRC_COLS if k in reader.fieldnames}
        # Fallbacks for variations
        if "Image_Source // Idea" not in field_map:
            for alt in reader.fieldnames:
                if alt.lower().startswith("image_source"):
                    field_map["Image_Source // Idea"] = alt
                    break
        if "Flavor_Text" not in field_map:
            for alt in reader.fieldnames:
                if alt.lower().startswith("flavor_text"):
                    field_map["Flavor_Text"] = alt
                    break

        rows = list(reader)

    # Walk rows, tracking current location title for association
    associated_location = ""
    out_rows = []
    abs_no = 0

    for r in rows:
        card_type = normalize_type(r.get(field_map.get("Card_Type", "Card_Type"), ""))
        card_id = r.get(field_map.get("Card_ID (assoc. location)", "Card_ID (assoc. location)"), "").strip()
        title = r.get(field_map.get("Title", "Title"), "").strip()
        img = r.get(field_map.get("Image_Source // Idea", "Image_Source // Idea"), "").strip()
        rules = r.get(field_map.get("Rules_Text", "Rules_Text"), "").strip()
        flavor = r.get(field_map.get("Flavor_Text", "Flavor_Text"), "").strip()

        # Skip completely empty lines (all empty and no type)
        if not any([card_type, card_id, title, img, rules, flavor]):
            continue

        # Update associated location when we hit a Location row
        if card_type == "Location":
            associated_location = title.strip()
        
        # Assign abs number
        abs_no += 1

        out_rows.append({
            "Abs_No": abs_no,
            "Card_Type": card_type,
            "Associated_Location": associated_location,
            "Title": title,
            "Image_Source_Idea": img,
            "Rules_Text": rules,
            "Flavor_Text": flavor,
        })

    # Pad to exactly 200 rows with Spare entries
    while len(out_rows) < 200:
        abs_no += 1
        out_rows.append({
            "Abs_No": abs_no,
            "Card_Type": "Spare",
            "Associated_Location": associated_location,
            "Title": "",
            "Image_Source_Idea": "",
            "Rules_Text": "",
            "Flavor_Text": "",
        })

    # Write output
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUT_COLS)
        writer.writeheader()
        for row in out_rows:
            writer.writerow(row)

    print(f"Wrote {len(out_rows)} rows to {out}")


if __name__ == "__main__":
    main()
