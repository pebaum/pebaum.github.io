"""
Light Phone Notes Exporter v2
Navigates through UI, extracts note content, saves to markdown, and deletes notes.
"""

import asyncio
import os
import getpass
from datetime import datetime
from playwright.async_api import async_playwright

# Configuration
DASHBOARD_URL = "https://dashboard.thelightphone.com"

# Credentials will be prompted at runtime
USERNAME = None
PASSWORD = None


def prompt_for_credentials():
    """Prompt user for login credentials."""
    global USERNAME, PASSWORD
    print("\n=== Light Phone Notes Exporter ===\n")
    USERNAME = input("Email: ").strip()
    PASSWORD = getpass.getpass("Password: ")

# Output file
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, f"lightphone_notes_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.md")

DEBUG = True


async def login_if_needed(page):
    """Log into the Light Phone dashboard if not already logged in."""
    print("Navigating to dashboard...")
    await page.goto(DASHBOARD_URL)
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    # Check if we see a login form
    email_input = page.locator('input[type="text"][id*="email"], input[name*="email"]').first
    
    if await email_input.count() > 0:
        print("Login form found, entering credentials...")
        await email_input.fill(USERNAME)
        await asyncio.sleep(0.3)
        
        password_input = page.locator('input[type="password"]').first
        await password_input.fill(PASSWORD)
        await asyncio.sleep(0.3)
        
        login_label = page.locator('label[for="login-submit"], label:has-text("Log in")').first
        await login_label.click()
        
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        print("Logged in!")
    else:
        print("Already logged in.")


