import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.database import db, serialize_doc

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("reevanta.backup")

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "..", "backups")

COLLECTIONS_TO_BACKUP = ["users", "products", "orders", "vouchers", "addresses", "chat_messages"]

async def run_backup():
    """
    Executes an automated database dump for MongoDB collections
    and prunes snapshots older than 7 days.
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    snapshot_dir = os.path.join(BACKUP_DIR, f"snapshot_{timestamp}")
    os.makedirs(snapshot_dir, exist_ok=True)

    logger.info(f"Starting MongoDB backup to '{snapshot_dir}'...")

    total_records = 0
    for coll_name in COLLECTIONS_TO_BACKUP:
        try:
            coll = getattr(db, coll_name)
            docs = await coll.find().to_list(10000)
            serialized = [serialize_doc(d) for d in docs]
            
            out_file = os.path.join(snapshot_dir, f"{coll_name}.json")
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(serialized, f, indent=2, default=str)
            
            count = len(serialized)
            total_records += count
            logger.info(f"  └─ Backed up '{coll_name}': {count} documents.")
        except Exception as e:
            logger.error(f"Failed to backup collection '{coll_name}': {e}")

    logger.info(f"Backup complete! Total documents backed up: {total_records}")

    # Prune snapshots older than 7 days
    prune_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    if os.path.exists(BACKUP_DIR):
        for entry in os.listdir(BACKUP_DIR):
            entry_path = os.path.join(BACKUP_DIR, entry)
            if os.path.isdir(entry_path) and entry.startswith("snapshot_"):
                try:
                    mtime = datetime.fromtimestamp(os.path.getmtime(entry_path), timezone.utc)
                    if mtime < prune_cutoff:
                        import shutil
                        shutil.rmtree(entry_path)
                        logger.info(f"Pruned old backup snapshot: {entry}")
                except Exception as err:
                    logger.warning(f"Error pruning snapshot {entry}: {err}")

if __name__ == "__main__":
    asyncio.run(run_backup())
