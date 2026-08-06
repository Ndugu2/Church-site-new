"""Fix all double-encoded UTF-8 characters caused by PowerShell encoding corruption."""

with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'rb') as f:
    raw = f.read()

# Map: corrupted UTF-8 bytes -> original UTF-8 bytes
# These come from reading UTF-8 as Windows-1252 and re-encoding as UTF-8
# 
# For each original UTF-8 byte >= 0x80:
#   original_byte -> windows1252_codepoint -> re-encoded as UTF-8
#
# Windows-1252 special mappings (0x80-0x9F):
WIN1252_MAP = {
    0x80: 0x20AC,  # €
    0x82: 0x201A,  # ‚
    0x83: 0x0192,  # ƒ
    0x84: 0x201E,  # „
    0x85: 0x2026,  # …
    0x86: 0x2020,  # †
    0x87: 0x2021,  # ‡
    0x88: 0x02C6,  # ˆ
    0x89: 0x2030,  # ‰
    0x8A: 0x0160,  # Š
    0x8B: 0x2039,  # ‹
    0x8C: 0x0152,  # Œ
    0x8E: 0x017D,  # Ž
    0x91: 0x2018,  # '
    0x92: 0x2019,  # '
    0x93: 0x201C,  # "
    0x94: 0x201D,  # "
    0x95: 0x2022,  # •
    0x96: 0x2013,  # –
    0x97: 0x2014,  # —
    0x98: 0x02DC,  # ˜
    0x99: 0x2122,  # ™
    0x9A: 0x0161,  # š
    0x9B: 0x203A,  # ›
    0x9C: 0x0153,  # œ
    0x9E: 0x017E,  # ž
    0x9F: 0x0178,  # Ÿ
}

def byte_to_win1252_codepoint(b):
    """Convert a byte value to its Windows-1252 Unicode codepoint."""
    if b in WIN1252_MAP:
        return WIN1252_MAP[b]
    elif b == 0x81 or b == 0x8D or b == 0x8F or b == 0x90 or b == 0x9D:
        # Undefined in Windows-1252 — treated as the raw codepoint
        return b
    elif b >= 0xA0:
        # ISO-8859-1 range: direct mapping
        return b
    else:
        return b  # ASCII

def encode_codepoint_utf8(cp):
    """Encode a Unicode codepoint as UTF-8 bytes."""
    try:
        return chr(cp).encode('utf-8')
    except:
        return bytes([cp])

def build_reverse_map():
    """Build a mapping from corrupted byte sequences back to original UTF-8."""
    replacements = []
    
    # For 3-byte UTF-8 sequences (U+0800 to U+FFFF): E2 XX YY, E3 XX YY, etc.
    # Byte 0 range: 0xE0-0xEF (for 3-byte), 0xF0-0xF4 (for 4-byte)
    for b0 in range(0xE0, 0xFF):
        cp0 = byte_to_win1252_codepoint(b0)
        corrupted_b0 = encode_codepoint_utf8(cp0)
        
        for b1 in range(0x80, 0xC0):  # continuation bytes
            cp1 = byte_to_win1252_codepoint(b1)
            corrupted_b1 = encode_codepoint_utf8(cp1)
            
            for b2 in range(0x80, 0xC0):  # continuation bytes
                cp2 = byte_to_win1252_codepoint(b2)
                corrupted_b2 = encode_codepoint_utf8(cp2)
                
                original = bytes([b0, b1, b2])
                corrupted = corrupted_b0 + corrupted_b1 + corrupted_b2
                
                if len(corrupted) > 3 and corrupted != original:
                    # Verify the original is valid UTF-8
                    try:
                        original.decode('utf-8')
                        replacements.append((corrupted, original))
                    except:
                        pass
    
    return replacements

print("Building reverse map for 3-byte UTF-8 sequences...")
replacements = build_reverse_map()
# Sort by length descending to avoid partial replacements
replacements.sort(key=lambda x: -len(x[0]))
print(f"Found {len(replacements)} potential mappings")

# Apply replacements
fixed = raw
total_fixes = 0
for corrupted, original in replacements:
    count = fixed.count(corrupted)
    if count > 0:
        fixed = fixed.replace(corrupted, original)
        total_fixes += count
        try:
            print(f"Fixed {count}x: {original.decode('utf-8')!r}")
        except:
            pass

# Also handle 4-byte sequences (already done in fix_emojis*.py but verify)
remaining_4byte = fixed.count(bytes.fromhex('c3b0c5b8'))
print(f"\nRemaining 4-byte emoji corruptions: {remaining_4byte}")
print(f"Total 3-byte fixes applied: {total_fixes}")

with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'wb') as f:
    f.write(fixed)

# Verify valid UTF-8
try:
    fixed.decode('utf-8')
    print("File is valid UTF-8 ✓")
except Exception as e:
    print(f"UTF-8 validation error: {e}")
