import sys, struct, bz2, json, os, re, argparse
from pathlib import Path
from PIL import Image

sys.path.insert(0, r"C:\Users\wang\Documents\deepseek-harness\default-workspace\tools\gret")
from binary.reader import DataWinReader, locate_chunks

ROOT = Path(r"C:\Users\wang\Documents\deepseek-harness\default-workspace")
DATAWIN = ROOT / "digitalpartner_extract" / "data.win"
JSON = ROOT / "digitalpartner_extract" / "digimon_data.json"
OUT = ROOT / "digitalpartner_sprites"

def s32(v):
    v &= 0xFFFFFFFF
    return v - 0x100000000 if v & 0x80000000 else v

def qoi_decode_gm(raw):
    assert raw[:4] == b'fioq', raw[:4]
    w = struct.unpack_from('<H', raw, 4)[0]
    h = struct.unpack_from('<H', raw, 6)[0]
    ln = struct.unpack_from('<I', raw, 8)[0]
    pdata = raw[12:12+ln]
    pos = 0
    px = [0, 0, 0, 255]
    index = [[0,0,0,0] for _ in range(64)]
    out = bytearray(w*h*4)
    run = 0
    i = 0
    while i < w*h:
        if run > 0:
            run -= 1
            out[i*4:i*4+4] = bytes(px)
            i += 1
            continue
        if pos >= len(pdata):
            out[i*4:i*4+4] = bytes(px)
            i += 1
            continue
        b1 = pdata[pos]; pos += 1
        if (b1 & 0xC0) == 0x00:
            px = index[b1].copy()
        elif (b1 & 0xE0) == 0x40:
            run = b1 & 0x1F
        elif (b1 & 0xE0) == 0x60:
            b2 = pdata[pos]; pos += 1
            run = (((b1 & 0x1F) << 8) | b2) + 32
        elif (b1 & 0xC0) == 0x80:
            r = s32((b1 & 0x30) << 26) >> 30
            g = s32((b1 & 0x0C) << 28) >> 30
            b = s32((b1 & 0x03) << 30) >> 30
            px[0] = (px[0] + r) & 255
            px[1] = (px[1] + g) & 255
            px[2] = (px[2] + b) & 255
        elif (b1 & 0xE0) == 0xC0:
            b2 = pdata[pos]; pos += 1
            merged = (b1 << 8) | b2
            r = s32((merged & 0x1F00) << 19) >> 27
            g = s32((merged & 0x00F0) << 24) >> 28
            b = s32((merged & 0x000F) << 28) >> 28
            px[0] = (px[0] + r) & 255
            px[1] = (px[1] + g) & 255
            px[2] = (px[2] + b) & 255
        elif (b1 & 0xF0) == 0xE0:
            b2 = pdata[pos]; b3 = pdata[pos+1]; pos += 2
            merged = (b1 << 16) | (b2 << 8) | b3
            r = s32((merged & 0x0F8000) << 12) >> 27
            g = s32((merged & 0x007C00) << 17) >> 27
            b = s32((merged & 0x0003E0) << 22) >> 27
            a = s32((merged & 0x00001F) << 27) >> 27
            px[0] = (px[0] + r) & 255
            px[1] = (px[1] + g) & 255
            px[2] = (px[2] + b) & 255
            px[3] = (px[3] + a) & 255
        elif (b1 & 0xF0) == 0xF0:
            if b1 & 8: px[0] = pdata[pos]; pos += 1
            if b1 & 4: px[1] = pdata[pos]; pos += 1
            if b1 & 2: px[2] = pdata[pos]; pos += 1
            if b1 & 1: px[3] = pdata[pos]; pos += 1
        else:
            raise ValueError(f'bad qoi opcode {b1:02x}')
        index[(px[0] ^ px[1] ^ px[2] ^ px[3]) & 63] = px.copy()
        out[i*4:i*4+4] = bytes(px)
        i += 1
    return w, h, bytes(out)

def safe_name(name):
    return re.sub(r'[^0-9A-Za-z._-]+', '_', name).strip('_') or 'unnamed'

