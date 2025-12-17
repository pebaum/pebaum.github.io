"""
MTG Strategy Article Downloader

Downloads HTML from a curated list of MTG strategy articles,
extracts the main readable text, and saves each as a .txt file.

Uses Selenium for JavaScript-heavy sites that don't render with simple requests.
"""

import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import time

# Try to import Selenium for JS-heavy sites
SELENIUM_AVAILABLE = False
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    SELENIUM_AVAILABLE = True
except ImportError:
    print("Note: Selenium not installed. Some JS-heavy sites may not work properly.")
    print("Install with: pip install selenium webdriver-manager")

# Output directory for downloaded articles
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "articles")

# Sites that require JavaScript rendering
JS_REQUIRED_SITES = [
    "starcitygames.com",
    "tcgplayer.com",
    "mtgcommander.net",
    "aetherhub.com",
    "brainstormbrewery.com",
    "cardkingdom.com",
    "mtgsalvation.com",
]

# Sites that may need Wayback Machine fallback (paywall, bot protection, etc.)
WAYBACK_FALLBACK_SITES = [
    "starcitygames.com",
    "brainstormbrewery.com",
    "cardkingdom.com",
    "mtgsalvation.com",
    "mtgcommander.net",
]

# Curated list of MTG strategy articles
ARTICLES = [
    # Fundamentals & game theory (non-Commander)
    "https://articles.starcitygames.com/articles/whos-the-beatdown/",
    "https://articles.starcitygames.com/articles/the-danger-of-cool-things/",
    "https://magic.wizards.com/en/news/feature/basics-card-advantage-2014-08-25",
    "https://articles.starcitygames.com/articles/back-to-basics-3-counting-card-advantage/",
    "https://magic.wizards.com/en/news/feature/quadrant-theory-2014-08-20",
    "https://magic.wizards.com/en/news/feature/level-one-full-course-2015-10-05",
    "https://magic.wizards.com/en/news/making-magic/shoulders-giants-2013-08-06",
    "https://articles.starcitygames.com/magic-the-gathering/select/five-lies-you-believe-about-magic-strategy/",
    "https://www.tcgplayer.com/content/article/Deep-Dive-Card-Advantage/0559a1e7-809c-49fe-884b-f5b56754a4a5/",
    "https://www.tcgplayer.com/content/article/What-s-Your-Role-in-a-Game-of-MTG/8a7e6011-d3ba-430f-99be-ad5a260ec2cb/",
    # Commander / EDH strategy & philosophy
    "https://mtgcommander.net/index.php/the-philosophy-of-commander/",
    "https://gathering4magic.wordpress.com/2015/12/24/ethos-of-edh/",
    "https://corryfrydlewicz.com/commander-philosophy/",
    "https://aetherhub.com/Article/MTG-Commander-Politics---A-Guide-To-Diplomacy-At-The-Table",
    "https://www.hipstersofthecoast.com/2023/03/politics-and-win-rates-in-multiplayer-games-of-magic/",
    "https://articles.starcitygames.com/articles/the-problem-with-politics-in-commander/",
    "https://brainstormbrewery.com/unified-theory-of-commander-card-advantage/",
    "https://blog.cardkingdom.com/powering-up-your-commander-decks/",
    "https://www.tcgplayer.com/content/article/How-to-Build-and-Play-Commander-EDH-A-Guide-to-MTG-s-Casual-Multiplayer-Format/620ada09-5abe-457f-875b-816898539040/",
    "https://www.mtgsalvation.com/forums/the-game/commander-edh/574935-lets-talk-commander-strategy",
]

# Headers to mimic a browser request
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# Global Selenium driver (reused across downloads)
_driver = None


def get_selenium_driver():
    """Get or create a Selenium WebDriver instance."""
    global _driver
    if _driver is None and SELENIUM_AVAILABLE:
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            
            options = Options()
            options.add_argument("--headless=new")  # Use new headless mode
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--window-size=1920,1080")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            options.add_argument(f"user-agent={HEADERS['User-Agent']}")
            
            service = Service(ChromeDriverManager().install())
            _driver = webdriver.Chrome(service=service, options=options)
            _driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        except Exception as e:
            print(f"  Warning: Could not initialize Selenium: {e}")
            return None
    return _driver


