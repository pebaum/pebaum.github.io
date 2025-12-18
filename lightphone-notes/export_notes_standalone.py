"""
Light Phone Notes Exporter - Standalone Version
Self-contained: automatically downloads and sets up browser driver on first run.
"""

import asyncio
import os
import sys
import getpass
import subprocess
from datetime import datetime

# Configuration
DASHBOARD_URL = "https://dashboard.thelightphone.com"
USERNAME = None
PASSWORD = None
DEBUG = True

# Determine base directory (works for both script and exe)
if getattr(sys, 'frozen', False):
    # Running as compiled exe
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # Running as script
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

OUTPUT_FILE = os.path.join(BASE_DIR, f"lightphone_notes_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.md")


def install_and_import(package, import_name=None):
    """Install a package if not present and import it."""
    import_name = import_name or package
    try:
        return __import__(import_name)
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])
        return __import__(import_name)


def setup_playwright():
    """Ensure Playwright and browsers are installed."""
    print("Checking Playwright installation...")
    
    try:
        from playwright.async_api import async_playwright
        print("Playwright already installed.")
    except ImportError:
        print("Installing Playwright...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "-q"])
        from playwright.async_api import async_playwright
    
    # Check if browsers are installed by looking for the chromium executable
    playwright_browsers_path = os.path.join(os.path.expanduser("~"), "AppData", "Local", "ms-playwright")
    chromium_installed = os.path.exists(playwright_browsers_path) and any(
        "chromium" in d.lower() for d in os.listdir(playwright_browsers_path)
    ) if os.path.exists(playwright_browsers_path) else False
    
    if not chromium_installed:
        print("Installing Chromium browser (this may take a minute on first run)...")
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
        print("Chromium installed!")
    else:
        print("Chromium browser already available.")
    
    return async_playwright


def prompt_for_credentials():
    """Prompt user for login credentials."""
    global USERNAME, PASSWORD
    print("\n=== Light Phone Notes Exporter ===\n")
    USERNAME = input("Email: ").strip()
    PASSWORD = getpass.getpass("Password: ")


async def login_if_needed(page):
    """Log into the Light Phone dashboard if not already logged in."""
    print("Navigating to dashboard...")
    await page.goto(DASHBOARD_URL)
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
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
    
    print("Step 1: Clicking Phone...")
    await page.locator('a:has-text("Phone")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    print("Step 2: Selecting phone...")
    await page.locator(':text("206")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    print("Step 3: Clicking Toolbox...")
    await page.locator(':text("Toolbox")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    print("Step 4: Clicking Notes...")
    await page.locator('a:has-text("Notes")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    print("Step 5: Clicking View Notes...")
    await page.locator('a:has-text("View")').first.click()
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    print("Navigation complete - now on notes list")


async def get_note_items(page):
    """Get all note items from the notes list."""
    await page.wait_for_selector("ul", timeout=10000)
    await asyncio.sleep(1)
    
    notes_info = await page.evaluate("""
        () => {
            const notes = [];
            const listItems = document.querySelectorAll('li');
            
            for (const li of listItems) {
                const anchor = li.querySelector('a');
                if (!anchor) continue;
                
                const href = anchor.getAttribute('href');
                if (!href || !href.includes('/note/')) continue;
                
                const spans = li.querySelectorAll('span');
                let title = '';
                let date = '';
                
                for (const span of spans) {
                    const text = span.textContent.trim();
                    if (text.includes('/')) {
                        date = text;
                    } else if (text.length > 0) {
                        title = text;
                    }
                }
                
                if (title) {
                    notes.push({ title, date, href });
                }
            }
            return notes;
        }
    """)
    
    return notes_info


async def extract_note_content(page, href):
    """Click on a note and extract its full content."""
    full_url = f"https://dashboard.thelightphone.com{href}"
    await page.goto(full_url)
    await page.wait_for_load_state("networkidle")
    await asyncio.sleep(2)
    
    content = await page.evaluate("""
        () => {
            const contentDiv = document.querySelector('[class*="content"]') || 
                               document.querySelector('article') ||
                               document.querySelector('main');
            
            if (contentDiv) {
                const paragraphs = contentDiv.querySelectorAll('p');
                if (paragraphs.length > 0) {
                    return Array.from(paragraphs).map(p => p.textContent.trim()).join('\\n\\n');
                }
                return contentDiv.textContent.trim();
            }
            
            const allText = document.body.innerText;
            return allText;
        }
    """)
    
    return content


async def delete_current_note(page):
    """Delete the currently viewed note."""
    try:
        delete_link = page.locator('a:has-text("Delete"), button:has-text("Delete")').first
        
        if await delete_link.count() > 0:
            await delete_link.click()
            await asyncio.sleep(1)
            
            confirm_btn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK"), a:has-text("Confirm")').first
            if await confirm_btn.count() > 0:
                await confirm_btn.click()
            
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)
            return True
        else:
            print("Delete button not found")
            return False
    except Exception as e:
        print(f"Error deleting: {e}")
        return False


async def save_notes_to_markdown(notes, filepath):
    """Save notes to a markdown file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("# Light Phone Notes Export\n\n")
        f.write(f"Exported: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Total notes: {len(notes)}\n\n")
        f.write("---\n\n")
        
        for i, note in enumerate(notes, 1):
            f.write(f"## {i}. {note['title']}\n\n")
            f.write(f"**Date:** {note['date']}\n\n")
            f.write(f"{note['content']}\n\n")
            f.write("---\n\n")
    
    print(f"Saved {len(notes)} notes to {filepath}")


async def main():
    """Main export function."""
    # Setup Playwright (install if needed)
    async_playwright = setup_playwright()
    
    # Get credentials
    prompt_for_credentials()
    
    print(f"\nOutput will be saved to: {OUTPUT_FILE}")
    
    exported_notes = []
    user_data_dir = os.path.join(BASE_DIR, "browser_data")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            slow_mo=100,
        )
        
        page = browser.pages[0] if browser.pages else await browser.new_page()
        
        try:
            await login_if_needed(page)
            await navigate_to_notes_list(page)
            
            if DEBUG:
                await page.screenshot(path=os.path.join(BASE_DIR, "debug_notes_list.png"))
            
            while True:
                notes_info = await get_note_items(page)
                
                if not notes_info:
                    print("No more notes found!")
                    break
                
                print(f"\n--- Processing note {len(exported_notes) + 1} (remaining: {len(notes_info)}) ---")
                
                note = notes_info[0]
                print(f"Title: {note['title']}")
                print(f"Date: {note['date']}")
                
                content = await extract_note_content(page, note['href'])
                print(f"Content: {content[:100]}..." if len(content) > 100 else f"Content: {content}")
                
                exported_notes.append({
                    'title': note['title'],
                    'date': note['date'],
                    'content': content,
                    'href': note['href']
                })
                
                await save_notes_to_markdown(exported_notes, OUTPUT_FILE)
                
                print("Deleting note from detail page...")
                deleted = await delete_current_note(page)
                
                if not deleted:
                    print("Failed to delete, stopping to prevent infinite loop")
                    break
                
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
    
    input("\nPress Enter to exit...")


if __name__ == "__main__":
    asyncio.run(main())
