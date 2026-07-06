import re

VOWELS = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah', 'ऑ': 'o'
}

MATRAS = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h', 'ॅ': 'e'
}

CONSONANTS = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy',
    'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f'
}

VIRAMA = '्'

def transliterate_devanagari_to_roman(text: str) -> str:
    words = text.split(' ')
    result_words = []
    
    for word in words:
        if not re.search(r'[\u0900-\u097F]', word):
            result_words.append(word)
            continue
            
        transliterated = ""
        i = 0
        n = len(word)
        
        while i < n:
            char = word[i]
            
            if char in CONSONANTS:
                base = CONSONANTS[char]
                
                if i + 1 < n:
                    next_char = word[i + 1]
                    
                    if next_char == VIRAMA:
                        transliterated += base
                        i += 2
                        continue
                    elif next_char in MATRAS:
                        transliterated += base + MATRAS[next_char]
                        i += 2
                        continue
                
                if i + 1 == n or (i + 1 < n and word[i + 1] in ['।', ',', '.', '!', '?', '-', '\n']):
                    transliterated += base
                else:
                    transliterated += base + 'a'
                i += 1
                
            elif char in VOWELS:
                transliterated += VOWELS[char]
                i += 1
            elif char in MATRAS:
                transliterated += MATRAS[char]
                i += 1
            elif char == '।':
                transliterated += '.'
                i += 1
            else:
                transliterated += char
                i += 1
                
        result_words.append(transliterated)
        
    return ' '.join(result_words)

# Quick self-test output to text file to avoid windows cp1252 print crashes
test_cases = [
    ("नमस्ते", "namaste"),
    ("आप कैसे हैं?", "aap kaise hain?"),
    ("भारत", "bharat"),
    ("मेरा नाम अमित है।", "mera naam amit hai.")
]

with open("scratch/test_output.txt", "w", encoding="utf-8") as f:
    for dev, expected in test_cases:
        res = transliterate_devanagari_to_roman(dev)
        f.write(f"Devanagari: {dev} -> Romanized: {res} (Expected: {expected})\n")

print("Test complete. Output written to scratch/test_output.txt")
