# -*- coding: utf-8 -*-
"""
3차 보정: 전 페이지에 똑같이 들어가는 문구를 공통 키 common.* 로 묶는다.
 1) 푸터: 모든 페이지 문구 목록의 '공통 접미' (뒤에서부터 같은 것)
 2) 견적 섹션: 견적 섹션이 있는 페이지들의 sec=contact/quote 문구 중 '공통 접두'
같은 순서·같은 태그·같은 텍스트일 때만 묶는다. 한 번만 실행.
"""
import io, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dp = os.path.join(ROOT, 'admin', 'defaults.json')
D = json.load(io.open(dp, encoding='utf-8'))
pages = list(D['copy_pages'].keys())
html = {p: io.open(os.path.join(ROOT, p), encoding='utf-8').read() for p in pages}
def same(items):  # [(page, item)] 모두 같은 태그·텍스트?
    return len(set(D['copy'][it['k']] for _, it in items)) == 1 and len(set(it['tag'] for _, it in items)) == 1
def rename(group, prefix, counters):
    tag = group[0][1]['tag']; counters[tag] = counters.get(tag, 0) + 1; new = '%s.%s.%d' % (prefix, tag, counters[tag])
    val = None
    for p, it in group:
        old = it['k']
        html[p] = html[p].replace('<!--B:copy.%s-->' % old, '<!--B:copy.%s-->' % new).replace('<!--/B:copy.%s-->' % old, '<!--/B:copy.%s-->' % new)
        v = D['copy'].pop(old, None); val = val if val is not None else v
        it['k'] = new; it['sec'] = 'common'
    D['copy'][new] = val
# 1) 푸터: 공통 접미
lists = {p: D['copy_pages'][p] for p in pages}
k = 0; cnt = {}
while all(len(lists[p]) > k for p in pages) and same([(p, lists[p][-1 - k]) for p in pages]):
    k += 1
suffix_groups = [[(p, lists[p][-1 - i]) for p in pages] for i in range(k)][::-1]
for g in suffix_groups: rename(g, 'common.ft', cnt)
print('푸터 공통:', k)
# 2) 견적 섹션: 공통 접두 (푸터로 묶인 것 제외, sec contact/quote 인 페이지만)
qp = [p for p in pages if any(it['sec'] in ('contact', 'quote') for it in lists[p])]
cands = {p: [it for it in lists[p] if it['sec'] in ('contact', 'quote')] for p in qp}
n = min(len(v) for v in cands.values()); j = 0; cnt = {}
while j < n and same([(p, cands[p][j]) for p in qp]):
    rename([(p, cands[p][j]) for p in qp], 'common.qt', cnt); j += 1
print('견적 공통:', j, '/', n, '페이지', len(qp))
for p in pages: io.open(os.path.join(ROOT, p), 'w', encoding='utf-8', newline='').write(html[p])
io.open(dp, 'w', encoding='utf-8', newline='\n').write(json.dumps(D, ensure_ascii=False, indent=1))
print('완료: copy 키', len(D['copy']))
