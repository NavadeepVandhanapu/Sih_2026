import cv2
import numpy as np

img = cv2.imread("apps/api/uploads/scan_1789495186532_2f09bbf169cb1336.jpeg")
print("Image shape:", img.shape)
print("Min pixel:", img.min(), "Max pixel:", img.max(), "Mean pixel:", img.mean())

# Crop regions where text might exist and inspect average color/contrast
h, w = img.shape[:2]
bottom = img[int(h*0.7):h, 0:w]
print("Bottom region mean BGR:", bottom.mean(axis=(0,1)))
