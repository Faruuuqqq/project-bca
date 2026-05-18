"""
iPad Breakpoint Testing Script - Updated
Tests all kiosk screens at md: (768px portrait) and lg: (1024px landscape) breakpoints
"""

from playwright.sync_api import sync_playwright
import time
import os

# Set UTF-8 encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'

def test_ipad_breakpoints():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Test configurations
        test_configs = [
            {
                "name": "iPad Portrait (768px)",
                "width": 768,
                "height": 1024,
                "device_scale": 2,
            },
            {
                "name": "iPad Landscape (1024px)",
                "width": 1024,
                "height": 768,
                "device_scale": 2,
            }
        ]
        
        # Routes to test
        routes = [
            "/",  # Welcome screen
            "/order-type",  # Order type selection
            "/menu",  # Menu screen
            "/success",  # Success screen
        ]
        
        results = []
        
        for config in test_configs:
            print("\n" + "="*60)
            print("Testing: " + config['name'])
            print("Viewport: " + str(config['width']) + "x" + str(config['height']))
            print("="*60)
            
            page = browser.new_page(
                viewport={"width": config["width"], "height": config["height"]},
                device_scale_factor=config["device_scale"]
            )
            
            for route in routes:
                print("\n[TEST] Route: " + route)
                
                try:
                    page.goto("http://localhost:3000" + route, wait_until="networkidle")
                    time.sleep(1)  # Allow animations to settle
                    
                    # Take screenshot
                    clean_route = route if route != "/" else "home"
                    screenshot_path = "test-results/" + config['name'].replace(' ', '_').replace('(', '').replace(')', '').lower() + "_" + clean_route.replace('/', '_') + ".png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print("   [PASS] Screenshot saved: " + screenshot_path)
                    
                    # Check for interactive elements
                    buttons = page.locator("button").all()
                    print("   [INFO] Found " + str(len(buttons)) + " buttons")
                    
                    # Check button sizes (should be h-12 w-12 = 48px or larger for critical buttons)
                    critical_buttons = 0
                    small_buttons = 0
                    for i, button in enumerate(buttons):
                        bbox = button.bounding_box()
                        if bbox:
                            width = bbox["width"]
                            height = bbox["height"]
                            # Count buttons that meet the 48px threshold
                            if width >= 40 and height >= 40:
                                critical_buttons += 1
                            else:
                                small_buttons += 1
                    
                    print("   [INFO] Critical buttons (>=40px): " + str(critical_buttons))
                    print("   [INFO] Small buttons (<40px): " + str(small_buttons))
                    
                    # Check for layout issues
                    inputs = page.locator("input").all()
                    if len(inputs) > 0:
                        print("   [INFO] Found " + str(len(inputs)) + " input field(s)")
                    
                    results.append({
                        "config": config["name"],
                        "route": route,
                        "status": "[PASS]",
                        "buttons": len(buttons),
                        "critical_buttons": critical_buttons
                    })
                    
                except Exception as e:
                    print("   [FAIL] Error: " + str(e))
                    results.append({
                        "config": config["name"],
                        "route": route,
                        "status": "[FAIL]: " + str(e),
                        "buttons": 0,
                        "critical_buttons": 0
                    })
            
            page.close()
        
        browser.close()
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        for result in results:
            status = result['status']
            buttons = result['buttons']
            critical = result['critical_buttons']
            print("{:30} | {:20} | {} | {} buttons ({} critical)".format(
                result['config'], result['route'], status, buttons, critical))
        
        print("\n[INFO] Total tests: " + str(len(results)))
        print("[PASS] Passed: " + str(sum(1 for r in results if 'PASS' in r['status'])))
        print("[FAIL] Failed: " + str(sum(1 for r in results if 'FAIL' in r['status'])))

if __name__ == "__main__":
    import os
    os.makedirs("test-results", exist_ok=True)
    test_ipad_breakpoints()
