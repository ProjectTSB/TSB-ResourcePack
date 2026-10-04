const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const {PNG}=require(root+'/scripts/bossbar/node_modules/pngjs');
const data=JSON.parse(fs.readFileSync(root+'/scripts/effect-flytext/name-metrics.json'));
const base=root+'/assets/minecraft/font/';
const cache=new Map(),images=new Map();
function glyphs(id){
 if(cache.has(id))return cache.get(id);
 const p=JSON.parse(fs.readFileSync(base+id+'.json')),out=new Map();
 for(const g of p.providers){
  if(g.type==='reference')for(const[c,v]of glyphs(g.id.replace('minecraft:','')))if(!out.has(c))out.set(c,v);
  if(g.type==='space')for(const[c,w]of Object.entries(g.advances))if(!out.has(c))out.set(c,{advance:w});
  if(g.type==='bitmap'){
   let image=images.get(g.file);
   if(!image){image=PNG.sync.read(fs.readFileSync(root+'/assets/'+g.file.replace(':','/textures/')));images.set(g.file,image);}
   const rows=g.chars.map(s=>[...s]),w=image.width/rows[0].length,h=image.height/rows.length;
   rows.forEach((row,y)=>row.forEach((c,x)=>{
    if(c==='\0'||out.has(c))return;
    let right=-1;
    for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)if(image.data[((y*h+dy)*image.width+x*w+dx)*4+3])right=Math.max(right,dx);
    out.set(c,{advance:Math.floor((right+1)*g.height/h+0.5)+1,ascent:g.ascent,height:g.height});
   }));
  }
 }
 cache.set(id,out);return out;
}
assert(data.characters.length>0);assert.equal(data.offsets.length,186);
for(const y of data.offsets)for(const mode of ['default','uniform']){
 const gs=glyphs(`effect/flytext/name/${mode}/${y}`),back=glyphs(`effect/flytext/name/${mode}/space`);
 for(const c of data.characters){assert(gs.has(c));assert.equal(gs.get(c).advance+back.get(c).advance,0);}
 for(const bold of [false,true]){
  const backStyle=glyphs(`effect/flytext/name/${mode}/space${bold?'_bold':''}`);
  const lines=glyphs(`effect/flytext/name/${mode}/underline${bold?'_bold':''}/${y}`);
  for(const c of data.characters){
   const width=gs.get(c).advance+Number(bold);
   assert.equal(width+backStyle.get(c).advance,0);
   assert.equal(lines.get(c).advance+lines.get('\ue302').advance,width);
   assert.equal(lines.get(c).ascent,-y);
  }
 }
 for(const c of data.characters)if(c!==' ')assert.equal(gs.get(c).ascent,8-y);
}
for(const mode of ['default','uniform']){
 const g=glyphs(mode);
 assert.equal(g.get('\ue300').advance+g.get('\ue301').advance,0);
 assert.equal(g.get('\uf300').advance+g.get('\uf301').advance,0);
 assert.equal(g.get(mode==='default'?'\ue300':'\uf300').advance,0);
 assert.equal(g.get(mode==='default'?'\uf300':'\ue300').advance,65536);
}
const actual=fs.readdirSync(base+'effect/flytext').filter(x=>/^\d+\.json$/.test(x)).map(x=>parseInt(x)).sort((a,b)=>a-b);
assert.deepEqual(actual,data.offsets);
console.log(JSON.stringify({heights:data.offsets.length,glyphs:data.characters.length,modes:2,zeroAdvance:true,conditionalGates:true,nativeImageMiB:data.nativeImageBytes/1024**2}));
