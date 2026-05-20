import os
import re

directory = 'src/app/admin'

replacements = [
    (r'border-white/\[0\.\d+\]', r'border-[var(--border)]'),
    (r'border-white/10', r'border-[var(--border-hover)]'),
    (r'border-white/\[0\.15\]', r'border-[var(--border-hover)]'),
    (r'bg-white/\[0\.\d+\]', r'bg-[var(--input-bg)]'),
    (r'bg-white/10', r'bg-[var(--border)]'),
    (r'text-zinc-[345]00', r'text-[var(--text-secondary)]'),
    (r'text-zinc-600', r'text-[var(--text-muted)]'),
    (r'(?<!-)text-white', r'text-[var(--text-primary)]'),
    (r'border-zinc-600', r'border-[var(--border-hover)]'),
    (r'hover:border-white/10', r'hover:border-[var(--border-hover)]'),
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in replacements:
                new_content = re.sub(pattern, replacement, new_content)
            
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)
                print(f"Updated {path}")

