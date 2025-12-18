# Light Phone Notes Exporter

A Python tool to export and delete notes from your Light Phone dashboard.

## What it does

1. Logs into the Light Phone dashboard
2. Navigates to your notes
3. Exports each note (title, date, full body text) to a markdown file
4. Deletes each note after export

## Requirements

- Python 3.11+
- Playwright

## Setup

```bash
pip install playwright
playwright install chromium
```

## Usage

### Executable

Just run the executable and enter your credentials when prompted:

```
.\lightphone-notes-exporter.exe
```

### Python script

```bash
python export_notes.py
```

You'll be prompted to enter your email and password.

## Output

Creates a timestamped markdown file like `lightphone_notes_2025-12-17_153641.md` containing all your notes.

## Browser Data

The `browser_data/` folder stores your browser session to keep you logged in between runs.
