const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');
const vanilla = process.argv[2];
if (!vanilla) throw new Error('Usage: node generate.cjs <extracted vanilla assets directory>');
const output = path.resolve(__dirname, '../../assets/minecraft/font/bossbar');
const source = JSON.parse(fs.readFileSync(path.join(output, 'vanilla.json')));
const bitmaps = source.providers.filter(p => p.type === 'bitmap');
for (const style of ['pink','blue','red','green','yellow','purple','white','notched_6','notched_10','notched_12','notched_20']) {
  const advances = {'.':-1,'-':-91};
  const providers = bitmaps.map((p, i) => {
    const name = `${style}_${i === 0 ? 'background' : 'progress'}.png`;
    const file = `minecraft:gui/sprites/boss_bar/${name}`;
    const image = PNG.sync.read(fs.readFileSync(path.join(vanilla, 'minecraft/textures/gui/sprites/boss_bar', name)));
    if (image.width !== 182 || image.height !== 5) throw new Error(`Unexpected sprite dimensions: ${name}`);
    const chars = [...p.chars[0]];
    for (let x=0; x<182; x++) {
      // Empty bitmap columns otherwise advance only one pixel before the -1 spacer.
      if (!Array.from({length:5}, (_,y)=>image.data[(y*182+x)*4+3]).some(a=>a!==0)) advances[chars[x]]=2;
    }
    return {...p, file};
  });
  fs.writeFileSync(path.join(output, `${style}.json`), JSON.stringify({providers:[{type:'space',advances},...providers]}, null, 2)+'\n');
}
const advances={};
for(let bit=0;bit<31;bit++) {
  advances[String.fromCodePoint(0xe000+bit)] = 2 ** bit;
  advances[String.fromCodePoint(0xe020+bit)] = -(2 ** bit);
}
advances[String.fromCodePoint(0xe040)] = 0.5;
advances[String.fromCodePoint(0xe041)] = -0.5;
fs.writeFileSync(path.join(output, 'space.json'),JSON.stringify({providers:[{type:'space',advances}]},null,2)+'\n');
