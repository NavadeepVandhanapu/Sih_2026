from pydantic import BaseModel
from typing import List, Optional

class ImageMeta(BaseModel):
    width: int
    height: int
    channels: int

class QualityMetrics(BaseModel):
    score: float
    blur_variance: float
    brightness: float
    contrast: float
    resolution_status: str
    is_usable: bool

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class OCRRegion(BaseModel):
    text: str
    confidence: float
    boundingBox: BoundingBox
    polygon: List[List[float]]

class OCRResponse(BaseModel):
    success: bool
    provider: str
    image: ImageMeta
    quality: QualityMetrics
    rawText: str
    wordCount: int
    lines: List[str]
    regions: List[OCRRegion]
    error: Optional[str] = None