def load_metadata():
    data = DATAWIN.read_bytes()
    r = DataWinReader(DATAWIN)
    ch = locate_chunks(r)
    def u32(o): return struct.unpack_from('<I', data, o)[0]
    def i32(o): return struct.unpack_from('<i', data, o)[0]
    # STRG string map: pointer to string data (pointer + 4) -> text
    strg = ch['STRG']; n = u32(strg.offset); names = {}
    for i in range(n):
        ptr = u32(strg.offset + 4 + 4*i)
        ln = u32(ptr)
        names[ptr + 4] = data[ptr+4:ptr+4+ln].decode('utf8', 'replace')
    # TPAG: pointer -> (source_x, source_y, source_w, source_h, target_x, target_y, target_w, target_h, bounding_w, bounding_h, page_index)
    tpag_chunk = ch['TPAG']; tn = u32(tpag_chunk.offset); tpag = {}
    for i in range(tn):
        ptr = u32(tpag_chunk.offset + 4 + 4*i)
        tpag[ptr] = struct.unpack_from('<12H', data, ptr)
    # SPRT
    sprt = ch['SPRT']; sn = u32(sprt.offset); sprites = {}
    for i in range(sn):
        ptr = u32(sprt.offset + 4 + 4*i)
        name = names.get(u32(ptr), '')
        if not name: continue
        w, h = i32(ptr+4), i32(ptr+8)
        marker = i32(ptr+56)
        if marker == -1:
            sv = u32(ptr+60); st = u32(ptr+64)
            if st != 0: continue
            cnt = u32(ptr+84)
            refs = [u32(ptr+88+4*j) for j in range(cnt)]
        else:
            cnt = u32(ptr+56)
            refs = [u32(ptr+60+4*j) for j in range(cnt)]
        sprites[name] = {'name': name, 'w': w, 'h': h, 'refs': refs}
    # TXTR page metadata
    tx_chunk = ch['TXTR']; base = tx_chunk.offset + 8
    count = u32(base)
    pages = []
    for i in range(count):
        ptr = u32(base + 4 + 4*i)
        vals = struct.unpack_from('<7I', data, ptr)
        scaled, mips, block, pw, ph, idx, data_pos = vals
        pages.append({'scaled': scaled, 'block': block, 'width': pw, 'height': ph, 'data_pos': data_pos})
    r.close()
    return data, sprites, tpag, pages

def decode_page(data, page):
    block, pos = page['block'], page['data_pos']
    if block < 12 or pos <= 0 or pos + block > len(data):
        return None
    raw = data[pos:pos+block]
    if raw[:4] != b'2zoq':
        return None
    try:
        qoi = bz2.decompress(raw[12:])
        w, h, pix = qoi_decode_gm(qoi)
        return Image.frombytes('RGBA', (w, h), pix)
    except Exception as e:
        print('page decode failed', e)
        return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    data, sprites, tpag, pages = load_metadata()
    meta = json.loads(JSON.read_text(encoding='utf-8'))
    wanted = []
    seen = set()
    for k, v in meta.items():
        sprite_name = v.get('sprite', '')
        if sprite_name in seen: continue
        seen.add(sprite_name)
        if sprite_name not in sprites:
            print('MISSING SPRITE RECORD', sprite_name, v.get('name'))
            continue
        wanted.append((sprite_name, v))
    if args.limit: wanted = wanted[:args.limit]
    # jobs grouped by page
    page_jobs = {}
    no_frame = []
    for sprite_name, info in wanted:
        rec = sprites[sprite_name]
        jobs = []
        for frame_idx, ref in enumerate(rec['refs']):
            item = tpag.get(ref)
            if not item: continue
            (sx, sy, sw, sh, tx, ty, tw, th, bw, bh, page_idx, _extra) = item
            if page_idx >= len(pages) or sw <= 0 or sh <= 0: continue
            jobs.append((frame_idx, page_idx, (sx, sy, sw, sh)))
        if not jobs:
            no_frame.append(info.get('name', sprite_name))
            continue
        for frame_idx, page_idx, rect in jobs:
            page_jobs.setdefault(page_idx, []).append((sprite_name, info, frame_idx, rect))
    # Make output names human-readable, but add the internal sprite key when
    # two entries share the same display name.
    name_counts = {}
    for sprite_name, info in wanted:
        key = safe_name(info.get('name', sprite_name))
        name_counts[key] = name_counts.get(key, 0) + 1
    print('species', len(wanted), 'pages', len(page_jobs), 'no_frame', len(no_frame))
    if no_frame: print('no_frame sample', no_frame[:10])
    manifest = []
    done = 0
    for page_idx in sorted(page_jobs.keys()):
        page = pages[page_idx]
        img = decode_page(data, page)
        if img is None:
            print('SKIP PAGE', page_idx); continue
        for sprite_name, info, frame_idx, rect in page_jobs[page_idx]:
            sx, sy, sw, sh = rect
            if sx + sw > img.width or sy + sh > img.height: continue
            crop = img.crop((sx, sy, sx+sw, sy+sh))
            base = safe_name(info.get('name', sprite_name))
            if name_counts.get(base, 0) > 1:
                base = base + '__' + safe_name(sprite_name)
            path = OUT / f"{base}_f{frame_idx}.png"
            crop.save(path)
            manifest.append({
                'id': info.get('name', sprite_name),
                'sprite': sprite_name,
                'tier': info.get('tier', ''),
                'type': info.get('type', ''),
                'hp': info.get('hp', 0),
                'atk': info.get('atk', 0),
                'vel': info.get('vel', 0),
                'frame': frame_idx,
                'file': path.name,
                'width': crop.width,
                'height': crop.height,
            })
            done += 1
        print('page', page_idx, 'jobs', len(page_jobs[page_idx]), 'total', done)
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print('DONE', done, 'files')

if __name__ == '__main__':
    main()


