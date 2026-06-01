import json, os
BASE = r"C:/Users/AI INNOVATIONS/Desktop/VedicAstra/Backend/translations"

def load(lang, fname):
    with open(os.path.join(BASE, lang, fname), "r", encoding="utf-8") as f:
        return json.load(f)

# Investigate horoscope.json structural mismatch
en = load("en", "horoscope.json")
hi = load("hi", "horoscope.json")

# Look at one shared path
def peek(obj, path):
    for p in path:
        if isinstance(obj, dict) and p in obj:
            obj = obj[p]
        else:
            return None
    return obj

paths = [
    ["alert", "benefic_transit", "career"],
    ["love"],
    ["tip"],
]
for p in paths:
    ev = peek(en, p)
    hv = peek(hi, p)
    print("PATH:", p)
    print("  en type:", type(ev).__name__, "| sample:", (ev if not isinstance(ev,(list,dict)) else (ev[:1] if isinstance(ev,list) else list(ev.keys())[:3])))
    print("  hi type:", type(hv).__name__, "| sample:", (hv if not isinstance(hv,(list,dict)) else (hv[:1] if isinstance(hv,list) else list(hv.keys())[:3])))
    print()

# Top-level shape comparison
print("EN top-level keys:", sorted(en.keys()))
print("HI top-level keys:", sorted(hi.keys()))
