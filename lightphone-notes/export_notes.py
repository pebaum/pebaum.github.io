"""
Light Phone Notes Exporter
Exports all notes from your Light Phone dashboard to a markdown file.

Requirements:
    pip install playwright
    playwright install chromium
"""

import asyncio
import os
import getpass
from datetime import datetime
from playwright.async_api import async_playwright

# Configuration
DASHBOARD_URL = "https://dashboard.thelightphone.com"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, f"lightphone_notes_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.md")
BROWSER_DATA_DIR = os.path.join(SCRIPT_DIR, "browser_data")


def prompt_for_credentials():
    """Prompt user for login credentials."""
    print("\n=== Light Phone Notes Exporter ===\n")
    username = input("Email: ").strip()
    password = getpass.getpass("Password: ")
    return username, password


async def wait_for_app(page):
    """Wait for Ember.js app to fully load."""
    await page.wait_for_load_state("networkidle")
    # Wait for pace loader to finish
    try:
        await page.wait_for_function("document.body.classList.contains('pace-done')", timeout=15000)
    except:
        await asyncio.sleep(3)
    await asyncio.sleep(1)


async def login_if_needed(page, username, password):
    """Log into the Light Phone dashboard if not already logged in."""
    print("Navigating to dashboard...")
    await page.goto(DASHBOARD_URL)
    await wait_for_app(page)
    
    email_input = page.locator('input[type="text"][id*="email"], input[name*="email"]').first
    
    if await email_input.count() > 0:
        print("Login form found, entering credentials...")
        await email_input.fill(username)
        await asyncio.sleep(0.3)
        
        password_input = page.locator('input[type="password"]').first
        await password_input.fill(password)
        await asyncio.sleep(0.3)
        
        login_label = page.locator('label[for="login-submit"], label:has-text("Log in")').first
        await login_label.click()
        
        await wait_for_app(page)
        print("Logged in!")
    else:
        print("Already logged in.")


async def navigate_to_notes_list(page):
    """Navigate: Phone -> phone number -> Toolbox -> Notes -> View Notes"""
    
    print("Step 1: Clicking Phone...")
    await page.locator('a:has-text("Phone")').first.click()
    await wait_for_app(page)
    
    print("Step 2: Selecting phone...")
    await page.locator(':text("206")').first.click()
    await wait_for_app(page)
    
    print("Step 3: Clicking Toolbox...")
    await page.locator(':text("Toolbox")').first.click()
    await wait_for_app(page)
    
    print("Step 4: Clicking Notes...")
    await page.locator('a:has-text("Notes")').first.click()
    await wait_for_app(page)
    
    print("Step 5: Clicking View Notes...")
    await page.locator('a:has-text("View")').first.click()
    await wait_for_app(page)
    
    print("Navigation complete - now on notes list")


async def get_note_links(page):
    """Get all note links from the notes list."""
    await asyncio.sleep(2)
    
    # Find all note links
    note_links = await page.evaluate("""
        () => {
            const notes = [];
            const links = document.querySelectorAll('a[href*="/notes/view/"]');
            
            for (const link of links) {
                const href = link.getAttribute('href');
                const titleSpan = link.querySelector('span.title');
                const title = titleSpan ? titleSpan.textContent.trim() : link.textContent.trim();
                
                // Get date from parent
                const parent = link.closest('li');
                let date = '';
                if (parent) {
                    const subHeading = parent.querySelector('.sub-heading');
                    if (subHeading) date = subHeading.textContent.trim();
                }
                
                if (href) {
                    notes.push({ title, date, href });
                }
            }
            return notes;
        }
    """)
    
    return note_links


async def extract_note_content_by_click(page, note_link):
    """Click a note link and extract its content."""
    # Click the note link
    await page.click(f'a[href="{note_link["href"]}"]')
    await wait_for_app(page)
    await asyncio.sleep(2)
    
    # Extract the content
    content = await page.evaluate("""
        () => {
            // Try textarea first
            const textarea = document.querySelector('textarea');
            if (textarea && textarea.value) return textarea.value;
            
            // Try pre/code
            const pre = document.querySelector('pre');
            if (pre) return pre.textContent.trim();
            
            // Try to find the note body by looking for specific patterns
            const allDivs = document.querySelectorAll('div');
            for (const div of allDivs) {
                // Skip small divs and navigation
                if (div.querySelectorAll('a').length > 2) continue;
                const text = div.textContent.trim();
                if (text.length > 50 && !text.includes('Phone') && !text.includes('Toolbox')) {
                    return text;
                }
            }
            
            // Fallback - get page text without header/nav
            const main = document.querySelector('main') || document.querySelector('.wrapper');
            if (main) {
                const clone = main.cloneNode(true);
                clone.querySelectorAll('a, button, nav').forEach(el => el.remove());
                return clone.textContent.trim();
            }
            
            return '';
        }
    """)
    
    return content


async def go_back_to_notes_list(page):
    """Navigate back to the notes list."""
    back_btn = page.locator('a[class*="back"], img[alt*="back"]').first
    if await back_btn.count() > 0:
        await back_btn.click()
    else:
        await page.go_back()
    await wait_for_app(page)


def save_notes_to_markdown(notes, filepath):
    """Save notes to a markdown file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("# Light Phone Notes Export\n\n")
        f.write(f"Exported: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Total notes: {len(notes)}\n\n")
        f.write("---\n\n")
        
        for i, note in enumerate(notes, 1):
            f.write(f"## {i}. {note['title']}\n\n")
            if note['date']:
                f.write(f"**Date:** {note['date']}\n\n")
            f.write(f"{note['content']}\n\n")
            f.write("---\n\n")
    
    print(f"Saved {len(notes)} notes to {filepath}")


async def main():
    """Main export function."""
    username, password = prompt_for_credentials()
    
    print(f"\nOutput will be saved to: {OUTPUT_FILE}")
    
    exported_notes = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            BROWSER_DATA_DIR,
            headless=False,
            slow_mo=100,
        )
        
        page = browser.pages[0] if browser.pages else await browser.new_page()
        
        try:
            await login_if_needed(page, username, password)
            await navigate_to_notes_list(page)
            
            # Get all note links
            note_links = await get_note_links(page)
            print(f"\nFound {len(note_links)} notes")
            
            for i, note in enumerate(note_links):
                print(f"\n--- Processing note {i+1}/{len(note_links)}: {note['title'][:50]} ---")
                
                # Click into the note and get content
                content = await extract_note_content_by_click(page, note)
                print(f"Content length: {len(content)} chars")
                
                exported_notes.append({
                    'title': note['title'],
                    'date': note['date'],
                    'content': content
                })
                
                # Save progress after each note
                save_notes_to_markdown(exported_notes, OUTPUT_FILE)
                
                # Go back to list
                await go_back_to_notes_list(page)
            
            print(f"\n=== Export complete! ===")
            print(f"Exported {len(exported_notes)} notes to {OUTPUT_FILE}")
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            
            if exported_notes:
                save_notes_to_markdown(exported_notes, OUTPUT_FILE)
                print(f"Saved {len(exported_notes)} notes before error")
        
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
