# Hero Lottie – schimbarea culorii ecranului monitor

Animația hero folosește `src/assets/meroxindatacenter.json`. Ecranul monitorului este **Layer 3 → Group 7 → Group 3 → Group 1 → Fill 1**.

## Prompt scurt (pentru AI / Cursor)

```
În src/assets/meroxindatacenter.json, schimbă culoarea ecranului monitorului (Layer 3 → Group 7 → Group 3 → Group 1 → Fill 1) la [R, G, B] (valorile 0–1). 
Exemple: negru [0.06, 0.06, 0.08, 1], alb [1, 1, 1], albastru [0.2, 0.4, 0.9, 1].
Găsește layer cu nm "Layer 3", apoi shapes → "Group 7" → it → "Group 3" → it → "Group 1" → it → element cu ty "fl" (fill) și setează c.k.k la [r, g, b, 1] (sau c.k dacă e array direct).
```

## Manual (Node)

```bash
node -e "
const fs = require('fs');
const j = require('./src/assets/meroxindatacenter.json');
const fill = j.layers.find(l => l.nm === 'Layer 3').shapes.find(s => s.nm === 'Group 7').it.find(s => s.nm === 'Group 3').it.find(s => s.nm === 'Group 1').it.find(s => s.ty === 'fl');
fill.c.k = [0.06, 0.06, 0.08, 1];  // negru; pentru alb: [1,1,1,1]
fs.writeFileSync('src/assets/meroxindatacenter.json', JSON.stringify(j));
"
```

Replace `[0.06, 0.06, 0.08, 1]` with your RGB (0–1) + alpha 1.
