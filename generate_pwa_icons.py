import os
from PIL import Image

def generate_icons():
    # Paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    source_image_path = os.path.join(base_dir, 'public', 'logo.png')
    icons_dir = os.path.join(base_dir, 'public', 'icons')
    
    # Check if source exists
    if not os.path.exists(source_image_path):
        print(f"Error: Source image not found at {source_image_path}")
        return
        
    # Create output directory if it doesn't exist
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
        
    # Desired sizes
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    try:
        # Open the source image
        with Image.open(source_image_path) as img:
            # Convert to RGBA if it isn't already to preserve transparency
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
                
            print(f"Opened {source_image_path} ({img.width}x{img.height})")
            
            # Generate each size
            for size in sizes:
                # Calculate dimensions preserving aspect ratio and adding padding
                # PWA icons usually work best when they have a bit of padding
                output_size = (size, size)
                
                # Create a new blank (transparent) image
                new_img = Image.new('RGBA', output_size, (255, 255, 255, 0))
                
                # Calculate padding (10% of size)
                padding = int(size * 0.1)
                inner_size = size - (2 * padding)
                
                # Resize original image to fit within inner_size
                ratio = min(inner_size / img.width, inner_size / img.height)
                new_width = int(img.width * ratio)
                new_height = int(img.height * ratio)
                
                resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Paste the resized image into the center of the new image
                x_offset = (size - new_width) // 2
                y_offset = (size - new_height) // 2
                
                # We want a solid background color (the dark brown #1b130e) for maskable icons
                # So we'll fill the background with white or the theme color
                # Actually, standard icons are usually transparent, maskable ones can be solid
                # We'll just stick to standard transparent/logo ones
                
                new_img.paste(resized_img, (x_offset, y_offset), resized_img)
                
                # Save
                output_path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
                new_img.save(output_path, 'PNG')
                print(f"Generated {output_path}")
                
        print("Successfully generated all PWA icons!")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    generate_icons()
