import asyncio
from playwright.async_api import async_playwright

async def run_test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        try:
            # Load frontend
            frontend_url = "http://localhost:3000"

            print(f"Navigating to {frontend_url}")
            await page.goto(frontend_url, timeout=15000)
            await page.wait_for_selector("text=LUMIÈRE & BAZAR", timeout=10000)
            print("App loaded successfully")

            # 1. Open Login/Register Modal
            login_btn = await page.wait_for_selector('[data-testid="open-auth-modal-btn"]', timeout=5000)
            await login_btn.click(force=True)
            print("Opened Auth Modal")
            await page.wait_for_selector('[data-testid="auth-modal"]', timeout=3000)

            # 2. Login with admin credentials (admin@example.com / admin123)
            await page.fill('[data-testid="auth-email-input"]', "admin@example.com")
            await page.fill('[data-testid="auth-password-input"]', "admin123")
            await page.click('[data-testid="auth-submit-btn"]', force=True)
            print("Submitted login form")

            # Verify admin name in top bar ("Hi, Admin")
            await page.wait_for_selector("text=Hi, Admin", timeout=5000)
            print("Verified admin login success: 'Hi, Admin' displayed in top bar")

            # 3. Test Logout
            logout_btn = await page.wait_for_selector('[data-testid="logout-btn"]', timeout=5000)
            await logout_btn.click(force=True)
            print("Clicked logout button")

            # Verify Login button is back
            await page.wait_for_selector('[data-testid="open-auth-modal-btn"]', timeout=5000)
            print("Verified logout success")

            # 4. Test Register a new account
            await page.click('[data-testid="open-auth-modal-btn"]', force=True)
            await page.wait_for_selector('[data-testid="switch-to-register-btn"]', timeout=3000)
            await page.click('[data-testid="switch-to-register-btn"]', force=True)
            print("Switched to Register mode")

            import random
            rand_email = f"new_user_{random.randint(1000, 9999)}@example.com"
            await page.fill('[data-testid="auth-name-input"]', "New Shopper")
            await page.fill('[data-testid="auth-email-input"]', rand_email)
            await page.fill('[data-testid="auth-password-input"]', "password123")
            await page.click('[data-testid="auth-submit-btn"]', force=True)
            print("Submitted registration form")

            # Verify user name in top bar ("Hi, New Shopper")
            await page.wait_for_selector("text=Hi, New Shopper", timeout=5000)
            print("Verified registration and auto-login success: 'Hi, New Shopper' displayed")

            print("All frontend auth tests passed successfully!")

        except Exception as e:
            print(f"Error during frontend testing: {str(e)}")
            raise e
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_test())
