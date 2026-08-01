from fastapi import APIRouter
from routers.admin.products import router as admin_products_router
from routers.admin.orders import router as admin_orders_router
from routers.admin.users import router as admin_users_router
from routers.admin.dashboard import router as admin_dashboard_router
from routers.admin.vouchers import router as admin_vouchers_router
from routers.admin.analytics import router as admin_analytics_router
from routers.admin.cms import router as admin_cms_router

admin_router = APIRouter(prefix="/admin")
admin_router.include_router(admin_products_router)
admin_router.include_router(admin_orders_router)
admin_router.include_router(admin_users_router)
admin_router.include_router(admin_dashboard_router)
admin_router.include_router(admin_vouchers_router)
admin_router.include_router(admin_analytics_router)
admin_router.include_router(admin_cms_router)
