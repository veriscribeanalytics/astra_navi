import json
import os

BASE = r"C:/Users/AI INNOVATIONS/Desktop/VedicAstra/Backend/translations"
FILES = ["alerts.json", "astro.json", "consultation.json", "family.json",
         "horoscope.json", "kundli.json", "match.json", "messages.json"]
LANGS = ["hi", "ko"]


def flatten(obj, prefix=""):
    """Recursively flatten a JSON object to {dotted_key: value}."""
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{prefix}.{k}" if prefix else k
            if isinstance(v, (dict, list)):
                out.update(flatten(v, new_key))
            else:
                out[new_key] = v
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            new_key = f"{prefix}[{i}]"
            if isinstance(v, (dict, list)):
                out.update(flatten(v, new_key))
            else:
                out[new_key] = v
    else:
        out[prefix] = obj
    return out


def load(lang, fname):
    path = os.path.join(BASE, lang, fname)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def section_of(key):
    """Top-level section (first dotted segment) for grouping."""
    return key.split(".", 1)[0]


def analyze(fname):
    en = flatten(load("en", fname))
    print(f"\n========== {fname} ==========")
    print(f"  en keys: {len(en)}")
    for lang in LANGS:
        try:
            tr = flatten(load(lang, fname))
        except Exception as e:
            print(f"  [{lang}] LOAD ERROR: {e}")
            continue

        en_keys = set(en.keys())
        tr_keys = set(tr.keys())
        missing = en_keys - tr_keys
        extra = tr_keys - en_keys

        # Same-as-English: only count string values that are non-trivial
        identical = []
        identical_long = []
        empty = []
        for k in en_keys & tr_keys:
            ev = en[k]
            tv = tr[k]
            if isinstance(ev, str) and isinstance(tv, str):
                if tv == "":
                    empty.append(k)
                elif tv == ev:
                    identical.append(k)
                    # "long" = obviously a sentence, not a single word/brand
                    if len(ev) > 25 or " " in ev.strip():
                        identical_long.append(k)

        print(f"  [{lang}] keys: {len(tr)}  missing: {len(missing)}  extra: {len(extra)}  identical_to_en: {len(identical)} (long: {len(identical_long)})  empty: {len(empty)}")

        if missing:
            sec_count = {}
            for k in missing:
                s = section_of(k)
                sec_count[s] = sec_count.get(s, 0) + 1
            top_secs = sorted(sec_count.items(), key=lambda x: -x[1])[:8]
            print(f"    missing sections: {top_secs}")
            sample = sorted(missing)[:5]
            print(f"    missing samples: {sample}")
        if extra:
            sec_count = {}
            for k in extra:
                s = section_of(k)
                sec_count[s] = sec_count.get(s, 0) + 1
            top_secs = sorted(sec_count.items(), key=lambda x: -x[1])[:8]
            print(f"    extra sections: {top_secs}")
            sample = sorted(extra)[:10]
            print(f"    extra samples: {sample}")
        if identical_long:
            print(f"    identical-long samples: {identical_long[:3]}")
        if empty:
            print(f"    empty samples: {empty[:5]}")


for f in FILES:
    analyze(f)