async def navigate_to_notes_list(page):
    """Navigate: Phone -> 206-518-3344 -> Toolbox -> Notes -> View Notes"""
    
    # Step 1: Click Phone
    print("Step 1: Clicking Phone...")
    await page.locator('a:has-text("Phone")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    # Step 2: Click phone number
    print("Step 2: Selecting phone 206-518-3344...")
    await page.locator(':text("206")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    # Step 3: Click Toolbox
    print("Step 3: Clicking Toolbox...")
    await page.locator(':text("Toolbox")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    # Step 4: Click Notes
    print("Step 4: Clicking Notes...")
    await page.locator('a:has-text("Notes")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    # Step 5: Click View Notes
    print("Step 5: Clicking View Notes...")
    await page.locator('a:has-text("View")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    print("Navigation complete - now on notes list")


async def get_note_items(page):
    """Get all note items (li elements) from the notes list."""
    
    # Wait for list to load
    await asyncio.sleep(2)
    
    if DEBUG:
        # Save current page state for debugging
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "debug_note_list_check.png"))
        html = await page.content()
        with open(os.path.join(OUTPUT_DIR, "debug_note_list_check.html"), "w", encoding="utf-8") as f:
            f.write(html)
    
    # Each note is in a <li> element with a delete button and a link
    note_items = await page.locator('li').all()
    print(f"Found {len(note_items)} li elements on page")
    
    notes_info = []
    for item in note_items:
        try:
            # Get the note link
            link = item.locator('a[href*="/notes/view/"]').first
            if await link.count() > 0:
                href = await link.get_attribute("href")
                title = await link.locator('span.title').inner_text()
                title = title.strip()
                
                # Get the date
                date_elem = item.locator('span.sub-heading').first
                date = await date_elem.inner_text() if await date_elem.count() > 0 else ""
                date = date.strip()
                
                print(f"  Found note: {title[:40]}... ({date})")
                
                notes_info.append({
                    'href': href,
                    'title': title,
                    'date': date,
                    'item': item
                })
        except Exception as e:
            continue
    
    print(f"Total notes found: {len(notes_info)}")
    return notes_info


async def extract_note_content(page, note_href):
    """Click on a note link and extract its full content from the textarea."""
    
    # Click the note link
    await page.locator(f'a[href="{note_href}"]').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    if DEBUG:
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "debug_note_detail.png"))
        html = await page.content()
        with open(os.path.join(OUTPUT_DIR, "debug_note_detail.html"), "w", encoding="utf-8") as f:
            f.write(html)
    
    # The note body is in a TEXTAREA - get its VALUE property
    content = ""
    
    try:
        # Wait for textarea to be present
        await page.wait_for_selector('textarea', timeout=5000)
        
        # Get the textarea value using JavaScript (most reliable)
        content = await page.evaluate('''
            () => {
                const textarea = document.querySelector('textarea');
                return textarea ? textarea.value : '';
            }
        ''')
        
        if content:
            print(f"Extracted note body ({len(content)} chars): {content[:80]}...")
        else:
            print("Textarea found but value is empty")
            
    except Exception as e:
        print(f"Error extracting textarea value: {e}")
        
        # Fallback: try input_value method
        try:
            content = await page.locator('textarea').first.input_value()
            print(f"Fallback extraction got {len(content)} chars")
        except Exception as e2:
            print(f"Fallback also failed: {e2}")
    
    return content.strip() if content else "(No body text found)"


async def delete_current_note(page):
    """Delete the currently viewed note from its detail page."""
    
    # Set up handler for browser confirmation dialog BEFORE clicking delete
    async def handle_dialog(dialog):
        print(f"Dialog appeared: {dialog.message}")
        await dialog.accept()
    
    page.on("dialog", handle_dialog)
    
    # Look for delete button on the detail page
    # From the HTML: <button class="Button--hollow mb1 self-center" type="reset">delete note</button>
    delete_selectors = [
        'button[type="reset"]:has-text("delete note")',  # Exact match for the delete button
        'button:has-text("delete note")',
        'button.Button--hollow:has-text("delete")',
        'button:has-text("Delete")',
        'button:has-text("delete")',
    ]
    
    for selector in delete_selectors:
        try:
            element = page.locator(selector).first
            if await element.count() > 0 and await element.is_visible():
                print(f"Found delete button with: {selector}")
                
                # If it's an image, click the parent button
                if 'img' in selector:
                    element = element.locator('..')
                
                await element.click()
                await asyncio.sleep(2)  # Wait for dialog and deletion
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(1)
                
                print("Delete clicked, dialog should have been accepted")
                return True
        except Exception as e:
            print(f"Delete attempt with {selector} failed: {e}")
            continue
    
    print("WARNING: Could not find delete button on detail page")
    await page.screenshot(path=os.path.join(OUTPUT_DIR, "debug_no_delete.png"))
    return False


async def save_notes_to_markdown(notes, filename):
    """Save notes to markdown file."""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# Light Phone Notes Export\n\n")
        f.write(f"**Exported:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Total notes:** {len(notes)}\n\n")
        f.write("---\n\n")
        
        for i, note in enumerate(notes, 1):
            f.write(f"## Note {i}: {note.get('title', 'Untitled')}\n\n")
            f.write(f"**Date:** {note.get('date', 'Unknown')}\n\n")
            f.write(f"{note.get('content', 'No content')}\n\n")
            f.write("---\n\n")
    
    print(f"Saved {len(notes)} notes to {filename}")


async def main():
    # Prompt for credentials
    prompt_for_credentials()
    
    if not PASSWORD:
        print("ERROR: Password not provided!")
        return
    
    print("\nStarting Light Phone Notes Exporter v2...")
    print(f"Output: {OUTPUT_FILE}")
    
    exported_notes = []
    
    async with async_playwright() as p:
        user_data_dir = os.path.join(OUTPUT_DIR, "browser_data")
        browser = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            slow_mo=100,
        )
        
        page = browser.pages[0] if browser.pages else await browser.new_page()
        
        try:
            # Login and navigate to notes
            await login_if_needed(page)
            await navigate_to_notes_list(page)
            
            if DEBUG:
                await page.screenshot(path=os.path.join(OUTPUT_DIR, "debug_notes_list.png"))
            
            # Process notes one by one
            iteration = 0
            max_iterations = 50  # Safety limit
            
            while iteration < max_iterations:
                iteration += 1
                
                # Get current list of notes
                notes_info = await get_note_items(page)
                
                if not notes_info:
                    print("No more notes found!")
                    break
                
                print(f"\n--- Processing note {len(exported_notes) + 1} (remaining: {len(notes_info)}) ---")
                
                # Get the first note's info
                note = notes_info[0]
                print(f"Title: {note['title']}")
                print(f"Date: {note['date']}")
                
                # Extract full content by clicking on it (opens detail page)
                content = await extract_note_content(page, note['href'])
                print(f"Content: {content[:100]}..." if len(content) > 100 else f"Content: {content}")
                
                # Store the note
                exported_notes.append({
                    'title': note['title'],
                    'date': note['date'],
                    'content': content,
                    'href': note['href']
                })
                
                # Save progress
                await save_notes_to_markdown(exported_notes, OUTPUT_FILE)
                
                # Delete the note from the detail page (we're still on it)
                print("Deleting note from detail page...")
                deleted = await delete_current_note(page)
                
                if not deleted:
                    print("Failed to delete, stopping to prevent infinite loop")
                    break
                
                # After deletion, we should be back on the notes list
                # Wait for page to update
                await asyncio.sleep(2)
                await page.wait_for_load_state("networkidle")
                
                print(f"Deleted! Total exported: {len(exported_notes)}")
            
            print(f"\n=== Export complete! ===")
            print(f"Exported {len(exported_notes)} notes to {OUTPUT_FILE}")
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            
            if exported_notes:
                await save_notes_to_markdown(exported_notes, OUTPUT_FILE)
                print(f"Saved {len(exported_notes)} notes before error")
        
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
