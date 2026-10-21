"""Geometric rebuild of the Tariften logo.

Everything is constructed from a few primitives (rounded rects, ellipse rings,
clips) with one set of metrics, then every line-line corner gets the same
soft radius.  Output: clean SVG paths (no white background, no tracing noise).
"""
import math, sys, json
import skia

RED = "#DB4C3F"
B = 330          # baseline
X = 120          # x-height
O = 4            # overshoot for round shapes
S = 46           # vertical stem
H = 41           # horizontal stroke (optically thinner)
ASC_T = 72       # t top
ASC_F = 38       # f / i-dot top
SOFT = 7         # corner radius applied to every straight corner

def rect(x, y, w, h):
    p = skia.Path(); p.addRect(skia.Rect.MakeXYWH(x, y, w, h)); return p

def rrect(x, y, w, h, r):
    p = skia.Path(); p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)); return p

def oval(cx, cy, rx, ry):
    p = skia.Path(); p.addOval(skia.Rect.MakeLTRB(cx - rx, cy - ry, cx + rx, cy + ry)); return p

def op(a, b, kind):
    return skia.Op(a, b, kind)

U, D, I = skia.PathOp.kUnion_PathOp, skia.PathOp.kDifference_PathOp, skia.PathOp.kIntersect_PathOp

def union(*ps):
    out = ps[0]
    for p in ps[1:]:
        out = op(out, p, U)
    return out

def ring(cx, cy, rx, ry, irx, iry, icx=None, icy=None):
    return op(oval(cx, cy, rx, ry), oval(cx if icx is None else icx, cy if icy is None else icy, irx, iry), D)

def stroke(p, width):
    paint = skia.Paint(); paint.setStyle(skia.Paint.kStroke_Style); paint.setStrokeWidth(width)
    paint.setStrokeJoin(skia.Paint.kRound_Join); paint.setStrokeCap(skia.Paint.kRound_Cap)
    out = skia.Path(); paint.getFillPath(p, out)
    return skia.Simplify(out)

def soften(p, r=SOFT):
    """Opening (erode then dilate by r): every convex corner gets radius r, curves are untouched."""
    eroded = op(p, stroke(p, 2 * r), D)
    return skia.Simplify(op(eroded, stroke(eroded, 2 * r), U))

def moved(p, dx, dy=0, s=1.0):
    m = skia.Matrix(); m.setScaleTranslate(s, s, dx, dy)
    q = skia.Path(p); q.transform(m); return q

# ---------------------------------------------------------------- glyphs
def g_t():
    stem_l, w = 30, 140
    ro = 62                                   # outer bend radius
    ox, oy = stem_l + ro, B + O - ro          # bend centre
    stem = rect(stem_l, ASC_T, S, oy - ASC_T + 1)
    bar = rect(0, X, 132, H)
    foot_h = 42
    bend = op(op(oval(ox, oy, ro, ro), oval(ox, oy, ro - S, ro - foot_h), D),
              rect(stem_l, oy, ro + 1, ro + 1), I)            # lower-left quarter ring
    foot = rect(ox, B + O - foot_h, w - ox, foot_h)
    return union(stem, bar, bend, foot), w

def g_a():
    w = 170
    stem = rect(w - S, 186, S, B - 186)
    # top arch: upper half of a ring
    cx, cy = w / 2, 186
    arch = op(ring(cx, cy, w / 2, cy - (X - O), w / 2 - S, cy - (X - O) - H), rect(0, 0, w, cy), I)
    # lower bowl
    bcx, bcy = 84, 268
    outer = op(oval(bcx, bcy, 84, B + O - bcy), rect(0, 0, w, 999), I)
    counter = op(oval(88, bcy, 38, 29), rect(0, 0, w - S, 999), I)
    bowl = op(outer, counter, D)
    return union(stem, arch, bowl), w

def arch(left, right, top, cut_y, thick_top, stem_w=S, inset=10):
    """n/r style arch: outer ellipse spans [left+inset, right], inner [left+stem_w, right-stem_w]."""
    ol, orr = left + inset, right
    ocx, orx = (ol + orr) / 2, (orr - ol) / 2
    il, ir = left + stem_w, right - stem_w
    icx, irx = (il + ir) / 2, (ir - il) / 2
    ory = cut_y - top
    iry = cut_y - (top + thick_top)
    a = op(oval(ocx, cut_y, orx, ory), oval(icx, cut_y, irx, iry), D)
    return op(a, rect(left, top - 10, right - left + 10, cut_y - top + 10), I)

def g_n():
    w = 172
    stem = rect(0, X, S, B - X)
    leg = rect(w - S, 205, S, B - 205)
    return union(stem, leg, arch(0, w, X - O, 205, H)), w

