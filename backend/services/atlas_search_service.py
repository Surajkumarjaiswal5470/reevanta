import logging
from typing import Dict, Any, List, Optional
from core.database import db, serialize_doc

logger = logging.getLogger("reevanta.atlas_search")

INDEX_NAME = "default"

def build_atlas_search_pipeline(
    query: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    city: Optional[str] = None,
    sort_by: Optional[str] = "relevance",
    page: int = 1,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Constructs a MongoDB Aggregation Pipeline using MongoDB Atlas Search ($search)
    with fuzzy autocomplete, compound filter clauses, searchScore projection, and facet pagination.
    """
    pipeline = []
    has_query = bool(query and query.strip())

    if has_query:
        clean_q = query.strip()
        search_stage = {
            "$search": {
                "index": INDEX_NAME,
                "compound": {
                    "should": [
                        {
                            "autocomplete": {
                                "query": clean_q,
                                "path": "title",
                                "fuzzy": {"maxEdits": 2, "prefixLength": 1},
                                "score": {"boost": {"value": 3}}
                            }
                        },
                        {
                            "text": {
                                "query": clean_q,
                                "path": ["title", "category", "tags"],
                                "fuzzy": {"maxEdits": 2},
                                "score": {"boost": {"value": 2}}
                            }
                        },
                        {
                            "text": {
                                "query": clean_q,
                                "path": ["description", "location.city"],
                                "fuzzy": {"maxEdits": 2}
                            }
                        }
                    ],
                    "minimumShouldMatch": 1
                }
            }
        }

        # Add filter clauses inside compound filter if needed
        filter_clauses = []
        if category:
            filter_clauses.append({"text": {"query": category, "path": "category"}})
        if city:
            filter_clauses.append({"text": {"query": city, "path": "location.city"}})
        if min_price is not None or max_price is not None:
            range_clause = {"path": "price"}
            if min_price is not None:
                range_clause["gte"] = min_price
            if max_price is not None:
                range_clause["lte"] = max_price
            filter_clauses.append({"range": range_clause})

        if filter_clauses:
            search_stage["$search"]["compound"]["filter"] = filter_clauses

        pipeline.append(search_stage)

    else:
        # Gracefully handle empty queries: match all products
        match_query = {}
        if category:
            match_query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        if city:
            match_query["location.city"] = {"$regex": f"^{city}$", "$options": "i"}
        if min_price is not None or max_price is not None:
            match_query["price"] = {}
            if min_price is not None:
                match_query["price"]["$gte"] = min_price
            if max_price is not None:
                match_query["price"]["$lte"] = max_price

        pipeline.append({"$match": match_query})

    # Add $match for non-Atlas Search filtering fallback if query was present
    if has_query:
        post_match = {}
        if category:
            post_match["category"] = {"$regex": f"^{category}$", "$options": "i"}
        if city:
            post_match["location.city"] = {"$regex": f"^{city}$", "$options": "i"}
        if min_price is not None or max_price is not None:
            post_match["price"] = {}
            if min_price is not None:
                post_match["price"]["$gte"] = min_price
            if max_price is not None:
                post_match["price"]["$lte"] = max_price
        if post_match:
            pipeline.append({"$match": post_match})

    # Sorting
    sort_stage = {}
    if sort_by == "price_low":
        sort_stage = {"price": 1}
    elif sort_by == "price_high":
        sort_stage = {"price": -1}
    elif sort_by == "newest":
        sort_stage = {"created_at": -1, "_id": -1}
    else:
        if has_query:
            sort_stage = {"score": {"$meta": "searchScore"}}
        else:
            sort_stage = {"created_at": -1, "_id": -1}

    if sort_stage:
        pipeline.append({"$sort": sort_stage})

    # Skip and Limit calculation
    skip = (page - 1) * limit

    # Projection format
    project_fields = {
        "_id": {"$toString": "$_id"},
        "title": {"$ifNull": ["$title", "$name"]},
        "price": {"$ifNull": ["$price", 0]},
        "category": {"$ifNull": ["$category", "General"]},
        "thumbnail": {"$ifNull": ["$thumbnail", {"$ifNull": ["$image", ""]}]},
        "location": {"$ifNull": ["$location", {"city": "Kathmandu"}]},
        "description": {"$ifNull": ["$description", ""]},
        "score": {"$ifNull": [{"$meta": "searchScore"}, 1.0]}
    }

    # Facet Pipeline for single-query pagination
    facet_stage = {
        "$facet": {
            "metadata": [{"$count": "total"}],
            "data": [
                {"$skip": skip},
                {"$limit": limit},
                {"$project": project_fields}
            ]
        }
    }
    pipeline.append(facet_stage)

    return pipeline


async def execute_atlas_search(
    query: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    city: Optional[str] = None,
    sort_by: Optional[str] = "relevance",
    page: int = 1,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Executes MongoDB Atlas Search aggregation pipeline with automatic fallback to standard Mongo query
    if Atlas Search Index is not yet initialized or deployed.
    """
    pipeline = build_atlas_search_pipeline(
        query=query,
        category=category,
        min_price=min_price,
        max_price=max_price,
        city=city,
        sort_by=sort_by,
        page=page,
        limit=limit
    )

    try:
        cursor = db.products.aggregate(pipeline)
        result_list = await cursor.to_list(length=1)
        
        if result_list and len(result_list) > 0:
            facet_res = result_list[0]
            metadata = facet_res.get("metadata", [])
            total = metadata[0]["total"] if metadata else 0
            items = facet_res.get("data", [])
            
            total_pages = max(1, (total + limit - 1) // limit) if total > 0 else 1
            has_more = page < total_pages

            return {
                "items": items,
                "total": total,
                "page": page,
                "limit": limit,
                "pages": total_pages,
                "has_more": has_more
            }

    except Exception as err:
        logger.warning(f"Atlas Search fallback triggered: {err}")
        # Fallback to standard MongoDB query if Atlas Search stage errors
        return await fallback_standard_search(
            query=query,
            category=category,
            min_price=min_price,
            max_price=max_price,
            city=city,
            sort_by=sort_by,
            page=page,
            limit=limit
        )

    return {"items": [], "total": 0, "page": page, "limit": limit, "pages": 1, "has_more": False}


async def fallback_standard_search(
    query: Optional[str],
    category: Optional[str],
    min_price: Optional[float],
    max_price: Optional[float],
    city: Optional[str],
    sort_by: Optional[str],
    page: int,
    limit: int
) -> Dict[str, Any]:
    """Fallback query method using standard MongoDB regex matching."""
    match_query = {}
    if query and query.strip():
        regex = f".*{query.strip()}.*"
        match_query["$or"] = [
            {"name": {"$regex": regex, "$options": "i"}},
            {"title": {"$regex": regex, "$options": "i"}},
            {"description": {"$regex": regex, "$options": "i"}},
            {"category": {"$regex": regex, "$options": "i"}},
            {"tags": {"$regex": regex, "$options": "i"}},
            {"location.city": {"$regex": regex, "$options": "i"}}
        ]
    if category:
        match_query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    if city:
        match_query["location.city"] = {"$regex": f"^{city}$", "$options": "i"}
    if min_price is not None or max_price is not None:
        match_query["price"] = {}
        if min_price is not None:
            match_query["price"]["$gte"] = min_price
        if max_price is not None:
            match_query["price"]["$lte"] = max_price

    sort_order = [("created_at", -1)]
    if sort_by == "price_low":
        sort_order = [("price", 1)]
    elif sort_by == "price_high":
        sort_order = [("price", -1)]

    total = await db.products.count_documents(match_query)
    skip = (page - 1) * limit
    cursor = db.products.find(match_query).sort(sort_order).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    
    serialized_items = []
    for doc in docs:
        item = serialize_doc(doc)
        item["score"] = 1.0
        item["thumbnail"] = item.get("thumbnail") or item.get("image", "")
        item["title"] = item.get("title") or item.get("name", "")
        serialized_items.append(item)

    total_pages = max(1, (total + limit - 1) // limit) if total > 0 else 1
    return {
        "items": serialized_items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": total_pages,
        "has_more": page < total_pages
    }
