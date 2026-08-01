from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from services.atlas_search_service import execute_atlas_search

router = APIRouter(prefix="/search", tags=["Atlas Search"])

@router.get("")
async def search_endpoint(
    q: Optional[str] = Query(None, description="Search keyword"),
    category: Optional[str] = Query(None, description="Filter by category"),
    minPrice: Optional[float] = Query(None, description="Filter minimum price"),
    maxPrice: Optional[float] = Query(None, description="Filter maximum price"),
    city: Optional[str] = Query(None, description="Filter by city"),
    sortBy: Optional[str] = Query("relevance", description="Sort order: relevance, newest, price_low, price_high"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    """
    MongoDB Atlas Search GET Endpoint
    GET /api/search?q=keyword&category=Fashion&minPrice=100&maxPrice=5000&city=Kathmandu&sortBy=relevance&page=1&limit=10
    """
    try:
        results = await execute_atlas_search(
            query=q,
            category=category,
            min_price=minPrice,
            max_price=maxPrice,
            city=city,
            sort_by=sortBy,
            page=page,
            limit=limit
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Atlas Search operation failed: {str(e)}")