def close_selenium_driver():
    """Close the Selenium WebDriver if it exists."""
    global _driver
    if _driver is not None:
        _driver.quit()
        _driver = None


def needs_javascript(url: str) -> bool:
    """Check if a URL likely needs JavaScript rendering."""
    for site in JS_REQUIRED_SITES:
        if site in url:
            return True
    return False


def needs_wayback_fallback(url: str) -> bool:
    """Check if a URL might need Wayback Machine fallback."""
    for site in WAYBACK_FALLBACK_SITES:
        if site in url:
            return True
    return False


def get_wayback_url(url: str) -> str:
    """Get the latest Wayback Machine URL for a given URL."""
    # Use the Wayback Machine availability API
    api_url = f"https://archive.org/wayback/available?url={url}"
    try:
        response = requests.get(api_url, timeout=10)
        data = response.json()
        if data.get("archived_snapshots", {}).get("closest", {}).get("available"):
            return data["archived_snapshots"]["closest"]["url"]
    except Exception:
        pass
    # Fallback: construct a direct wayback URL
    return f"https://web.archive.org/web/2021/{url}"


def sanitize_filename(url: str) -> str:
    """Generate a safe filename from a URL."""
    parsed = urlparse(url)
    # Get the path and clean it up
    path = parsed.path.strip("/")
    if not path:
        path = parsed.netloc
    
    # Take the last meaningful part of the path
    parts = [p for p in path.split("/") if p]
    if parts:
        name = parts[-1]
    else:
        name = parsed.netloc.replace(".", "_")
    
    # Remove file extensions if present
    name = re.sub(r'\.(html?|php|aspx?)$', '', name, flags=re.IGNORECASE)
    
    # Sanitize: keep only alphanumeric, hyphens, underscores
    name = re.sub(r'[^\w\-]', '_', name)
    name = re.sub(r'_+', '_', name)  # Collapse multiple underscores
    name = name.strip('_')
    
    # Truncate if too long
    if len(name) > 80:
        name = name[:80]
    
    return name + ".txt"


