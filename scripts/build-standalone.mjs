import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const esbuild=process.env.ANGLER_ESBUILD_MODULE?await import(process.env.ANGLER_ESBUILD_MODULE):await import('esbuild');
const out=path.resolve(process.argv[2]||path.join(root,'build','Europa-Angler.html'));
const dist=path.join(root,'dist');
const build=await esbuild.build({entryPoints:[path.join(dist,'app.js')],bundle:true,format:'iife',minify:true,legalComments:'inline',write:false});
let css=(await fs.readFile(path.join(dist,'style.css'),'utf8'))+'\n'+(await fs.readFile(path.join(dist,'atelier.css'),'utf8'))+'\n'+(await fs.readFile(path.join(dist,'account.css'),'utf8'));
let script=build.outputFiles[0].text;
for(const name of ['wetlands','forest-lake','alpine-fjord','atlantic']){
 const asset=`./assets/${name}.png`,data='data:image/png;base64,'+(await fs.readFile(path.join(dist,'assets',name+'.png'))).toString('base64');
 script=script.split(asset).join(data);css=css.split(asset).join(data);
}
let fonts=await fs.readFile(path.join(dist,'vendor/fonts.css'),'utf8');
for(const match of [...fonts.matchAll(/url\(([^)]+)\)/g)]){const name=match[1].replace(/['"]/g,'');const bytes=await fs.readFile(path.join(dist,'vendor',name));fonts=fonts.replace(match[0],`url(data:font/ttf;base64,${bytes.toString('base64')})`);}
css=css.replace("@import url('./vendor/fonts.css');",fonts);
const icon=await fs.readFile(path.join(dist,'icon.svg'),'utf8');
const iconData='data:image/svg+xml;base64,'+Buffer.from(icon).toString('base64');
const licenses=(await Promise.all(['DM-Sans-OFL.txt','Manrope-OFL.txt'].map(name=>fs.readFile(path.join(dist,'vendor',name),'utf8')))).join('\n\n');
let html=await fs.readFile(path.join(dist,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="account.css">','').replace('<link rel="manifest" href="manifest.webmanifest">','').replace('<link rel="stylesheet" href="atelier.css">','').replace('href="icon.svg"',`href="${iconData}"`).replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="app.js"></script>',()=>`<script>${script.replace(/<\/script/gi,'<\\/script')}</script><script type="text/plain" id="font-licenses">${licenses}</script>`);
await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,html);
console.log(`Standalone game written: ${out} (${(Buffer.byteLength(html)/1024).toFixed(0)} KB)`);