def g_r():
    w = 118
    stem = rect(0, X, S, B - X)
    sh = arch(0, 176, X - O, 214, H)
    sh = op(sh, rect(0, 0, w, 999), I)
    return union(stem, sh), w

def g_i():
    return union(rect(0, X, S, B - X), rrect(0, ASC_F + 2, S, S, 0)), S

def g_f():
    stem_l = 30
    w = 134
    stem = rect(stem_l, 112, S, B - 112)
    bar = rect(0, X, 132, H)
    cx, cy = stem_l + 104, 118
    hook = op(op(oval(cx, cy, 104, cy - ASC_F), oval(cx, cy + 4, 104 - S, cy + 4 - (ASC_F + H)), D),
              rect(stem_l, 0, w - stem_l, cy), I)
    return union(stem, bar, hook), w

def g_e():
    w = 180
    cx, cy = w / 2, (X - O + B + O) / 2
    rx, ry = w / 2, (B + O - (X - O)) / 2
    r = ring(cx, cy, rx, ry, rx - S, ry - H)
    bar_y = 196
    bar = op(rect(0, bar_y, w, 38), oval(cx, cy, rx, ry), I)
    aperture = rect(cx + 6, bar_y + 38, 200, 50)          # opens the lower right
    return union(op(r, aperture, D), bar), w

GLYPHS = {"t": g_t, "a": g_a, "r": g_r, "i": g_i, "f": g_f, "e": g_e, "n": g_n}
# optical spacing (gap after each letter, before the next)
GAPS = {"ta": 30, "ar": 42, "ri": 34, "if": 32, "ft": 20, "te": 30, "en": 40}

def wordmark(word="tariften", x0=0):
    x = x0; parts = []
    for i, ch in enumerate(word):
        shape, w = GLYPHS[ch]()
        parts.append(moved(shape, x))
        x += w
        if i < len(word) - 1:
            x += GAPS[word[i:i + 2]]
    return union(*parts), x - x0

# ---------------------------------------------------------------- mark
def sparkle(cx, cy, r, waist):
    p = skia.Path()
    pts = [(0, -r), (r, 0), (0, r), (-r, 0)]
    p.moveTo(cx + pts[0][0], cy + pts[0][1])
    for k in range(4):
        a = pts[k]; b = pts[(k + 1) % 4]
        # concave edge pulled toward the centre
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        p.quadTo(cx + mx * waist, cy + my * waist, cx + b[0], cy + b[1])
    p.close(); return p

def mark(x0=110, y0=15, size=340, radius=80):
    badge = rrect(x0, y0, size, size, radius)
    t, tw = g_t()
    sc = 0.84
    tx = x0 + size * 0.5 - (tw * sc) * 0.5 + 24
    ty = y0 + size * 0.5 - ((ASC_T + B + O) / 2) * sc - 4
    t_white = moved(soften(t), tx, ty, sc)
    pitch, cell, rr = 32, 20, 4
    gy0 = y0 + 96
    hole_x = lambda c: x0 + 16 + c * pitch
    block_x = lambda c: x0 - 14 - cell - c * pitch
    holes = [(0, 0), (1, 1), (0, 2), (2, 2), (1, 3), (0, 4), (1, 5)]
    blocks = [(0, 1), (1, 2), (0, 3), (2, 3), (1, 4), (0, 5)]
    body = badge
    for c, r in holes:
        body = op(body, rrect(hole_x(c), gy0 + r * pitch, cell, cell, rr), D)
    for c, r in blocks:
        body = union(body, rrect(block_x(c), gy0 + r * pitch, cell, cell, rr))
    star = sparkle(x0 + 96, y0 + 74, 21, 0.16)
    white = union(t_white, star, *[rrect(hole_x(c), gy0 + r * pitch, cell, cell, rr) for c, r in holes])
    return op(body, white, D), white

def svg_path(p):
    """Serialize a skia path; conics become quads, numbers rounded to 0.01."""
    f = lambda v: (f"{v:.2f}").rstrip("0").rstrip(".")
    it = skia.Path.Iter(p, False)
    out = []
    while True:
        verb, pts = it.next()
        if verb == skia.Path.Verb.kDone_Verb:
            break
        if verb == skia.Path.Verb.kMove_Verb:
            out.append(f"M{f(pts[0].x())} {f(pts[0].y())}")
        elif verb == skia.Path.Verb.kLine_Verb:
            out.append(f"L{f(pts[1].x())} {f(pts[1].y())}")
        elif verb == skia.Path.Verb.kQuad_Verb:
            out.append(f"Q{f(pts[1].x())} {f(pts[1].y())} {f(pts[2].x())} {f(pts[2].y())}")
        elif verb == skia.Path.Verb.kConic_Verb:
            quads = skia.Path.ConvertConicToQuads(pts[0], pts[1], pts[2], it.conicWeight(), 2)
            for k in range(1, len(quads), 2):
                out.append(f"Q{f(quads[k].x())} {f(quads[k].y())} {f(quads[k+1].x())} {f(quads[k+1].y())}")
        elif verb == skia.Path.Verb.kCubic_Verb:
            out.append(f"C{f(pts[1].x())} {f(pts[1].y())} {f(pts[2].x())} {f(pts[2].y())} {f(pts[3].x())} {f(pts[3].y())}")
        elif verb == skia.Path.Verb.kClose_Verb:
            out.append("Z")
    return "".join(out)

