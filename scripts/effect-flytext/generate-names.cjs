const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {PNG} = require('../bossbar/node_modules/pngjs');
const [vanilla, assetPack] = process.argv.slice(2);
if (!assetPack) throw Error('Usage: node generate-names.cjs <vanilla-assets> <Asset datapack>');
const assets = path.resolve(__dirname, '../../assets/minecraft');
const out = path.join(assets, 'font/effect/flytext/name');
const textures = path.join(assets, 'textures/font/effect_flytext');
const offsets = fs.readdirSync(path.dirname(out)).filter(n=>/^\d+\.json$/.test(n)).map(n=>parseInt(n)).sort((a,b)=>a-b);
if (!offsets.length) throw Error('Generate flytext icon fonts before name fonts');
const chars = new Set();
function collect(node) {
  if (typeof node === 'string') for (const c of node) chars.add(c);
  else if (Array.isArray(node)) node.forEach(collect);
  else { collect(node.text ?? ''); (node.extra ?? []).forEach(collect); (node.with ?? []).forEach(collect); }
}
function walk(dir) {
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    const p = path.join(dir,e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.mcfunction')) {
      for (const line of fs.readFileSync(p,'utf8').split(/\r?\n/)) {
        const m = line.match(/asset:effect Name set value '(.*)'/);
        if (m) collect(JSON.parse(m[1]));
      }
    }
  }
}
walk(path.resolve(assetPack,'data/asset/functions/effect'));
const sorted = [...chars].sort((a,b)=>a.codePointAt(0)-b.codePointAt(0));
const json = p => JSON.parse(fs.readFileSync(p));
const font = n => json(path.join(vanilla, 'minecraft/font', n+'.json'));
const glyphs = new Map();
const hexProvider = font('include/unifont').providers[0];
const zip = path.join(vanilla,hexProvider.hex_file.replace(':','/'));
const hexFiles = execFileSync('unzip',['-Z1',zip],{encoding:'utf8'}).trim().split('\n').filter(n=>n.endsWith('.hex'));
for (const name of hexFiles) {
  const hex = execFileSync('unzip',['-p',zip,name],{encoding:'utf8',maxBuffer:32*1024*1024});
  for (const line of hex.trim().split('\n')) {
    const [code,bits] = line.split(':'); const cp = parseInt(code,16), c = String.fromCodePoint(cp);
    if (!chars.has(c) || c===' ') continue;
    const width = bits.length / 4, digits = bits.length / 16;
    const rows = Array.from({length:16},(_,i)=>BigInt('0x'+bits.slice(i*digits,(i+1)*digits)));
    const mask = rows.reduce((a,b)=>a|b,0n);
    const override = hexProvider.size_overrides.find(o=>cp>=o.from.codePointAt(0)&&cp<=o.to.codePointAt(0));
    let left=0,right=width-1;
    if (override) ({left,right}=override);
    else if (mask) {
      while (!(mask & (1n << BigInt(width-left-1)))) left++;
      while (!(mask & (1n << BigInt(width-right-1)))) right--;
    }
    const pixels = Array.from({length:16},(_,y)=>Array.from({length:right-left+1},(_,x)=>
      Number((rows[y] >> BigInt(width-left-x-1)) & 1n)));
    glyphs.set(c,{pixels,width:right-left+1,height:16,displayHeight:8,ascent:7});
  }
}
const normal = new Map(glyphs), overridden = new Set();
for (const p of font('include/default').providers) {
  const image = PNG.sync.read(fs.readFileSync(path.join(vanilla,p.file.replace(':','/textures/'))));
  const rows=p.chars.map(s=>[...s]), cw=image.width/rows[0].length, ch=image.height/rows.length;
  rows.forEach((row,y)=>row.forEach((c,x)=>{
    if (!chars.has(c)||c===' '||overridden.has(c)) return;
    overridden.add(c);
    const pixels=Array.from({length:ch},(_,dy)=>Array.from({length:cw},(_,dx)=>
      image.data[((y*ch+dy)*image.width+x*cw+dx)*4+3] ? 1 : 0));
    normal.set(c,{pixels,width:cw,height:ch,displayHeight:p.height??8,ascent:p.ascent});
  }));
}
const shared=sorted.filter(c=>c!==' '&&!overridden.has(c));
const different=sorted.filter(c=>overridden.has(c));
for (const c of sorted) if(c!==' '&&(!normal.has(c)||!glyphs.has(c))) throw Error(`Missing glyph ${c}`);
fs.mkdirSync(out,{recursive:true}); fs.mkdirSync(textures,{recursive:true});
// Only this generator owns name fonts and sheets; drop obsolete height variants.
for (const dir of ['common','default','uniform']) {
  fs.mkdirSync(path.join(out,dir),{recursive:true});
  for (const f of fs.readdirSync(path.join(out,dir)))
    if (/^\d+\.json$/.test(f)&&!offsets.includes(parseInt(f))) fs.unlinkSync(path.join(out,dir,f));
}
for (const file of fs.readdirSync(textures)) if (/^(common|default|uniform)_.*\.png$/.test(file)) fs.unlinkSync(path.join(textures,file));
const advances={default:{' ':4},uniform:{' ':4}};
let bytesPerOffset=0;
function sheets(kind, letters, lookup) {
  const groups = new Map();
  for (const c of letters) {
    const g=lookup.get(c),key=[g.width,g.height,g.displayHeight,g.ascent].join('_');
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(c);
  }
  const providers=[];
  for (const [key, cs] of groups) {
    const g=lookup.get(cs[0]), columns=Math.min(16,cs.length), rowCount=Math.ceil(cs.length/columns);
    const png = new PNG({width:columns*g.width,height:rowCount*g.height}); png.data.fill(0);
    const rows=Array.from({length:rowCount},()=>Array(columns).fill('\0'));
    cs.forEach((c,i)=>{
      const x=i%columns,y=Math.floor(i/columns),glyph=lookup.get(c); rows[y][x]=c;
      let ink=0;
      glyph.pixels.forEach((row,dy)=>row.forEach((v,dx)=>{
        if (!v) return;
        const at=((y*g.height+dy)*png.width+x*g.width+dx)*4;
        png.data.fill(255,at,at+4);ink=Math.max(ink,dx+1);
      }));
      const advance=Math.floor(Math.fround(Math.fround(ink*Math.fround(g.displayHeight/g.height))+0.5))+1;
      for (const mode of kind==='common'?['default','uniform']:[kind]) advances[mode][c]=advance;
    });
    const file=`${kind}_${key}.png`;
    fs.writeFileSync(path.join(textures,file),PNG.sync.write(png));
    bytesPerOffset+=png.data.length;
    providers.push({type:'bitmap',file:`minecraft:font/effect_flytext/${file}`,height:g.displayHeight,ascent:g.ascent,chars:rows.map(r=>r.join(''))});
  }
  return providers;
}
const common=sheets('common',shared,glyphs);
const variants={default:sheets('default',different,normal),uniform:sheets('uniform',different,glyphs)};
const write=(name,data)=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(data)+'\n');
for (const y of offsets) {
  write(`common/${y}`,{providers:common.map(p=>({...p,ascent:p.ascent-y}))});
  for (const mode of ['default','uniform']) {
    write(`${mode}/${y}`,{providers:[{type:'space',advances:{' ':4}},...variants[mode].map(p=>({...p,ascent:p.ascent-y})),{type:'reference',id:`minecraft:effect/flytext/name/common/${y}`}]});
  }
}
for (const mode of ['default','uniform']) write(`${mode}/space`,{providers:[{type:'space',advances:Object.fromEntries(Object.entries(advances[mode]).map(([c,w])=>[c,-w]))}]});
// Setting-dependent spaces move the inactive variant outside the GUI and back.
for (const mode of ['default','uniform']) {
  const p=path.join(assets,'font',mode+'.json'),data=json(p);
  const control={type:'space',advances:{'\ue300':mode==='uniform'?65536:0,'\ue301':mode==='uniform'?-65536:0,'\uf300':mode==='default'?65536:0,'\uf301':mode==='default'?-65536:0}};
  data.providers=data.providers.filter(p=>!Object.hasOwn(p.advances??{},'\ue300'));
  data.providers.unshift(control);
  fs.writeFileSync(p,JSON.stringify(data,null,4).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0'))+'\n');
}
fs.writeFileSync(path.join(textures,'UNIFONT-LICENSE.txt'),execFileSync('unzip',['-p',zip,'LICENSE.txt']));
const report={characters:sorted.join(''),commonCharacters:shared.length,differentCharacters:different.join(''),offsets,bytesPerOffset,nativeImageBytes:bytesPerOffset*offsets.length,advances};
fs.writeFileSync(path.join(__dirname,'name-metrics.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({characters:sorted.length,shared:shared.length,different:different.length,offsets:offsets.length,nativeImageMiB:report.nativeImageBytes/1024**2}));
