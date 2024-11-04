import os
import requests

def download_image(url, filename):
    try:
        # Create static/images directory if it doesn't exist
        os.makedirs('static/images', exist_ok=True)
        
        # Download and save the image
        response = requests.get(url)
        response.raise_for_status()
        
        with open(f'static/images/{filename}', 'wb') as f:
            f.write(response.content)
        print(f"Successfully downloaded {filename}")
    except Exception as e:
        print(f"Error downloading {filename}: {str(e)}")

# Download required images
images = {
    'pallet.jpg': 'https://images.unsplash.com/photo-1635513439661-7464ff1a6b12',
    'staff.jpg': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902',
    'accounting.jpg': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c'
}

for filename, url in images.items():
    download_image(url, filename)
