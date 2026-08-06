with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'rb') as f:
    raw = f.read()

# Show the hex bytes around the remaining corrupted sequences
import re

# Find ðŸ pattern (c3 b0 c5 b8 in UTF-8)
pattern = bytes.fromhex('c3b0c5b8')
positions = [i for i in range(len(raw)) if raw[i:i+4] == pattern]
print(f"Found {len(positions)} remaining corrupted sequences")
for pos in positions:
    chunk = raw[pos:pos+12]
    print(f"  At {pos}: {chunk.hex()} = {repr(chunk)}")

# Decode as UTF-8 and show context
text = raw.decode('utf-8')
for m in re.finditer('\u00f0\u0178', text):
    ctx = text[m.start():m.start()+8]
    print(f"  Context chars: {[hex(ord(c)) for c in ctx]}")