def extract_text_from_html(html: str, url: str) -> str:
    """Extract main readable text from HTML content."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove script, style, nav, footer, header, aside elements
    for element in soup(["script", "style", "nav", "footer", "header", "aside", 
                         "noscript", "iframe", "form", "button", "input"]):
        element.decompose()
    
    # Remove common non-content elements by class/id patterns
    for element in soup.find_all(class_=re.compile(
        r'(sidebar|menu|nav|footer|header|comment|social|share|ad|banner|promo|related|newsletter)',
        re.IGNORECASE
    )):
        element.decompose()
    
    for element in soup.find_all(id=re.compile(
        r'(sidebar|menu|nav|footer|header|comment|social|share|ad|banner|promo|related|newsletter)',
        re.IGNORECASE
    )):
        element.decompose()
    
    # Try to find the main content area
    main_content = None
    
    # Common content selectors
    content_selectors = [
        soup.find("article"),
        soup.find("main"),
        soup.find(class_=re.compile(r'(article|post|content|entry)[-_]?(body|content|text)?', re.IGNORECASE)),
        soup.find(id=re.compile(r'(article|post|content|entry)[-_]?(body|content|text)?', re.IGNORECASE)),
        soup.find(class_="post"),
        soup.find(class_="entry-content"),
        soup.find(class_="article-content"),
        soup.find(class_="post-content"),
    ]
    
    for selector in content_selectors:
        if selector:
            main_content = selector
            break
    
    # Fall back to body if no main content found
    if not main_content:
        main_content = soup.find("body") or soup
    
    # Extract title
    title = ""
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text(strip=True)
    
    h1_tag = soup.find("h1")
    if h1_tag:
        title = h1_tag.get_text(strip=True)
    
    # Extract text from main content
    # Get text with some structure preserved
    lines = []
    
    if title:
        lines.append(f"TITLE: {title}")
        lines.append(f"SOURCE: {url}")
        lines.append("")
        lines.append("=" * 60)
        lines.append("")
    
    # Process paragraphs, headings, and list items
    for element in main_content.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "blockquote"]):
        text = element.get_text(separator=" ", strip=True)
        if text:
            # Add formatting for headings
            if element.name.startswith("h"):
                level = int(element.name[1])
                prefix = "#" * level + " "
                lines.append("")
                lines.append(prefix + text)
                lines.append("")
            elif element.name == "li":
                lines.append("• " + text)
            elif element.name == "blockquote":
                lines.append("")
                lines.append("> " + text)
                lines.append("")
            else:
                lines.append(text)
                lines.append("")
    
    # Join and clean up
    content = "\n".join(lines)
    
    # Clean up excessive whitespace
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r' +', ' ', content)
    
    return content.strip()


def download_article(url: str) -> tuple[str, str]:
    """Download an article and return (filename, content)."""
    print(f"Downloading: {url}")
    
    html = None
    use_selenium = needs_javascript(url)
    actual_url = url
    
    # Try Selenium first for JS-heavy sites
    if use_selenium and SELENIUM_AVAILABLE:
        driver = get_selenium_driver()
        if driver:
            try:
                driver.get(url)
                # Wait longer for content to load, especially for JS-heavy sites
                wait_time = 5 if "starcitygames" in url else 3
                time.sleep(wait_time)
                
                # Scroll down to trigger lazy loading
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)
                driver.execute_script("window.scrollTo(0, 0);")
                time.sleep(1)
                
                html = driver.page_source
            except Exception as e:
                print(f"  Selenium failed: {e}, falling back to requests")
                html = None
    
    # Fall back to requests
    if html is None:
        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()
            html = response.text
        except requests.RequestException as e:
            print(f"  ERROR: Failed to download {url}: {e}")
            return None, None
    
    content = extract_text_from_html(html, url)
    
    # If content is too short and site might need Wayback, try that
    if len(content) < 500 and needs_wayback_fallback(url):
        print(f"  Content too short, trying Wayback Machine...")
        wayback_url = get_wayback_url(url)
        try:
            if SELENIUM_AVAILABLE:
                driver = get_selenium_driver()
                if driver:
                    driver.get(wayback_url)
                    time.sleep(5)
                    html = driver.page_source
                    actual_url = wayback_url
            if html is None or len(html) < 1000:
                response = requests.get(wayback_url, headers=HEADERS, timeout=30)
                response.raise_for_status()
                html = response.text
                actual_url = wayback_url
            
            wayback_content = extract_text_from_html(html, url)  # Use original URL for metadata
            if len(wayback_content) > len(content):
                content = wayback_content
                print(f"  Using Wayback Machine archive")
        except Exception as e:
            print(f"  Wayback fallback failed: {e}")
    
    filename = sanitize_filename(url)
    
    return filename, content


def main():
    """Main function to download all articles."""
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Downloading {len(ARTICLES)} MTG strategy articles...")
    print(f"Output directory: {OUTPUT_DIR}")
    if SELENIUM_AVAILABLE:
        print("Selenium is available for JS-heavy sites")
    else:
        print("WARNING: Selenium not available. Some sites may not work.")
        print("         Install with: pip install selenium webdriver-manager")
    print()
    
    successful = 0
    failed = 0
    
    for i, url in enumerate(ARTICLES, 1):
        print(f"[{i}/{len(ARTICLES)}] ", end="")
        
        filename, content = download_article(url)
        
        if filename and content:
            # Check if we got meaningful content
            if len(content) < 500:
                print(f"  WARNING: Very short content ({len(content)} chars), may need manual review")
            
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            # Handle duplicate filenames
            base, ext = os.path.splitext(filepath)
            counter = 1
            while os.path.exists(filepath):
                filepath = f"{base}_{counter}{ext}"
                counter += 1
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            
            print(f"  Saved: {os.path.basename(filepath)} ({len(content)} chars)")
            successful += 1
        else:
            failed += 1
        
        # Be polite to servers
        if i < len(ARTICLES):
            time.sleep(1)
    
    # Clean up Selenium
    close_selenium_driver()
    
    print()
    print("=" * 60)
    print(f"Download complete!")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print(f"  Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
