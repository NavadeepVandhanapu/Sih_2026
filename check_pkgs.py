import sys

pkgs = ['easyocr', 'cv2', 'torch', 'torchvision', 'PIL', 'cairosvg', 'fitz', 'matplotlib']
for pkg in pkgs:
    try:
        m = __import__(pkg)
        ver = getattr(m, '__version__', 'ok')
        print(f"{pkg}: available ({ver})")
    except Exception as e:
        print(f"{pkg}: NOT available ({e})")
