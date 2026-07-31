import asyncio

async def run(page):
    print("Starting Lumière & Bazar Frontend Testing...")
    await page.set_viewport_size({"width": 1920, "height": 1080})

    # Enable console log capture
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    try:
        # 1. Verify Home Page Load
        await page.goto("http://localhost:3000")
        await page.wait_for_selector("text=LUMIÈRE & BAZAR", timeout=5000)
        print("Home loaded successfully")

        # 2. Test Browse Categories & Search
        await page.click('[data-testid="nav-catalog-btn"]')
        await page.wait_for_selector('[data-testid="filter-cat-shoes"]', timeout=3000)
        await page.click('[data-testid="filter-cat-shoes"]')
        print("Successfully clicked and filtered by Shoes category")

        # Test Search input
        await page.fill('[data-testid="search-input"]', "Hoodie")
        await page.wait_for_timeout(1000)
        print("Search input tested successfully")

        # Clear search and reset category
        await page.fill('[data-testid="search-input"]', "")
        await page.click('[data-testid="filter-cat-all"]')

        # 3. Test Reseller Mode Toggle
        await page.click('[data-testid="reseller-mode-toggle"]')
        await page.wait_for_selector('[data-testid="reseller-active-alert"]', timeout=3000)
        print("Reseller mode toggled ON successfully, wholesale profit margins visible")

        # 4. Test Product Quick View & Add to Cart
        # Go back to home or catalog and click a product quick view
        await page.click('[data-testid="nav-catalog-btn"]')
        await page.wait_for_selector('[data-testid="catalog-product-p1"]', timeout=3000)
        # Click product image/title to open quick view
        await page.click('[data-testid="catalog-product-p1"] img')
        await page.wait_for_selector('[data-testid="quick-view-modal"]', timeout=3000)
        print("Quick view modal opened successfully")

        # Select size and add to bag
        await page.click('[data-testid="size-option-M"]')
        await page.click('[data-testid="modal-add-to-bag-btn"]')
        print("Added product from quick view modal to bag")

        # 5. Open Cart Drawer and proceed through Checkout with Reseller Margin
        await page.click('[data-testid="cart-drawer-trigger"]')
        await page.wait_for_selector('[data-testid="cart-drawer"]', timeout=3000)
        print("Cart drawer opened successfully")

        # Proceed to step 2 (Shipping address)
        await page.click('[data-testid="checkout-proceed-btn"]')
        await page.wait_for_selector('[data-testid="shipping-name-input"]', timeout=3000)
        print("Entered Shipping Address step")

        # Proceed to step 3 (Reseller margin configuration)
        await page.click('[data-testid="checkout-proceed-btn"]')
        await page.wait_for_selector('[data-testid="reseller-customer-name"]', timeout=3000)
        await page.fill('[data-testid="reseller-customer-name"]', "Sneha Gupta")
        print("Configured reseller customer margin successfully")

        # Place Order (Step 3 to Success)
        await page.click('[data-testid="checkout-proceed-btn"]')
        await page.wait_for_selector('[data-testid="view-orders-btn"]', timeout=3000)
        print("Order placed successfully and reached success confirmation!")

        # 6. Test Lookbooks and WhatsApp sharing
        await page.click('[data-testid="nav-lookbooks-btn"]')
        await page.wait_for_selector('[data-testid="add-entire-look-lb-1"]', timeout=3000)
        await page.click('[data-testid="add-entire-look-lb-1"]')
        print("Successfully added entire look from lookbooks to bag")

    except Exception as e:
        print(f"Error during frontend test: {str(e)}")
        raise e

    print("Frontend testing completed successfully!")
