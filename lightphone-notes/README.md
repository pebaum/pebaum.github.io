# Light Phone Notes Exporter

A standalone tool to export and delete notes from your Light Phone dashboard.

## What it does

1. Logs into the Light Phone dashboard
2. Navigates to your notes
3. Exports each note (title, date, full body text) to a markdown file
4. Deletes each note after export

## Usage

### Executable (Recommended)

Just download and run the executable:

```
.\lightphone-notes-exporter.exe
```

**On first run**, it will automatically:
- Install Playwright (if not present)
- Download Chromium browser (~150MB, one-time download)
- Then start the export process

You'll be prompted to enter your Light Phone dashboard email and password.

### Python script

If you prefer running from source:

```bash
pip install playwright
playwright install chromium
python export_notes.py
```

## Output

Creates a timestamped markdown file like `lightphone_notes_2025-12-17_153641.md` containing all your notes.

## Browser Data

The `browser_data/` folder stores your browser session to keep you logged in between runs.
