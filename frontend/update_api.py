import os
import re

src_dir = r"c:\Users\CHAKRAVENI\OneDrive\Desktop\my_new_project\frontend\src"
count = 0

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig = content
            
            # Step 1: convert quoted URLs to backticks
            # Match 'http://localhost:8000...' and convert to `http://${window.location.hostname}:8000...`
            content = re.sub(r"'http://localhost:8000([^']*)'", r"`http://${window.location.hostname}:8000\1`", content)
            content = re.sub(r'"http://localhost:8000([^"]*)"', r"`http://${window.location.hostname}:8000\1`", content)
            
            # Match 'ws://localhost:8000...' and convert to `ws://${window.location.hostname}:8000...`
            content = re.sub(r"'ws://localhost:8000([^']*)'", r"`ws://${window.location.hostname}:8000\1`", content)
            content = re.sub(r'"ws://localhost:8000([^"]*)"', r"`ws://${window.location.hostname}:8000\1`", content)
            
            # Step 2: replace any remaining localhost references (including those already inside backticks)
            content = content.replace("http://localhost:8000", "http://${window.location.hostname}:8000")
            content = content.replace("ws://localhost:8000", "ws://${window.location.hostname}:8000")
            
            if orig != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                
print(f"Updated {count} files")
