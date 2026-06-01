import json, os
BASE = r"C:/Users/AI INNOVATIONS/Desktop/VedicAstra/Backend/translations"
FILES = ["alerts.json", "astro.json", "consultation.json", "family.json",
         "horoscope.json", "kundli.json", "match.json", "messages.json"]
LANGS = ["hi", "ko"]
SEP = "\x1f"  # unit separator, won't appear in real keys

def flatten(obj, prefix=""):
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            nk = f"{prefix}{SEP}{k}" if prefix else k
            if isinstance(v, (dict, list)):
                out.update(flatten(v, nk))
            else:
                out[nk] = v
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            nk = f"{prefix}{SEP}[{i}]"
            if isinstance(v, (dict, list)):
                out.update(flatten(v, nk))
            else:
                out[nk] = v
    else:
        out[prefix] = obj
    return out

def load(lang, fname):
    with open(os.path.join(BASE, lang, fname), "r", encoding="utf-8") as f:
        return json.load(f)

def display(k):
    return k.replace(SEP, " > ")

def section_of(k):
    return k.split(SEP, 1)[0]

print(f"{'file':<22} {'lang':<4} {'en':>5} {'tr':>5} {'miss':>5} {'extra':>5} {'idEN':>5} {'idLong':>6} {'empty':>5}")
print("-"*70)

details = {}
for fname in FILES:
    en = flatten(load("en", fname))
    for lang in LANGS:
        try:
            tr = flatten(load(lang, fname))
        except Exception as e:
            print(f"{fname:<22} {lang:<4}  LOAD ERROR: {e}")
            continue
        en_keys = set(en); tr_keys = set(tr)
        missing = en_keys - tr_keys
        extra = tr_keys - en_keys
        identical = []; ident_long = []; empty = []
        for k in en_keys & tr_keys:
            ev, tv = en[k], tr[k]
            if isinstance(ev, str) and isinstance(tv, str):
                if tv == "":
                    empty.append(k)
                elif tv == ev:
                    identical.append(k)
                    if len(ev) > 25 or len(ev.split()) > 2:
                        ident_long.append(k)
        print(f"{fname:<22} {lang:<4} {len(en):>5} {len(tr):>5} {len(missing):>5} {len(extra):>5} {len(identical):>5} {len(ident_long):>6} {len(empty):>5}")
        details[(fname, lang)] = (missing, extra, identical, ident_long, empty, en, tr)

# Detail for interesting files
print("\n===== DETAIL: horoscope.json =====")
for lang in LANGS:
    miss, extra, ident, ident_long, empty, en, tr = details[("horoscope.json", lang)]
    sec = {}
    for k in miss:
        s = section_of(k); sec[s] = sec.get(s, 0) + 1
    print(f"\n[{lang}] missing by top-section:")
    for s, c in sorted(sec.items(), key=lambda x: -x[1]):
        print(f"   {s}: {c}")
    sec = {}
    for k in extra:
        s = section_of(k); sec[s] = sec.get(s, 0) + 1
    print(f"[{lang}] extra by top-section:")
    for s, c in sorted(sec.items(), key=lambda x: -x[1]):
        print(f"   {s}: {c}")
    print(f"[{lang}] missing samples:")
    for k in sorted(miss)[:6]:
        print("   ", display(k))
    print(f"[{lang}] extra samples:")
    for k in sorted(extra)[:6]:
        print("   ", display(k))

print("\n===== DETAIL: astro.json =====")
for lang in LANGS:
    miss, extra, ident, ident_long, empty, en, tr = details[("astro.json", lang)]
    if not miss and not extra:
        print(f"[{lang}] clean")
        continue
    print(f"[{lang}] missing ({len(miss)}):")
    for k in sorted(miss)[:8]:
        print("   ", display(k))
    print(f"[{lang}] extra ({len(extra)}):")
    for k in sorted(extra)[:15]:
        print("   ", display(k))

# Probe whether horoscope.json hi/ko values for "extra" keys are scalar vs list (structural mismatch)
print("\n===== STRUCTURAL probe: horoscope.json en vs hi =====")
en_raw = load("en", "horoscope.json")
hi_raw = load("hi", "horoscope.json")
ko_raw = load("ko", "horoscope.json")
shared_top = set(en_raw) & set(hi_raw)
mismatches = 0
samples = []
for k in shared_top:
    et, ht = type(en_raw[k]).__name__, type(hi_raw[k]).__name__
    if et != ht:
        mismatches += 1
        if len(samples) < 5:
            samples.append((k, et, ht))
print(f"hi: shared top-level keys: {len(shared_top)}, type mismatches: {mismatches}")
for s in samples:
    print("  ", s)

shared_top = set(en_raw) & set(ko_raw)
mismatches = 0; samples = []
for k in shared_top:
    et, kt = type(en_raw[k]).__name__, type(ko_raw[k]).__name__
    if et != kt:
        mismatches += 1
        if len(samples) < 5:
            samples.append((k, et, kt))
print(f"ko: shared top-level keys: {len(shared_top)}, type mismatches: {mismatches}")
for s in samples:
    print("  ", s)

# Also check: of EN top-level keys, how many are entirely absent vs present-but-different-shape in hi/ko
en_top = set(en_raw)
hi_top = set(hi_raw)
ko_top = set(ko_raw)
print(f"\nen top-level keys: {len(en_top)}")
print(f"hi top-level keys: {len(hi_top)}, absent from hi: {len(en_top - hi_top)}, extra-in-hi: {len(hi_top - en_top)}")
print(f"ko top-level keys: {len(ko_top)}, absent from ko: {len(en_top - ko_top)}, extra-in-ko: {len(ko_top - en_top)}")