if __name__ == "__main__":
    out = sys.argv[1]
    wm, wm_w = wordmark()
    wm = soften(wm)
    mk, mk_white = mark()
    gap = 46
    left = 110 - 14 - 20 - 2 * 32 - 4          # leftmost pixel block minus margin
    total_w = 110 + 340 + gap + wm_w - left
    mk = moved(mk, -left); mk_white = moved(mk_white, -left)
    wm_placed = moved(wm, 110 + 340 + gap - left, 0)
    W, Hh = math.ceil(total_w) + 4, 370
    def svg(paths, w, h, vb=None):
        vb = vb or f"0 0 {w} {h}"
        body = "".join(f'<path fill="{c}" fill-rule="{'evenodd' if p.getFillType() == skia.PathFillType.kEvenOdd else 'nonzero'}" d="{svg_path(p)}"/>' for p, c in paths)
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}">{body}</svg>'
    open(f"{out}/tariften-logo.svg", "w").write(svg([(mk, RED), (mk_white, "#FFFFFF"), (wm_placed, RED)], W, Hh))
    open(f"{out}/tariften-logo-reverse.svg", "w").write(svg([(mk, "#FFFFFF"), (mk_white, RED), (wm_placed, "#FFFFFF")], W, Hh))
    open(f"{out}/tariften-wordmark.svg", "w").write(svg([(wm, RED)], math.ceil(wm_w) + 2, Hh))
    open(f"{out}/tariften-mark.svg", "w").write(svg([(mk, RED), (mk_white, "#FFFFFF")], 110 + 340 - left + 4, 370))
    print(json.dumps({"logo_w": W, "wordmark_w": wm_w}))

def app_icon(size=1024):
    """Full-bleed square app icon: the OS applies its own corner mask."""
    k = size / 340.0
    bg = rect(0, 0, size, size)
    t, tw = g_t()
    sc = 0.84 * k
    tx = size * 0.5 - (tw * sc) * 0.5 + 24 * k
    ty = size * 0.5 - ((ASC_T + B + O) / 2) * sc - 4 * k
    white = [moved(soften(t), tx, ty, sc), sparkle(96 * k, 74 * k, 21 * k, 0.16)]
    pitch, cell, rr = 32 * k, 20 * k, 4 * k
    for c, r in [(0, 0), (1, 1), (0, 2), (2, 2), (1, 3), (0, 4), (1, 5)]:
        white.append(rrect(16 * k + c * pitch, 96 * k + r * pitch, cell, cell, rr))
    return bg, union(*white)

if __name__ == "__main__":
    bg, fg = app_icon()
    open(f"{sys.argv[1]}/tariften-app-icon.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">'
        f'<path fill="{RED}" d="{svg_path(bg)}"/><path fill="#FFFFFF" d="{svg_path(fg)}"/></svg>')

def small_icon(size=1024):
    """Favicon-size icon: badge + t only (pixels and sparkle vanish below 48px)."""
    k = size / 340.0
    bg = rrect(0, 0, size, size, 80 * k)
    t, tw = g_t()
    sc = 1.0 * k
    tx = size * 0.5 - (tw * sc) * 0.5 + 6 * k
    ty = size * 0.5 - ((ASC_T + B + O) / 2) * sc
    return bg, moved(soften(t), tx, ty, sc)

if __name__ == "__main__":
    bg, fg = small_icon()
    open(f"{sys.argv[1]}/tariften-icon-small.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">'
        f'<path fill="{RED}" d="{svg_path(bg)}"/><path fill="#FFFFFF" d="{svg_path(fg)}"/></svg>')
    # rounded (non-full-bleed) version of the full icon for web use
    bg2, fg2 = app_icon()
    rounded = rrect(0, 0, 1024, 1024, 80 * 1024 / 340)
    open(f"{sys.argv[1]}/tariften-icon-rounded.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">'
        f'<path fill="{RED}" d="{svg_path(rounded)}"/><path fill="#FFFFFF" d="{svg_path(fg2)}"/></svg>')
