from PIL import Image

# Create a cute cat face favicon with game theme
img = Image.new('RGBA', (64, 64), (99, 102, 241, 255))  # Primary purple background

# Cat face (gray circle)
for x in range(20, 44):
    for y in range(15, 50):
        dist = ((x - 32)**2 + (y - 32)**2)**0.5
        if dist < 18:
            # Gray cat face
            img.putpixel((x, y), (200, 200, 200, 255))

# Left ear
for x in range(8, 20):
    for y in range(5, 25):
        if y < 5 + (x - 8) * 1.2:
            img.putpixel((x, y), (200, 200, 200, 255))

# Right ear
for x in range(44, 56):
    for y in range(5, 25):
        if y < 5 + (55 - x) * 1.2:
            img.putpixel((x, y), (200, 200, 200, 255))

# Eyes (black dots)
for dx in range(3):
    for dy in range(3):
        img.putpixel((25 + dx, 27 + dy), (0, 0, 0, 255))
        img.putpixel((36 + dx, 27 + dy), (0, 0, 0, 255))

# Nose (pink)
for dx in range(3):
    for dy in range(2):
        img.putpixel((31 + dx, 34 + dy), (255, 150, 150, 255))

# Mouth
for x in range(29, 36):
    img.putpixel((x, 38), (150, 150, 150, 255))

# Save as ICO
img.save(r'C:\Users\HONG PHAT\Desktop\hongphat-games\frontend\public\favicon.ico', format='ICO', sizes=[(64, 64), (32, 32), (16, 16)])
print('Favicon created successfully!')
