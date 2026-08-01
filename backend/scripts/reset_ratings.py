"""Utility script to purge all existing product reviews and reset rating fields.

The application previously seeded fake reviews with static rating values. To
provide a clean, real‑world rating system we remove those documents and set the
rating and reviewsCount of every product back to zero. After running this script
the API will compute fresh averages based on newly submitted reviews.

Run with:
    python -m backend.scripts.reset_ratings
"""

import asyncio
from core.database import db
from core.config import MONGO_URL

async def reset():
    # Delete all review documents
    delete_result = await db.reviews.delete_many({})
    print(f"Deleted {delete_result.deleted_count} review documents")

    # Reset rating and reviewsCount on every product
    update_result = await db.products.update_many(
        {},
        {"$set": {"rating": 0.0, "reviewsCount": 0}},
    )
    print(f"Updated {update_result.modified_count} products to reset ratings")

if __name__ == "__main__":
    asyncio.run(reset())
