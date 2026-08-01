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
    Manages active WebSocket connection pools for individual Customer Rooms and Admin Desk.
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

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        logger.info(f"WebSocket disconnected from room '{room_id}'")

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
    Real-Time WebSocket Endpoint for User & Admin Chat
    room_id can be 'user_{userId}' or 'admin'
    """
    await manager.connect(room_id, websocket)
    
    # Send existing chat history upon connection
    try:
        query_room = room_id if room_id != "admin" else {"$exists": True}
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
                msg_payload = {"text": data, "sender": "user"}

            text = msg_payload.get("text", "").strip()
            sender = msg_payload.get("sender", "user")
            target_room = msg_payload.get("room_id", room_id)
            user_name = msg_payload.get("user_name", "Customer")

            if not text:
                continue

            # Construct message document
            msg_doc = {
                "room_id": target_room,
                "sender": sender,
                "user_name": user_name,
                "text": text,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "read": False
            }

            # Persist to MongoDB
            try:
                res = await db.chat_messages.insert_one(msg_doc)
                msg_doc["_id"] = str(res.inserted_id)
                msg_doc["id"] = str(res.inserted_id)
            except Exception as e:
                logger.error(f"Error persisting chat message: {e}")
                msg_doc["id"] = f"temp-{datetime.now().timestamp()}"

            broadcast_msg = {"type": "message", "data": serialize_doc(msg_doc)}

            # Broadcast to specific customer room AND all active admin desks
            await manager.broadcast_to_room(target_room, broadcast_msg)
            if target_room != "admin":
                await manager.broadcast_to_room("admin", broadcast_msg)

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in room {room_id}: {e}")
        manager.disconnect(room_id, websocket)


@router.get("/api/chat/history/{room_id}")
async def get_chat_history(room_id: str):
    """HTTP fallback endpoint to fetch chat history for a room."""
    try:
        docs = await db.chat_messages.find({"room_id": room_id}).sort("timestamp", 1).to_list(200)
        return [serialize_doc(d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/chat/active-rooms")
async def get_active_chat_rooms():
    """Returns list of active customer rooms with latest message snippets for Admin Desk."""
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
                "count": r.get("count", 0)
            }
            for r in rooms if r["_id"] != "admin"
        ]
    except Exception as e:
        logger.error(f"Error fetching active chat rooms: {e}")
        return []
