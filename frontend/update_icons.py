from PIL import Image
import os
import shutil

source_path = "/home/diallo/.gemini/antigravity/brain/8d253102-bc1f-46cc-a246-23dd0330b0a7/uploaded_media_1769730726119.jpg"
public_dir = "/home/diallo/ice-facture/frontend/public"

try:
    img = Image.open(source_path)
    
    # Save 192x192
    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save(os.path.join(public_dir, "pwa-192x192.png"), "PNG")
    print("Created pwa-192x192.png")

    # Save 512x512
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save(os.path.join(public_dir, "pwa-512x512.png"), "PNG")
    print("Created pwa-512x512.png")

    # Save apple-touch-icon
    img_apple = img.resize((180, 180), Image.Resampling.LANCZOS)
    img_apple.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")
    print("Created apple-touch-icon.png")

    # Also save as favicon.png (32x32)
    img_favicon = img.resize((64, 64), Image.Resampling.LANCZOS)
    img_favicon.save(os.path.join(public_dir, "favicon.png"), "PNG")
    print("Created favicon.png")

except Exception as e:
    print(f"Error: {e}")
