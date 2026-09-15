import cv2
import numpy as np

def parse_svg_to_numpy(svg_bytes: bytes) -> np.ndarray:
    import xml.etree.ElementTree as ET
    from PIL import Image, ImageDraw, ImageFont
    
    # Try parsing text elements from SVG to render onto PIL canvas
    try:
        root = ET.fromstring(svg_bytes)
        # Extract width and height from viewBox or attributes
        viewbox = root.attrib.get('viewBox', '0 0 800 1000').split()
        w = int(float(viewbox[2])) if len(viewbox) >= 4 else 800
        h = int(float(viewbox[3])) if len(viewbox) >= 4 else 1000
        
        canvas = Image.new("RGB", (w, h), (255, 255, 255))
        draw = ImageDraw.Draw(canvas)
        
        # Simple SVG text parser
        for elem in root.iter():
            tag = elem.tag.split('}')[-1]
            if tag == 'text':
                x = float(elem.attrib.get('x', 50))
                y = float(elem.attrib.get('y', 50))
                font_size = int(float(elem.attrib.get('font-size', 16)))
                text_content = elem.text or ''
                if text_content.strip():
                    try:
                        font = ImageFont.truetype("arial.ttf", font_size)
                    except:
                        font = ImageFont.load_default()
                    draw.text((x, y - font_size*0.8), text_content, fill=(0, 0, 0), font=font)
        
        return cv2.cvtColor(np.array(canvas), cv2.COLOR_RGB2BGR)
    except Exception as e:
        print("SVG parse error:", e)
        return np.full((800, 600, 3), 255, dtype=np.uint8)

with open("public/samples/apex_biscuits.svg", "rb") as f:
    svg_data = f.read()

img = parse_svg_to_numpy(svg_data)
print("Rendered SVG shape:", img.shape)
cv2.imwrite("test_svg_render.png", img)

import easyocr
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
res = reader.readtext(img)
print(f"Detected {len(res)} regions in rendered SVG:")
for bbox, text, conf in res:
    print(f"  [{conf:.3f}] {text}")
