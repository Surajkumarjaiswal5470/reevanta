import logging
import json
import base64
import urllib.request
import urllib.parse
import urllib.error
from core.config import IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT

logger = logging.getLogger("reevanta.imagekit")

UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload"

def upload_file_to_imagekit(file_bytes: bytes, fileName: str, folder: str = "/products") -> dict:
    """
    Upload a file to ImageKit via their official REST API.
    Returns response dict containing `url`, `fileId`, `name`, etc.
    """
    if not IMAGEKIT_PRIVATE_KEY:
        logger.error("IMAGEKIT_PRIVATE_KEY is missing!")
        return {"success": False, "error": "ImageKit private key not configured"}

    # Basic Auth header: base64(private_key + ":")
    auth_str = f"{IMAGEKIT_PRIVATE_KEY}:"
    b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    # ImageKit upload expects file as base64 or binary, fileName, and optional folder
    file_b64 = base64.b64encode(file_bytes).decode("utf-8")

    form_data = {
        "file": file_b64,
        "fileName": fileName,
        "folder": folder,
        "useUniqueFileName": "true"
    }

    encoded_data = urllib.parse.urlencode(form_data).encode("utf-8")

    try:
        req = urllib.request.Request(UPLOAD_URL, data=encoded_data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as res:
            body = res.read().decode("utf-8")
            data = json.loads(body)
            logger.info(f"ImageKit upload successful: {data.get('url')}")
            return {"success": True, "url": data.get("url"), "fileId": data.get("fileId")}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        logger.error(f"ImageKit upload HTTP error ({e.code}): {err_body}")
        try:
            parsed = json.loads(err_body)
            return {"success": False, "error": parsed.get("message", f"HTTP {e.code}")}
        except Exception:
            return {"success": False, "error": f"HTTP {e.code} error"}
    except Exception as e:
        logger.error(f"ImageKit upload exception: {e}")
        return {"success": False, "error": str(e)}
