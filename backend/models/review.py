"""
Enterprise Review & Ratings Pydantic Models
Covers customer reviews, voting, reporting, admin moderation, and seller replies.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from enum import Enum


# ──────────────────── Enums ────────────────────

class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"
    SPAM = "spam"
    SOFT_DELETED = "soft_deleted"


class ReportReason(str, Enum):
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    FAKE = "fake"
    OFF_TOPIC = "off_topic"
    HARASSMENT = "harassment"
    OTHER = "other"


class VoteType(str, Enum):
    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"


class ReactionType(str, Enum):
    LIKE = "like"
    LOVE = "love"
    USEFUL = "useful"


class ReviewSortBy(str, Enum):
    RECENT = "recent"
    HIGHEST = "highest"
    LOWEST = "lowest"
    HELPFUL = "helpful"
    VERIFIED = "verified"
    WITH_IMAGES = "with_images"
    WITH_VIDEOS = "with_videos"


# ──────────────────── Customer Review Models ────────────────────

class ReviewCreate(BaseModel):
    """Submit a new product review."""
    userName: str = Field(..., min_length=1, max_length=100)
    userEmail: Optional[str] = None
    rating: int = Field(5, ge=1, le=5)
    fitRating: Optional[int] = Field(3, ge=1, le=5)
    qualityRating: Optional[int] = Field(5, ge=1, le=5)
    valueRating: Optional[int] = Field(5, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    comment: str = Field(..., min_length=10, max_length=5000)
    photoUrl: Optional[str] = None
    photos: List[str] = Field(default_factory=list)
    videos: List[str] = Field(default_factory=list)
    anonymous: bool = False
    order_id: Optional[str] = None
    verifiedPurchase: Optional[bool] = None

    @field_validator("photos")
    @classmethod
    def limit_photos(cls, v):
        if len(v) > 10:
            raise ValueError("Maximum 10 photos allowed per review")
        return v

    @field_validator("videos")
    @classmethod
    def limit_videos(cls, v):
        if len(v) > 3:
            raise ValueError("Maximum 3 videos allowed per review")
        return v


class ReviewUpdate(BaseModel):
    """Edit an existing review within the allowed time window."""
    rating: Optional[int] = Field(None, ge=1, le=5)
    fitRating: Optional[int] = Field(None, ge=1, le=5)
    qualityRating: Optional[int] = Field(None, ge=1, le=5)
    valueRating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    comment: Optional[str] = Field(None, min_length=10, max_length=5000)
    photos: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    anonymous: Optional[bool] = None


# ──────────────────── Voting & Reactions ────────────────────

class ReviewVote(BaseModel):
    """Customer casts a helpful/not-helpful vote."""
    vote_type: VoteType = VoteType.HELPFUL


class ReviewReaction(BaseModel):
    """Lightweight reaction (like / love / useful)."""
    reaction_type: ReactionType = ReactionType.LIKE


# ──────────────────── Reporting ────────────────────

class ReviewReport(BaseModel):
    """Customer reports an inappropriate review."""
    reason: ReportReason = ReportReason.INAPPROPRIATE
    comment: Optional[str] = Field(None, max_length=1000)


# ──────────────────── Admin Moderation ────────────────────

class AdminReviewModeration(BaseModel):
    """Admin approves, rejects, or flags a review."""
    status: ReviewStatus
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None


class AdminBulkAction(BaseModel):
    """Bulk moderation action on multiple reviews."""
    review_ids: List[str] = Field(..., min_length=1)
    action: str = Field(..., pattern="^(approve|reject|soft_delete|hard_delete|flag|spam)$")
    reason: Optional[str] = None


class AdminUserBan(BaseModel):
    """Ban a user from posting reviews."""
    reason: str = Field(..., min_length=5, max_length=500)
    duration_days: Optional[int] = None  # None = permanent


# ──────────────────── Seller / Admin Reply ────────────────────

class SellerReviewReply(BaseModel):
    """Official seller or admin reply to a customer review."""
    responseText: str = Field(..., min_length=5, max_length=2000)


# ──────────────────── Query Filters ────────────────────

class ReviewQueryFilter(BaseModel):
    """Query parameters for fetching reviews."""
    sort_by: ReviewSortBy = ReviewSortBy.RECENT
    rating_filter: Optional[int] = Field(None, ge=1, le=5)
    verified_only: bool = False
    with_photos: bool = False
    with_videos: bool = False
    search: Optional[str] = None
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)
    status: Optional[ReviewStatus] = None
