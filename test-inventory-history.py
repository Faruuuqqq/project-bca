"""
Test script to verify inventory history page implementation
Tests:
1. /admin redirects to /admin/orders (KDS)
2. /admin/inventory loads correctly
3. /admin/inventory/history loads with filters and pagination
4. Mini history section shows in inventory page with link
"""

from playwright.sync_api import sync_playwright
import time
import os

os.environ['PYTHONIOENCODING'] = 'utf-8'

def test_inventory_history():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("\n=== Testing Inventory History Implementation ===\n")
        
        # Try to login first
        print("TEST 0: Attempting to login")
        page.goto('http://localhost:3000/admin/login', wait_until='networkidle')
        time.sleep(1)
        
        # Try common test credentials
        email_input = page.locator('input[type="email"]')
        password_input = page.locator('input[type="password"]')
        login_button = page.locator('button:has-text("MASUK KE DASHBOARD")')
        
        if email_input.count() > 0 and password_input.count() > 0:
            print("[INFO] Login form found - attempting with test credentials")
            email_input.fill('admin@kalintang.com')
            password_input.fill('admin123')
            login_button.click()
            time.sleep(2)
            page.wait_for_load_state('networkidle')
        
        # Test 1: /admin redirects to /admin/orders
        print("\nTEST 1: Checking /admin redirect to /admin/orders")
        page.goto('http://localhost:3000/admin', wait_until='networkidle')
        time.sleep(1)
        current_url = page.url
        if '/admin/orders' in current_url:
            print("[PASS] /admin correctly redirects to /admin/orders (KDS)")
        else:
            print(f"[INFO] Current URL: {current_url}")
            if '/admin/login' in current_url:
                print("[SKIP] Auth required - cannot complete test without valid credentials")
                return
        
        # Test 2: /admin/inventory page loads
        print("\nTEST 2: Loading /admin/inventory page")
        page.goto('http://localhost:3000/admin/inventory', wait_until='networkidle')
        time.sleep(1)
        
        # Check if page title exists
        title = page.locator('h1').first
        if title.is_visible():
            title_text = title.text_content()
            print(f"[PASS] Inventory page loaded - Title: {title_text}")
        else:
            print("[FAIL] Inventory page title not found")
        
        # Check if mini history section exists
        history_section = page.locator('text=Riwayat Terbaru')
        if history_section.count() > 0:
            print("[PASS] Mini history section found")
        else:
            print("[FAIL] Mini history section not found")
        
        # Check if "Lihat Semua" link exists
        see_all_link = page.locator('text=Lihat Semua')
        if see_all_link.count() > 0:
            print("[PASS] 'Lihat Semua' link found in inventory page")
        else:
            print("[FAIL] 'Lihat Semua' link not found")
        
        # Test 3: Navigate to history page and check filters
        print("\nTEST 3: Testing /admin/inventory/history page")
        if see_all_link.count() > 0:
            see_all_link.click()
            time.sleep(1)
            page.wait_for_load_state('networkidle')
        else:
            page.goto('http://localhost:3000/admin/inventory/history', wait_until='networkidle')
            time.sleep(1)
        
        # Check history page title
        history_title = page.locator('text=Riwayat Perubahan Stok')
        if history_title.count() > 0:
            print("[PASS] History page title found")
        else:
            print("[FAIL] History page title not found")
        
        # Check filter elements
        filters_found = {
            'search': page.locator('input[placeholder="Item atau alasan..."]').count() > 0,
            'menu': page.locator('text=Menu').count() > 0,
            'type': page.locator('text=Tipe').count() > 0,
            'date_from': page.locator('text=Dari').count() > 0,
            'date_to': page.locator('text=Sampai').count() > 0,
        }
        
        print("\nFilters found:")
        for filter_name, found in filters_found.items():
            status = "[OK]" if found else "[NO]"
            print(f"  {status} {filter_name}")
        
        # Check pagination elements
        pagination = page.locator('button:has-text("Sebelumnya")')
        if pagination.count() > 0:
            print("[PASS] Pagination controls found")
        else:
            print("[FAIL] Pagination controls not found")
        
        # Check statistics
        stats = page.locator('text=Total Masuk').count() > 0
        if stats:
            print("[PASS] Statistics section found")
        else:
            print("[FAIL] Statistics section not found")
        
        # Take screenshot of history page
        print("\nTaking screenshot of history page...")
        page.screenshot(path='test-results/history-page.png', full_page=True)
        print("[PASS] Screenshot saved to test-results/history-page.png")
        
        browser.close()
        print("\n=== All Tests Complete ===\n")

if __name__ == '__main__':
    test_inventory_history()


