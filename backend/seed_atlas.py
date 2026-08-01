import asyncio
from services.seed_service import seed_admin, seed_products
from core.database import db

async def main():
    print("Seeding MongoDB Atlas database (users & products)...")
    await seed_admin()
    await seed_products()
    
    users_count = await db.users.count_documents({})
    products_count = await db.products.count_documents({})
    
    print("SUCCESS: MongoDB Atlas Seed Completed!")
    print(f"Users in Atlas: {users_count}")
    print(f"Products in Atlas: {products_count}")

if __name__ == "__main__":
    asyncio.run(main())
