from fastapi import APIRouter, UploadFile, File, HTTPException
from services.imagekit_service import upload_file_to_imagekit

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("")
async def upload_image(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="File is empty")
        
    res = upload_file_to_imagekit(contents, file.filename)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Image upload failed"))
        
    return {
        "url": res["url"],
        "fileId": res.get("fileId"),
        "message": "Image uploaded successfully to ImageKit"
    }
