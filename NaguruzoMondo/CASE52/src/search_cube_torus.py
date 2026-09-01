from collections import defaultdict, deque
from itertools import combinations
import json

N = 5
FULL = (1 << 25) - 1
DIRS = [(1,0),(-1,0),(0,1),(0,-1)]
GRID_LETTERS = ['なたさかあ','にちしきい','ぬつすくう','ねてせけえ','のとそこお']

def norm(cells):
    minx=min(x for x,y in cells); miny=min(y for x,y in cells)
    return frozenset((x-minx,y-miny) for x,y in cells)

def variants(cells):
    out=set()
    for r in range(4):
        for f in range(2):
            q=[]
            for x,y in cells:
                a,b=x,y
                for _ in range(r): a,b=-b,a
                if f: a=-a
                q.append((a,b))
            out.add(norm(q))
    return out

def canon(cells): return min(tuple(sorted(v)) for v in variants(cells))

def cross(a,b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def neg(a): return tuple(-x for x in a)

def fold_normals(cells):
    cells=set(cells); root=next(iter(cells))
    # orientation is (right, down, normal)
    ori={root:((1,0,0),(0,1,0),(0,0,1))}; q=deque([root])
    while q:
        x,y=q.popleft(); r,d,n=ori[(x,y)]
        for dx,dy in DIRS:
            p=(x+dx,y+dy)
            if p not in cells: continue
            if dx==1: no=(neg(n),d,r)
            elif dx==-1: no=(n,d,neg(r))
            elif dy==1: no=(r,neg(n),d)
            else: no=(r,n,neg(d))
            if p in ori and ori[p]!=no: return None
            if p not in ori: ori[p]=no; q.append(p)
    if len({o[2] for o in ori.values()}) != 6: return None
    return {p:o[2] for p,o in ori.items()}

# Generate the 35 free hexominoes, then retain the 11 cube nets.
polys={((0,0),)}
for size in range(2,7):
    nxt=set()
    for p in polys:
        s=set(p)
        for x,y in list(s):
            for dx,dy in DIRS:
                if (x+dx,y+dy) not in s:
                    nxt.add(canon(s|{(x+dx,y+dy)}))
    polys=nxt
nets=[]
for p in sorted(polys):
    if fold_normals(p): nets.append(frozenset(p))
assert len(nets)==11, len(nets)

placements=[]
by_type=defaultdict(list)
seen=set()
for tid,base in enumerate(nets):
    for shape in variants(base):
        fn=fold_normals(shape)
        for tx in range(N):
            for ty in range(N):
                mp={((x+tx)%N,(y+ty)%N):n for (x,y),n in fn.items()}
                if len(mp)!=6: continue
                cells=set(mp)
                edges=sum(1 for x,y in cells for dx,dy in [(1,0),(0,1)] if ((x+dx)%N,(y+dy)%N) in cells)
                if edges!=5: continue
                key=(tid,tuple(sorted((y*N+x,n) for (x,y),n in mp.items())))
                if key in seen: continue
                seen.add(key)
                mask=sum(1<<(y*N+x) for x,y in cells)
                obj={'type':tid,'mask':mask,'normals':{y*N+x:n for (x,y),n in mp.items()}}
                idx=len(placements); placements.append(obj); by_type[tid].append(idx)

# Enumerate exact covers with four distinct types. Deduplicate by colored masks/type IDs.
wanted={'とけい','しせい','すてき','きかい','とくい','てあし','ちいき','いせき','ていし','きせつ'}
chars=list(''.join(GRID_LETTERS))
targets=[chars.index(char) for char in 'こたえ']
answers=defaultdict(list); solution_seen=set()

# Build disjoint pairs, indexed by type pair and union mask.  Grouping by the
# union lets the exact-cover step look up the required complement directly
# instead of multiplying two large pair lists.
pairs=defaultdict(lambda: defaultdict(list))
for a in range(11):
  for b in range(a+1,11):
    for ia in by_type[a]:
      ma=placements[ia]['mask']
      for ib in by_type[b]:
        mb=placements[ib]['mask']
        if not ma&mb: pairs[(a,b)][ma|mb].append((ia,ib))

for types in combinations(range(11),4):
    a,b,c,d=types
    right=pairs[(c,d)]
    for m1,left_ids in pairs[(a,b)].items():
      remaining=FULL^m1
      for hole in range(25):
        if not (remaining>>hole)&1: continue
        m2=remaining^(1<<hole)
        for ia,ib in left_ids:
          for ic,id_ in right.get(m2,()):
            ids=(ia,ib,ic,id_)
            key=tuple((placements[i]['type'],placements[i]['mask']) for i in ids)
            if key in solution_seen: continue
            solution_seen.add(key)
            if hole in targets: continue
            back=[]; trace=[]
            for t in targets:
                p=next(placements[i] for i in ids if (placements[i]['mask']>>t)&1)
                n=p['normals'][t]; opp=neg(n)
                u=next(k for k,v in p['normals'].items() if v==opp)
                back.append(chars[u]); trace.append({'front':chars[t],'back':chars[u]})
            word=''.join(back)
            if word not in wanted: continue
            labels=['A','B','C','D']; grid=['']*25; pieces=[]
            for label,i in zip(labels,ids):
                p=placements[i]
                cells=sorted(p['normals'])
                for cell in cells: grid[cell]=label
                pieces.append({'label':label,'type_id':p['type']+1,'cells':[chars[x] for x in cells]})
            grid[hole]='.'
            answers[word].append({
                'hole':chars[hole],
                'grid':[''.join(grid[r*5:(r+1)*5]) for r in range(5)],
                'pieces':pieces,
                'reading':trace
            })

out={
  'grid_letters':GRID_LETTERS,
  'targets':['こ','た','え'],
  'answers':{w:answers[w] for w in ['とけい','しせい','すてき','きかい','とくい','てあし','ちいき','いせき','ていし','きせつ']}
}
expected_counts={'とけい':68,'しせい':119,'すてき':83,'きかい':35,'とくい':35,'てあし':20,'ちいき':13,'いせき':12,'ていし':11,'きせつ':3}
actual_counts={word:len(items) for word,items in out['answers'].items()}
assert actual_counts==expected_counts,(actual_counts,expected_counts)
with open('selected_word_placements.json','w',encoding='utf-8') as f:
    json.dump(out,f,ensure_ascii=False,indent=2)
print('nets',len(nets),'placements',len(placements),'solutions',len(solution_seen))
print(actual_counts)
