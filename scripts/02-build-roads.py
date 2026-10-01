import json, math, re, collections

base = json.load(open('/home/claude/base.json'))
vw, vh = [float(v) for v in base['viewBox'].split()[2:]]

# reuse projection
gj = json.load(open('data-raw/gadm41_PAK_0.json'))
polys = gj['features'][0]['geometry']['coordinates']
rings=[[(c[0],c[1]) for c in r] for p in polys for r in p if len(r)>=8]
lons=[c[0] for r in rings for c in r]; lats=[c[1] for r in rings for c in r]
lon0,lon1=min(lons),max(lons); lat0,lat1=min(lats),max(lats)
PAD=26.0
def merc(lon,lat): return math.radians(lon), math.log(math.tan(math.pi/4+math.radians(lat)/2))
mx0,my0=merc(lon0,lat0); mx1,my1=merc(lon1,lat1)
scale=(900.0-2*PAD)/(mx1-mx0)
def prj(lon,lat):
    mx,my=merc(lon,lat); return (PAD+(mx-mx0)*scale, PAD+(my1-my)*scale)

CORRIDOR = {
  "M-9":"M-9 · Karachi – Hyderabad",
  "N-5":"N-5 · Grand Trunk Road",
  "M-5":"M-5 · Multan – Sukkur",
  "M-4":"M-4 · Pindi Bhattian – Multan",
  "M-3":"M-3 · Lahore – Abdul Hakeem",
  "M-2":"M-2 · Lahore – Islamabad",
}

def norm(ref):
    if not ref: return None
    r=ref.split(";")[0].strip().upper()
    r=re.sub(r"\s*\(.*\)$","",r)
    m=re.match(r"^([MN])-?(\d+)$",r)
    return f"{m.group(1)}-{m.group(2)}" if m else None

osm=json.load(open('data-raw/osm-roads.json'))
grouped=collections.defaultdict(list)
for e in osm.get('elements',[]):
    t=e.get('tags') or {}
    r=norm(t.get('ref'))
    if not r: continue
    geom=e.get('geometry')
    if not geom: continue
    grouped[r].append([(p['lon'],p['lat']) for p in geom])

def dist(a,b): return math.hypot(a[0]-b[0],a[1]-b[1])
def chain_len(c): return sum(dist(c[i],c[i+1]) for i in range(len(c)-1))

def stitch(ways, tol=0.006):
    segs=[list(w) for w in ways if len(w)>1]
    out=[]
    while segs:
        cur=segs.pop(0); changed=True
        while changed:
            changed=False
            for i,s in enumerate(segs):
                if dist(cur[-1],s[0])<tol: cur+=s[1:]; segs.pop(i); changed=True; break
                if dist(cur[-1],s[-1])<tol: cur+=list(reversed(s))[1:]; segs.pop(i); changed=True; break
                if dist(cur[0],s[-1])<tol: cur=s[:-1]+cur; segs.pop(i); changed=True; break
                if dist(cur[0],s[0])<tol: cur=list(reversed(s))[:-1]+cur; segs.pop(i); changed=True; break
        out.append(cur)
    return out

def rdp(pts,eps):
    if len(pts)<3: return pts
    stack=[(0,len(pts)-1)]; keep=[False]*len(pts); keep[0]=keep[-1]=True
    while stack:
        s,e=stack.pop(); ax,ay=pts[s]; bx,by=pts[e]
        dx,dy=bx-ax,by-ay; den=math.hypot(dx,dy); idx,dm=-1,0.0
        for i in range(s+1,e):
            px,py=pts[i]
            d=abs(dy*px-dx*py+bx*ay-by*ax)/den if den else math.hypot(px-ax,py-ay)
            if d>dm: idx,dm=i,d
        if dm>eps and idx!=-1:
            keep[idx]=True; stack.append((s,idx)); stack.append((idx,e))
    return [p for p,k in zip(pts,keep) if k]

def smooth(pts,t=0.5):
    if len(pts)<3:
        return "M%.1f %.1f "%pts[0]+" ".join("L%.1f %.1f"%p for p in pts[1:])
    o=["M%.1f %.1f"%pts[0]]; n=len(pts)
    for i in range(n-1):
        p0=pts[i-1] if i>0 else pts[i]; p1,p2=pts[i],pts[i+1]
        p3=pts[i+2] if i+2<n else pts[i+1]
        c1=(p1[0]+(p2[0]-p0[0])*t/3, p1[1]+(p2[1]-p0[1])*t/3)
        c2=(p2[0]-(p3[0]-p1[0])*t/3, p2[1]-(p3[1]-p1[1])*t/3)
        o.append("C%.1f %.1f %.1f %.1f %.1f %.1f"%(c1[0],c1[1],c2[0],c2[1],p2[0],p2[1]))
    return " ".join(o)

roads=[]
for ref in sorted(grouped):
    chains=[]
    for ch in stitch(grouped[ref]):
        pts=[prj(lo,la) for lo,la in ch]
        dd=[pts[0]]
        for p in pts[1:]:
            if dist(p,dd[-1])>=0.5: dd.append(p)
        if len(dd)<2: continue
        L=chain_len(dd)
        eps=max(0.35,min(1.2,L/300.0))
        s=rdp(dd,eps)
        if chain_len(s)>=5: chains.append(s)
    if not chains: continue
    longest=max(chain_len(c) for c in chains)
    chains=[c for c in chains if chain_len(c)>=5]
    path=" ".join(smooth(c) for c in chains)
    kind = "corridor" if ref in CORRIDOR else "context"
    verts=sum(len(c) for c in chains)
    roads.append({"id":ref,"label":CORRIDOR.get(ref,ref),"path":path,"type":kind})
    print(f"  {ref:5} {kind:9} chains={len(chains):2} verts={verts:4} len={longest:7.1f}")

CITIES=[("Port Qasim",67.3400,24.7800,1),("Hyderabad",68.3578,25.3960,0),
        ("Sukkur",68.8570,27.7132,0),("Multan",71.5249,30.1575,0),
        ("Faisalabad",73.1350,31.4504,0),("Lahore",74.3587,31.5204,1),
        ("Islamabad",73.0479,33.6844,0),("Peshawar",71.5249,34.0151,0),
        ("Quetta",66.9750,30.1798,0),("Gwadar",62.3254,25.1264,0)]
nodes=[]
for name,lo,la,major in CITIES:
    x,y=prj(lo,la); nodes.append({"label":name,"x":round(x,1),"y":round(y,1),"major":major})

out={"viewBox":base["viewBox"],"dots":base["dots"],"outline":base["outline"],
     "roads":roads,"nodes":nodes}
json.dump(out,open('/home/claude/zgmap.json','w'),separators=(',',':'))
import os
print("bytes:", os.path.getsize('/home/claude/zgmap.json'))
