import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from core.database import db, serialize_doc

logger = logging.getLogger("reevanta.chat_ws")

router = APIRouter(tags=["Real-Time Chat WebSocket"])

class ConnectionManager:
    """
    Manages active WebSocket connection pools for individual Customer Rooms and Admin Desk
    with online presence tracking.
    """
    def __init__(self):
        # room_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        logger.info(f"WebSocket connected to room '{room_id}'. Total in room: {len(self.active_connections[room_id])}")

        # Broadcast online presence
        await self.broadcast_to_room(room_id, {"type": "presence", "room_id": room_id, "status": "online"})
        if room_id != "admin":
            await self.broadcast_to_room("admin", {"type": "presence", "room_id": room_id, "status": "online"})

    async def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        logger.info(f"WebSocket disconnected from room '{room_id}'")

        # Broadcast offline presence
        await self.broadcast_to_room(room_id, {"type": "presence", "room_id": room_id, "status": "offline"})
        if room_id != "admin":
            await self.broadcast_to_room("admin", {"type": "presence", "room_id": room_id, "status": "offline"})

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to websocket in room {room_id}: {e}")

manager = ConnectionManager()


@router.websocket("/ws/chat/{room_id}")
async def websocket_chat_endpoint(websocket: WebSocket, room_id: str):
    """
    Enhanced Real-Time WebSocket Endpoint supporting:
    - Real-Time Messaging
    - Typing Indicators
    - Read Receipts (✓✓)
    - Online/Offline Presence Tracking
    """
    await manager.connect(room_id, websocket)
    
    # Send existing chat history upon connection
    try:
        if room_id == "admin":
            history_docs = await db.chat_messages.find().sort("timestamp", 1).to_list(100)
        else:
            history_docs = await db.chat_messages.find({"room_id": room_id}).sort("timestamp", 1).to_list(100)

        history = [serialize_doc(doc) for doc in history_docs]
        await manager.send_personal_message({"type": "history", "data": history}, websocket)
    except Exception as e:
        logger.error(f"Error fetching history for room {room_id}: {e}")

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_payload = json.loads(data)
            except Exception:
                msg_payload = {"text": data, "type": "message", "sender": "user"}

            event_type = msg_payload.get("type", "message")
            target_room = msg_payload.get("room_id", room_id)
            sender = msg_payload.get("sender", "user")

            # 1. Typing Indicator Event
            if event_type == "typing":
                is_typing = bool(msg_payload.get("is_typing", False))
                typing_msg = {
                    "type": "typing",
                    "room_id": target_room,
                    "sender": sender,
                    "is_typing": is_typing
                }
                await manager.broadcast_to_room(target_room, typing_msg)
                if target_room != "admin":
                    await manager.broadcast_to_room("admin", typing_msg)
                continue

            # 2. Read Receipt Event
            elif event_type == "read_receipt":
                try:
                    await db.chat_messages.update_many(
                        {"room_id": target_room},
                        {"$set": {"read": True}}
                    )
                except Exception as e:
                    logger.error(f"Error updating read receipt: {e}")

                read_msg = {
                    "type": "read_receipt",
                    "room_id": target_room,
                    "read_by": sender
                }
                await manager.broadcast_to_room(target_room, read_msg)
                if target_room != "admin":
                    await manager.broadcast_to_room("admin", read_msg)
                continue

            # 3. Standard Message Event
            text = msg_payload.get("text", "").strip()
            user_name = msg_payload.get("user_name", "Customer")

            if not text:
                continue

            msg_doc = {
                "room_id": target_room,
                "sender": sender,
                "user_name": user_name,
                "text": text,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "read": False
            }

            try:
                res = await db.chat_messages.insert_one(msg_doc)
                msg_doc["_id"] = str(res.inserted_id)
                msg_doc["id"] = str(res.inserted_id)
            except Exception as e:
                logger.error(f"Error persisting chat message: {e}")
                msg_doc["id"] = f"temp-{datetime.now().timestamp()}"

            broadcast_msg = {"type": "message", "data": serialize_doc(msg_doc)}

            await manager.broadcast_to_room(target_room, broadcast_msg)
            if target_room != "admin":
                await manager.broadcast_to_room("admin", broadcast_msg)

    except WebSocketDisconnect:
        await manager.disconnect(room_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in room {room_id}: {e}")
        await manager.disconnect(room_id, websocket)


@router.get("/api/chat/history/{room_id}")
async def get_chat_history(room_id: str):
    """HTTP fallback endpoint to fetch chat history."""
    try:
        docs = await db.chat_messages.find({"room_id": room_id}).sort("timestamp", 1).to_list(200)
        return [serialize_doc(d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/chat/active-rooms")
async def get_active_chat_rooms():
    """Returns list of active customer rooms with unread counts for Admin Desk."""
    try:
        pipeline = [
            {"$sort": {"timestamp": -1}},
            {
                "$group": {
                    "_id": "$room_id",
                    "latest_message": {"$first": "$text"},
                    "latest_timestamp": {"$first": "$timestamp"},
                    "user_name": {"$first": "$user_name"},
                    "sender": {"$first": "$sender"},
                    "unread_count": {
                        "$sum": {
                            "$cond": [
                                {"$and": [{"$eq": ["$read", False]}, {"$eq": ["$sender", "user"]}]},
                                1,
                                0
                            ]
                        }
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"latest_timestamp": -1}}
        ]
        cursor = db.chat_messages.aggregate(pipeline)
        rooms = await cursor.to_list(100)
        return [
            {
                "room_id": r["_id"],
                "user_name": r.get("user_name") or "Customer",
                "latest_message": r.get("latest_message"),
                "latest_timestamp": r.get("latest_timestamp"),
                "unread_count": r.get("unread_count", 0),
                "count": r.get("count", 0)
            }
            for r in rooms if r["_id"] != "admin"
        ]
    except Exception as e:
        logger.error(f"Error fetching active chat rooms: {e}")
        return []
