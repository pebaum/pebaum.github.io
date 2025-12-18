"""
Light Phone Notes Delete All
Deletes all notes from your Light Phone dashboard.

Requirements:
    pip install playwright
    playwright install chromium
"""

import asyncio
import os
import getpass
from playwright.async_api import async_playwright

# Configuration
DASHBOARD_URL = "https://dashboard.thelightphone.com"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BROWSER_DATA_DIR = os.path.join(SCRIPT_DIR, "browser_data")


def prompt_for_credentials():
    """Prompt user for login credentials."""
    print("\n=== Light Phone Notes - DELETE ALL ===\n")
    print("WARNING: This will permanently delete ALL notes from your Light Phone!")
    confirm = input("Type 'DELETE' to confirm: ").strip()
    if confirm != "DELETE":
        print("Aborted.")
        exit(0)
    
    username = input("\nEmail: ").strip()
    password = getpass.getpass("Password: ")
    return username, password


async def wait_for_app(page):
    """Wait for Ember.js app to fully load."""
    await page.wait_for_load_state("networkidle")
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


async def get_note_count(page):
    """Get count of notes on the page."""
    await asyncio.sleep(1)
    count = await page.evaluate("""
        () => document.querySelectorAll('a[href*="/notes/view/"]').length
    """)
    return count


async def click_first_note(page):
    """Click into the first note."""
    note_link = page.locator('a[href*="/notes/view/"]').first
    if await note_link.count() > 0:
        await note_link.click()
        await wait_for_app(page)
        await asyncio.sleep(1)
        return True
    return False


async def delete_current_note(page):
    """Delete the currently viewed note."""
    # Find and click the delete note button
    delete_btn = page.locator('button:has-text("delete note")').first
    
    if await delete_btn.count() > 0:
        print("  Clicking delete note button...")
        
        # Handle browser confirm dialog
        async def handle_dialog(dialog):
            await dialog.accept()
        
        page.once("dialog", handle_dialog)
        
        await delete_btn.click()
        await asyncio.sleep(2)
        
        await wait_for_app(page)
        return True
    
    print("  Delete button not found!")
    return False


async def go_back_to_notes_list(page):
    """Navigate back to the notes list."""
    back_btn = page.locator('a.Button--icon img[alt*="back"]').first
    if await back_btn.count() > 0:
        await back_btn.click()
    else:
        # Try clicking the parent anchor
        back_link = page.locator('a.Button--icon.fixed-back, a[class*="back"]').first
        if await back_link.count() > 0:
            await back_link.click()
        else:
            await page.go_back()
    await wait_for_app(page)


async def main():
    """Main delete function."""
    username, password = prompt_for_credentials()
    
    deleted_count = 0
    
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
            
            # Count initial notes
            initial_count = await get_note_count(page)
            print(f"\nFound {initial_count} notes to delete")
            
            if initial_count == 0:
                print("No notes to delete!")
            else:
                # Delete notes one by one
                while True:
                    count = await get_note_count(page)
                    if count == 0:
                        break
                    
                    print(f"Deleting note... ({count} remaining)")
                    
                    # Click into the first note
                    if not await click_first_note(page):
                        print("Could not click into note, stopping.")
                        break
                    
                    # Delete it from inside
                    deleted = await delete_current_note(page)
                    if deleted:
                        deleted_count += 1
                        # After delete, we should be back on the list or need to navigate back
                        # Check if we're still on detail page and go back if needed
                        await asyncio.sleep(1)
                        note_count_now = await get_note_count(page)
                        if note_count_now == 0:
                            # Might need to go back to list
                            await go_back_to_notes_list(page)
                    else:
                        print("Could not find delete button, stopping.")
                        break
                    
                    await asyncio.sleep(1)
            
            print(f"\n=== Delete complete! ===")
            print(f"Deleted {deleted_count} notes")
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            print(f"Deleted {deleted_count} notes before error")
        
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
