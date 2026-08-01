from server import app

def test_admin_routes_registered():
    routes = [r.path for r in app.routes]
    expected_routes = [
        "/api/admin/products",
        "/api/admin/products/{product_id}",
        "/api/admin/orders",
        "/api/admin/orders/{order_id}/status",
        "/api/admin/orders/{order_id}/return-status",
        "/api/admin/users",
        "/api/admin/stats",
    ]
    for route in expected_routes:
        assert route in routes, f"Missing route: {route}"

def test_return_endpoints_registered():
    routes = [r.path for r in app.routes]
    assert "/api/orders/{order_id}/return" in routes
