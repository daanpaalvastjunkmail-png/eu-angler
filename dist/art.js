let artSequence = 0;
const tint = (value, fallback) => /^#[0-9a-f]{3,8}$/i.test(String(value)) ? value : fallback;
const svg = (viewBox, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}" fill="none">${body}</svg>`;
const line = (d, color = '#c2b894', width = 1, extra = '') => `<path d="${d}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

export function gearArt(category, tier = 'start', style = 'feeder') {
  const id = `gear-${++artSequence}`;
  const advanced = /pro|elite|master|legend|premium|expert|carbon/i.test(String(tier));
  const copper = advanced ? '#d4aa63' : '#b49b71';
  const graphite = advanced ? '#454f47' : '#56604c';
  const defs = `<defs><linearGradient id="${id}-metal" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#e1dcc3"/><stop offset=".35" stop-color="#8d957f"/><stop offset=".65" stop-color="#c1c7af"/><stop offset="1" stop-color="#515e51"/></linearGradient><linearGradient id="${id}-fabric" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8a936a"/><stop offset="1" stop-color="#424f37"/></linearGradient></defs>`;
  const metal = `url(#${id}-metal)`;
  const fabric = `url(#${id}-fabric)`;
  const base = `<ellipse cx="163" cy="122" rx="87" ry="6" fill="#09160f" opacity=".32"/>`;
  let body = '';
  if (category === 'rod') {
    body = `<g transform="rotate(-14 160 70)">
      ${line('M 43 80 L 278 60', '#070f0b', 7)}${line('M 42 78 L 278 59', graphite, 4.7)}${line('M 112 72 L 279 58', '#bcc1a8', .7)}
      <path d="M 42 75 L 97 70 L 98 80 L 43 85 Z" fill="#ad9d75" stroke="#d2c299" stroke-width=".6"/>
      ${Array.from({length: 12}, (_, n) => line(`M ${47+n*4} ${75-n*.35} l 2 9`, '#756b4c', .5)).join('')}
      <path d="M 99 70 l 25 -2 1 10 -25 2 Z" fill="#25362c" stroke="${copper}"/>
      ${line('M 105 70 l 1 8 M 119 68 l 1 9', '#c7cab6', 1.5)}
      <path d="M 112 79 l 4 13 13 2 7 -8 -4 -9" stroke="${copper}" stroke-width="2"/>
      <ellipse cx="124" cy="95" rx="9" ry="7" fill="${metal}"/><path d="M 118 89 l 13 2 -2 10 -13 -2 Z" fill="#5f6a54" stroke="${copper}"/>
      ${line('M 130 96 l 10 6 7 -3', '#bbbea5', 1.8)}<ellipse cx="148" cy="98" rx="4" ry="2" fill="${copper}"/>
      ${[145,180,212,239,261,277].map((x,n)=>`<path d="M ${x} ${69-(x-145)*.085} l 3 6 3 -6" stroke="${copper}" stroke-width=".8"/><ellipse cx="${x+3}" cy="${76-(x-145)*.085}" rx="${3-n*.32}" ry="${1.8-n*.13}" stroke="#b4bea5" stroke-width=".7"/>`).join('')}
      ${line('M 122 95 Q 174 75 280 65', '#e0d5b2', .45, 'opacity=".6"')}
      <path d="M 265 59 l 15 -1" stroke="${style === 'dobber' ? '#d4c57a' : '#d0925d'}" stroke-width="2"/>
      <rect x="36" y="75" width="7" height="11" rx="2" fill="#333d32"/>
    </g>`;
  } else if (category === 'reel') {
    body = `<g transform="translate(4 -5)"><path d="M 151 43 L 160 22 181 22" stroke="${metal}" stroke-width="8" stroke-linecap="round"/><path d="M 175 18 h 37 v 7 h -37 Z" fill="${graphite}" stroke="${copper}"/>
      <path d="M 137 49 Q 162 39 180 51 L 190 82 Q 178 105 156 104 L 137 83 Z" fill="${fabric}" stroke="#afba98" stroke-width="1.2"/>
      <path d="M 145 55 Q 160 48 174 56 L 181 78 166 91 149 86 Z" fill="#374538" stroke="#818d71"/>
      <circle cx="163" cy="73" r="13" fill="${metal}"/><circle cx="163" cy="73" r="8" fill="#3d4b3b" stroke="${copper}"/><circle cx="163" cy="73" r="3" fill="${copper}"/>
      <path d="M 137 56 C 109 40 99 48 101 75" stroke="${metal}" stroke-width="3"/>
      <ellipse cx="121" cy="63" rx="23" ry="16" fill="${metal}" stroke="#d1d7bc"/><path d="M 98 62 L 100 90 Q 120 104 143 88 L 144 62" fill="#727b61" stroke="${copper}"/>
      ${Array.from({length:7},(_,n)=>line(`M 100 ${65+n*3} Q 119 ${79+n*3} 142 ${65+n*3}`,n%2?'#b8bca1':'#4f5e49',1)).join('')}
      <ellipse cx="121" cy="61" rx="23" ry="14" fill="${metal}" stroke="${copper}"/><ellipse cx="121" cy="61" rx="15" ry="8" fill="#455240" stroke="#d3c9a3"/><ellipse cx="121" cy="61" rx="7" ry="4" fill="#b9bd9f"/>
      <path d="M 171 77 L 203 92 220 83" stroke="${metal}" stroke-width="4" stroke-linecap="round"/><rect x="213" y="73" width="23" height="13" rx="6.5" fill="#434d38" stroke="${copper}" transform="rotate(-24 224 80)"/>
      <path d="M 99 75 C 89 34 142 26 149 62" stroke="#dce0c8" stroke-width="1.5"/>
    </g>`;
  } else if (category === 'line') {
    body = `<path d="M 198 85 C 275 84 263 37 219 42 C 187 46 209 110 264 108" stroke="#b7c3a3" stroke-width=".8" opacity=".8"/>
      <ellipse cx="143" cy="44" rx="47" ry="19" fill="${metal}" stroke="#d3d6bc"/><path d="M 96 44 V 98 Q 142 128 190 98 V 44" fill="#626e56" stroke="${copper}"/>
      ${Array.from({length:16},(_,n)=>line(`M 99 ${48+n*3} Q 141 ${71+n*3} 187 ${48+n*3}`,n%2?'#a9b491':'#758367',.8)).join('')}
      <ellipse cx="143" cy="98" rx="47" ry="18" fill="none" stroke="#b9bea1" stroke-width="3"/><ellipse cx="143" cy="44" rx="47" ry="19" fill="${metal}" stroke="${copper}"/>
      <ellipse cx="143" cy="44" rx="35" ry="13" fill="#344b3b"/><ellipse cx="143" cy="44" rx="12" ry="5" fill="#17291e" stroke="#929f7c"/>
      <path d="M 120 38 Q 144 29 165 38 M 118 49 Q 144 58 169 47" stroke="${copper}" stroke-width="2"/><path d="M 112 80 Q 143 92 174 80 V 96 Q 143 107 112 95 Z" fill="#d7d4b5" opacity=".9"/><path d="M 122 89 Q 143 96 164 89" stroke="#536144" stroke-width="2"/>
    `;
  } else if (category === 'hook') {
    body = `<g transform="rotate(-16 150 70)"><ellipse cx="129" cy="26" rx="5" ry="7" stroke="${metal}" stroke-width="3"/><path d="M 129 34 V 79 C 129 121 192 121 192 80 V 58 L 184 73" stroke="${metal}" stroke-width="4" stroke-linejoin="round"/><path d="M 192 58 l -1 21 -7 -6" fill="${copper}"/><path d="M 129 36 C 112 27 95 33 95 46 C 94 61 127 61 129 44" stroke="#c3bea0" stroke-width=".8"/><path d="M 126 37 l 6 3 -6 3 6 3 -6 3 6 3" stroke="#c3b58b" stroke-width="1.8"/><path d="M 95 46 Q 71 63 70 96" stroke="#c3bea0" stroke-width=".7"/></g><g opacity=".25" transform="translate(68 12) scale(.65)"><path d="M 129 34 V 79 C 129 121 192 121 192 80 V 58 L 184 73" stroke="#bdc7ad" stroke-width="3"/><ellipse cx="129" cy="26" rx="5" ry="7" stroke="#bdc7ad" stroke-width="3"/></g>`;
  } else if (category === 'bait') {
    const boilies = [[116,94,14],[138,105,15],[160,91,16],[179,108,13],[196,89,15],[137,79,13],[176,74,13]];
    body = `<path d="M 125 31 L 180 26 205 83 137 104 109 55 Z" fill="#888963" stroke="#c9c6a2"/><path d="M 127 32 L 176 29 180 41 130 45 Z" fill="#c4b18b"/><path d="M 130 52 L 177 43 190 76 143 88 Z" fill="#344d38"/><path d="M 139 62 L 175 55 M 141 69 L 173 62 M 144 77 L 165 71" stroke="#d3c7a3" stroke-width="2"/>
      ${boilies.map(([x,y,r],n)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${n%3===0?'#ad8054':n%3===1?'#b99d68':'#8e724e'}" stroke="#d5b885" stroke-width=".6"/>${Array.from({length:9},(_,k)=>`<circle cx="${x+Math.cos(k*2.4)*(r*.65)}" cy="${y+Math.sin(k*2.4)*(r*.62)}" r=".8" fill="#624c31" opacity=".5"/>`).join('')}<path d="M ${x-r*.55} ${y-r*.25} q 2 -6 8 -6" stroke="#e7c995" stroke-width="1" opacity=".55"/>`).join('')}`;
  } else if (category === 'terminal') {
    body = style === 'dobber' ? `<path d="M 159 16 L 159 116" stroke="#c9c9ac" stroke-width="1.3"/><path d="M 157 20 h 4 v 25 h -4 Z" fill="#da8b5d"/><path d="M 157 28 h 4 v 4 h -4 Z" fill="#e8ddc5"/><path d="M 159 44 C 138 63 141 82 159 91 C 177 82 180 63 159 44" fill="${fabric}" stroke="${copper}"/><path d="M 149 58 Q 158 53 169 58 M 145 69 Q 159 63 173 69" stroke="#d3cba5" stroke-width="1.6"/><path d="M 159 16 C 209 32 207 115 236 99" stroke="#bdc6ab" stroke-width=".7"/><circle cx="202" cy="83" r="3" fill="${metal}"/><circle cx="211" cy="99" r="2.5" fill="${metal}"/>` : `<g transform="rotate(-19 155 70)"><path d="M 148 25 Q 140 13 151 12 Q 162 13 155 25" stroke="${metal}" stroke-width="1.5"/><path d="M 150 24 V 35" stroke="${metal}" stroke-width="2"/><path d="M 127 40 Q 150 29 174 40 L 184 103 Q 152 119 119 103 Z" fill="#5e6850" stroke="#c0b78e" stroke-width="2"/><path d="M 130 40 L 126 101 M 141 36 L 140 108 M 154 36 L 155 109 M 167 39 L 172 106 M 124 54 Q 151 65 177 54 M 122 70 Q 152 82 180 69 M 121 87 Q 154 99 182 86" stroke="#b4b596" stroke-width="1.1"/><path d="M 118 100 Q 151 117 184 102 L 184 109 Q 153 124 119 110 Z" fill="${metal}"/><path d="M 152 12 Q 213 2 211 49 Q 198 82 230 105" stroke="#c7c5ab" stroke-width=".7"/><path d="M 230 105 v 9 q 13 15 15 -3 l -4 4" stroke="#c8cab0" stroke-width="1.4"/></g>`;
  } else if (category === 'jacket') {
    body = `<path d="M 141 24 L 124 32 102 42 80 91 103 102 123 67 120 122 200 122 197 67 217 102 240 91 218 42 195 32 177 24 Z" fill="${fabric}" stroke="#b6bb94" stroke-width="1.1"/><path d="M 141 24 Q 159 14 177 24 L 184 41 160 52 135 42 Z" fill="#43563d" stroke="#aeb68d"/><path d="M 144 25 L 160 43 175 25 M 160 45 V 121" stroke="#c3bda0" stroke-width="1.3"/><path d="M 124 40 L 137 50 134 75 121 79 M 195 40 L 182 50 186 75 199 79" stroke="#45583e" stroke-width="4"/><path d="M 128 83 h 24 v 25 h -25 Z M 168 83 h 24 l 2 25 h -26 Z" fill="#667453" stroke="#a5ad87"/><path d="M 128 86 h 23 M 169 86 h 23 M 123 116 h 74" stroke="#d1c49c" stroke-width=".8"/><path d="M 84 88 l 20 9 M 217 97 l 18 -9" stroke="#384b33" stroke-width="5"/><rect x="171" y="57" width="14" height="8" rx="1" fill="#b9aa7c"/><path d="M 174 62 l 4 -3 4 3" stroke="#536545" stroke-width="1"/>`;
  } else if (category === 'boots') {
    body = `<g transform="rotate(-8 127 70)"><path d="M 103 25 L 143 25 141 85 157 97 Q 163 107 154 115 H 94 Q 85 105 91 96 L 99 84 Z" fill="${fabric}" stroke="#b1ba91"/><path d="M 100 25 Q 120 33 143 25 L 143 36 Q 120 44 100 36 Z" fill="#a2a67d"/><path d="M 89 105 Q 118 113 159 105 V 116 H 92 Z" fill="#27382a" stroke="#8c9674"/><path d="M 107 43 L 105 83 117 91 M 101 96 Q 122 87 143 96" stroke="#b3b18c" stroke-width="1"/>${[98,108,118,128,138,148].map(x=>line(`M ${x} 111 v 5`,'#a3ab88',1)).join('')}</g><g transform="translate(55 -4) rotate(6 127 70)"><path d="M 103 25 L 143 25 141 85 157 97 Q 163 107 154 115 H 94 Q 85 105 91 96 L 99 84 Z" fill="${fabric}" stroke="#b1ba91"/><path d="M 100 25 Q 120 33 143 25 L 143 36 Q 120 44 100 36 Z" fill="#a2a67d"/><path d="M 89 105 Q 118 113 159 105 V 116 H 92 Z" fill="#27382a" stroke="#8c9674"/><path d="M 107 43 L 105 83 117 91 M 101 96 Q 122 87 143 96" stroke="#b3b18c" stroke-width="1"/></g>`;
  } else if (category === 'bag') {
    body = `<path d="M 137 44 V 31 Q 159 15 181 31 V 44" stroke="#a5a781" stroke-width="7"/><path d="M 111 41 Q 159 29 208 42 L 224 102 Q 161 126 98 106 Z" fill="${fabric}" stroke="#bac09a"/><path d="M 110 41 L 98 106 119 111 128 44 Z" fill="#485e40"/><path d="M 108 50 Q 160 37 210 51 M 107 57 Q 160 44 211 58" stroke="#ccbf97" stroke-width="1"/><path d="M 135 68 Q 166 59 198 69 L 203 99 Q 167 112 131 102 Z" fill="#62774e" stroke="#acb18b"/><path d="M 137 76 Q 166 67 199 76" stroke="#d0c59b" stroke-width="1"/><path d="M 127 42 L 126 108 M 194 41 L 210 108" stroke="#283d2b" stroke-width="7"/><rect x="122" y="60" width="10" height="14" rx="1" fill="#9da582" stroke="#d1caa7"/><rect x="193" y="58" width="10" height="14" rx="1" fill="#9da582" stroke="#d1caa7" transform="rotate(-9 198 65)"/><path d="M 104 66 Q 78 48 66 80 Q 62 99 101 99" stroke="#7b8965" stroke-width="6"/><rect x="152" y="83" width="28" height="11" rx="2" fill="#b3a47b"/><path d="M 159 89 l 6 -3 7 3" stroke="#485e40" stroke-width="1.4"/>`;
  } else if (category === 'chair') {
    body = `<path d="M 117 28 L 110 90 193 119 M 194 28 L 204 90 120 119 M 109 75 L 109 112 M 205 75 L 205 112" stroke="${metal}" stroke-width="4" stroke-linecap="round"/><path d="M 119 29 Q 157 20 192 29 L 192 76 Q 155 89 114 77 Z" fill="${fabric}" stroke="#bcc199"/><path d="M 119 35 Q 157 27 188 35 L 187 69 Q 155 82 119 71 Z" stroke="#abb48a" stroke-width=".8"/><path d="M 114 79 L 99 94 Q 156 111 215 94 L 193 78 Q 156 89 114 79" fill="#6e7e58" stroke="#bdc198"/><path d="M 106 61 L 95 81 118 87 M 198 61 L 221 81 196 88" stroke="${metal}" stroke-width="3"/><path d="M 100 70 L 119 76 M 203 70 L 219 77" stroke="#9c9975" stroke-width="7" stroke-linecap="round"/><path d="M 102 114 h 15 M 197 114 h 15 M 113 121 h 15 M 186 121 h 15" stroke="#a1aa8e" stroke-width="3" stroke-linecap="round"/>`;
  } else {
    body = `<path d="M 105 44 h 110 v 62 H 105 Z" fill="${fabric}" stroke="#aeb695"/><path d="M 105 66 h 110 M 126 44 v 62 M 194 44 v 62" stroke="${copper}"/><path d="M 139 44 V 32 h 42 v 12" stroke="#aeb695" stroke-width="4"/><rect x="151" y="60" width="18" height="13" rx="2" fill="${metal}"/>`;
  }
  return svg('0 0 320 140', defs + base + body, 'Visuitrusting');
}

export function fishArt(color = '#b49b62', large = false) {
  color = tint(color, '#b49b62');
  const id = `fish-${++artSequence}`;
  const bodyPath = 'M 61 79 C 87 36 162 30 210 55 Q 237 62 258 81 Q 234 100 210 111 C 151 137 89 120 61 89 L 26 116 Q 31 88 25 54 Z';
  const scales = Array.from({length:9},(_,row)=>Array.from({length:16},(_,col)=> {
    const x = 72+col*10+(row%2)*5, y=44+row*9;
    return `<path d="M ${x} ${y} q 6 6 0 12" stroke="#453f2a" stroke-width=".7" opacity="${row<3?.25:.4}"/>`;
  }).join('')).join('');
  return svg('0 0 320 160', `<defs><linearGradient id="${id}-body" x1="0" y1="0" x2=".1" y2="1"><stop stop-color="#555d3d"/><stop offset=".4" stop-color="${color}"/><stop offset=".75" stop-color="#d2bc85"/><stop offset="1" stop-color="#f0dfb4"/></linearGradient><clipPath id="${id}-clip"><path d="${bodyPath}"/></clipPath></defs>
    <ellipse cx="155" cy="136" rx="107" ry="5" fill="#09170f" opacity=".22"/>
    <g transform="${large ? 'translate(-10 -4) scale(1.06)' : 'translate(9 0)'}">
    <path d="M 99 53 Q 129 15 157 31 L 192 54" fill="#8e8252" stroke="#bfad76"/>
    ${Array.from({length:12},(_,n)=>line(`M ${105+n*7} ${48+Math.abs(n-5)*.5} L ${113+n*6} ${32+Math.abs(n-5)*1.7}`,'#d6c08b',.65)).join('')}
    <path d="M 115 109 Q 118 142 143 140 L 159 113 M 180 111 L 195 134 210 112" fill="#a9915d" stroke="#d1ba83"/>
    <path d="${bodyPath}" fill="url(#${id}-body)" stroke="#d5c38f" stroke-width="1"/>
    <g clip-path="url(#${id}-clip)">${scales}</g>
    <path d="M 62 81 L 28 59 M 62 84 L 29 72 M 62 86 L 31 85 M 62 88 L 30 100 M 62 91 L 29 112" stroke="#d4b779" stroke-width=".8"/>
    <path d="M 211 57 Q 185 83 209 111" stroke="#6b6640" stroke-width="2"/><path d="M 216 61 Q 195 84 215 105" stroke="#e2cb96" stroke-width=".8"/>
    <path d="M 189 88 Q 164 94 151 119 Q 177 125 199 98" fill="#aa945e" stroke="#ddc68c"/>
    ${Array.from({length:6},(_,n)=>line(`M 194 ${94+n*.8} L ${156+n*5} ${118-n*.3}`,'#e3c995',.65)).join('')}
    <path d="M 78 80 Q 139 65 195 82" stroke="#e3ca91" stroke-width=".8" opacity=".65"/>
    <circle cx="230" cy="75" r="6" fill="#dfc88c"/><circle cx="231" cy="75" r="3.5" fill="#1d2a21"/><circle cx="232" cy="73.5" r="1.1" fill="#f2edcf"/>
    <path d="M 246 82 L 259 81 M 251 86 Q 261 89 264 86 M 245 91 Q 250 102 255 99" stroke="#74613c" stroke-width="1.2"/>
    <path d="M 217 96 Q 228 103 237 94" stroke="#b29862" stroke-width=".7"/>
    </g>`, 'Europese zoetwatervis');
}

export function crayfishArt(color = '#b88062') {
  color = tint(color, '#b88062');
  return svg('0 0 320 160', `<g class="crayfish-art" stroke="#d3aa80" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="161" cy="139" rx="94" ry="5" fill="#09170f" stroke="none" opacity=".22"/>
    <g fill="none" stroke-width="2">
      <path d="M 138 72 L 107 80 89 101 M 137 84 L 109 97 99 117 M 141 94 L 120 111 117 130 M 182 72 L 213 80 231 101 M 183 84 L 211 97 221 117 M 179 94 L 200 111 203 130"/>
      <path d="M 150 52 Q 130 24 111 20 M 170 52 Q 190 24 209 20" stroke-width="1"/>
    </g>
    <g fill="${color}">
      <path d="M 145 68 L 120 62 104 46 95 52 108 73 138 81 M 175 68 L 200 62 216 46 225 52 212 73 182 81"/>
      <path d="M 102 50 Q 75 64 65 42 Q 57 26 69 16 L 77 37 86 34 80 12 Q 108 20 102 50 M 218 50 Q 245 64 255 42 Q 263 26 251 16 L 243 37 234 34 240 12 Q 212 20 218 50"/>
      <path d="M 148 48 L 160 37 172 48 Q 188 64 179 92 L 172 122 148 122 141 92 Q 132 64 148 48"/>
      <path d="M 148 117 Q 132 122 137 137 L 153 132 160 141 167 132 183 137 Q 188 122 172 117 Z"/>
    </g>
    <path d="M 143 84 Q 160 92 177 84 M 144 95 Q 160 103 176 95 M 147 106 Q 160 113 173 106 M 149 116 Q 160 122 171 116" fill="none"/>
    <path d="M 158 52 L 158 78" stroke="#e0ba91" opacity=".5"/>
    <g fill="#19291f" stroke-width="1.5"><circle cx="145" cy="49" r="3"/><circle cx="175" cy="49" r="3"/></g>
  </g>`, 'Rivierkreeft');
}

export function catchArt(species) {
  return species?.kind==='crayfish'?crayfishArt(species.color):fishArt(species?.color);
}

export function waterArt(id, color) {
  const key = String(id || 'meer');
  let seed = 2166136261;
  for (let n = 0; n < key.length; n++) seed = Math.imul(seed ^ key.charCodeAt(n), 16777619) >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525)+1013904223)>>>0; return seed/4294967296; };
  const palette = tint(color, '#5e8478');
  const variant = seed % 3;
  const shapes = [
    'M 112 39 C 150 19 183 35 208 29 C 238 20 250 45 275 51 C 317 62 326 99 296 121 C 268 137 241 121 217 138 C 194 155 162 139 141 125 C 123 115 87 112 91 88 C 94 67 86 52 112 39 Z',
    'M 125 31 C 154 24 174 47 185 64 C 199 82 209 57 227 43 C 249 23 289 36 294 59 C 299 83 268 90 261 111 C 251 142 217 149 192 133 C 165 116 140 130 116 113 C 89 95 105 79 105 58 C 103 43 112 35 125 31 Z',
    'M 92 69 C 101 37 135 43 161 32 C 193 17 231 32 250 52 C 269 73 307 66 316 92 C 322 117 296 143 262 137 C 232 132 210 146 185 134 C 160 121 162 98 137 102 C 106 110 82 96 92 69 Z'
  ];
  const lake = shapes[variant];
  const artId = `water-${++artSequence}`;
  const trees = Array.from({length:100},()=>{
    const x=12+random()*376,y=9+random()*162;
    const dx=(x-201)/127,dy=(y-87)/66;
    if(dx*dx+dy*dy<1.22) return '';
    const r=2+random()*4.5;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${random()>.5?'#72896b':'#899b75'}" opacity=".6"/><circle cx="${(x-.8).toFixed(1)}" cy="${(y-1).toFixed(1)}" r="${(r*.6).toFixed(1)}" fill="#b0bb8b" opacity=".45"/>`;
  }).join('');
  return svg('0 0 400 180', `<defs><pattern id="${artId}-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 H 0 V 25" stroke="#657b65" opacity=".12" stroke-width=".5"/></pattern><clipPath id="${artId}-lake"><path d="${lake}"/></clipPath></defs>
    <rect width="400" height="180" fill="#bdc5a1"/><rect width="400" height="180" fill="url(#${artId}-grid)"/>
    ${[1.25,1.48,1.74,2.04].map((scale,n)=>`<path d="${lake}" transform="translate(${200-200*scale} ${90-90*scale}) scale(${scale})" stroke="#849779" stroke-width=".65" opacity="${.55-n*.08}"/>`).join('')}
    <path d="M -10 141 Q 62 142 76 101 T 126 17 M 66 181 Q 78 148 133 146 T 249 159 Q 315 171 345 123 T 410 110" stroke="#e9dfbc" stroke-width="5"/><path d="M -10 141 Q 62 142 76 101 T 126 17 M 66 181 Q 78 148 133 146 T 249 159 Q 315 171 345 123 T 410 110" stroke="#a99f7b" stroke-width=".6" stroke-dasharray="3 3"/>
    ${trees}<path d="${lake}" fill="${palette}" stroke="#e1d9b1" stroke-width="3"/>
    <g clip-path="url(#${artId}-lake)">${[.85,.64,.43].map((scale,n)=>`<path d="${lake}" transform="translate(${200-200*scale} ${90-90*scale}) scale(${scale})" stroke="#b7d1b7" stroke-width=".65" opacity="${.5-n*.1}"/>`).join('')}<path d="M 80 86 Q 161 74 220 89 T 319 80 M 72 102 Q 156 90 218 105 T 330 94" stroke="#bdd1b8" stroke-width=".45" opacity=".3"/></g>
    <path d="M 131 131 L 143 115" stroke="#b9a77c" stroke-width="5"/><path d="M 130 129 L 140 137 M 133 125 L 143 132 M 136 121 L 146 128" stroke="#e6d8af" stroke-width=".8"/>
    <circle cx="140" cy="122" r="8" fill="#233d30" stroke="#e5d7ac" stroke-width="1.5"/><circle cx="140" cy="122" r="2.7" fill="#d7be7b"/>
    <path d="M 33 36 V 17 L 28 26 M 33 17 L 38 26" stroke="#425f4a" stroke-width="1"/><text x="33" y="12" text-anchor="middle" font-family="sans-serif" font-size="7" fill="#425f4a">N</text>
    <path d="M 336 156 h 42 M 336 153 v 6 M 357 153 v 6 M 378 153 v 6" stroke="#4d6951" stroke-width="1"/><text x="357" y="169" text-anchor="middle" font-family="sans-serif" font-size="6" letter-spacing="1" fill="#4d6951">200 M</text>`, 'Kaart van het viswater');
}

export function avatarArt() {
  const id = `avatar-${++artSequence}`;
  return svg('0 0 280 360', `<defs><linearGradient id="${id}-jacket" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a1ab78"/><stop offset="1" stop-color="#4d6346"/></linearGradient><linearGradient id="${id}-pants" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6d7760"/><stop offset="1" stop-color="#364b39"/></linearGradient></defs>
    <ellipse cx="141" cy="336" rx="66" ry="11" fill="#0b1910" opacity=".45"/>
    <circle cx="141" cy="151" r="99" stroke="#81916b" stroke-width=".5" opacity=".2"/><circle cx="141" cy="151" r="115" stroke="#81916b" stroke-width=".5" stroke-dasharray="2 10" opacity=".2"/>
    <path d="M 81 332 L 67 302 M 73 317 L 62 313 M 77 325 L 86 311 M 207 334 L 219 308 M 212 324 L 226 320" stroke="#71825a" stroke-width="1.4"/>
    <path d="M 111 211 L 111 277 105 310 129 314 146 242 153 272 154 313 179 313 179 256 171 210 Z" fill="url(#${id}-pants)" stroke="#9ca880"/>
    <path d="M 143 218 L 146 242 M 121 232 L 119 271 M 165 231 L 169 272" stroke="#9ca480" stroke-width=".8"/>
    <path d="M 107 284 L 132 285 128 318 132 332 Q 110 340 93 333 L 94 324 103 316 Z M 152 286 L 177 285 179 315 190 325 189 334 Q 170 340 152 333 L 155 319 Z" fill="#344a34" stroke="#a3af85"/>
    <path d="M 107 288 L 131 289 M 153 289 L 177 288" stroke="#7c8b61" stroke-width="5"/><path d="M 94 332 Q 112 338 132 331 M 153 333 Q 171 339 190 332" stroke="#b7b899" stroke-width="2.5"/>
    <path d="M 117 97 Q 138 86 161 97 L 182 109 196 154 186 170 166 139 174 213 Q 143 230 106 213 L 113 139 94 172 78 158 97 111 Z" fill="url(#${id}-jacket)" stroke="#b1bc91"/>
    <path d="M 118 96 Q 141 110 162 96 L 155 116 141 125 124 116 Z" fill="#334e38" stroke="#9cac82"/>
    <path d="M 141 125 L 141 219" stroke="#d2c79e" stroke-width="1.2"/><path d="M 108 201 Q 140 214 172 201 M 115 111 L 126 128 M 166 112 L 156 129" stroke="#d1c59d" stroke-width=".7"/>
    <path d="M 115 161 L 132 164 131 189 113 186 Z M 150 164 L 168 161 170 186 150 189 Z" fill="#61794e" stroke="#b0b78c"/><path d="M 115 165 L 131 168 M 151 168 L 168 165" stroke="#d1c59d" stroke-width=".9"/>
    <rect x="150" y="136" width="15" height="9" rx="1" fill="#b6a878"/><path d="M 153 142 l 4 -3 5 3" stroke="#4c6642"/>
    <path d="M 91 162 L 109 170 124 152 134 158 119 183 Q 110 191 99 182 L 79 170 Z" fill="#8a9b6a" stroke="#bac296"/>
    <path d="M 188 153 L 174 166 157 153 149 163 170 183 Q 180 186 189 174 L 199 160 Z" fill="#748a5c" stroke="#b7c090"/>
    <path d="M 124 151 Q 131 141 137 144 L 143 150 138 159 130 162 Z M 155 151 Q 148 143 142 149 L 140 157 149 165 156 161 Z" fill="#c4aa82" stroke="#e2c69a" stroke-width=".6"/>
    <path d="M 126 84 L 126 103 Q 139 115 151 103 L 151 83" fill="#b49a74"/>
    <path d="M 120 57 Q 137 44 155 58 L 158 80 Q 151 99 138 101 Q 122 94 119 77 Z" fill="#c6ae86" stroke="#e1c89e" stroke-width=".6"/>
    <path d="M 120 71 L 123 87 Q 139 102 153 85 L 157 70 152 77 148 84 129 83 Z" fill="#695d43" opacity=".75"/>
    <path d="M 128 87 Q 138 93 148 87 M 136 72 L 133 81 139 82" stroke="#947c59" stroke-width=".9"/>
    <path d="M 122 70 L 133 69 M 143 69 L 154 70" stroke="#384735" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 117 63 Q 111 39 136 35 Q 159 33 161 60 Z" fill="#6c8153" stroke="#b1ba89"/><path d="M 116 58 Q 140 54 161 59 L 174 65 Q 151 72 117 65 Z" fill="#435e3d" stroke="#a7b280"/><path d="M 134 36 Q 130 45 132 56 M 151 39 Q 155 46 155 56" stroke="#a3af7e" stroke-width=".7"/><rect x="137" y="45" width="12" height="7" rx="1" fill="#b6ad7c"/>
    <path d="M 100 215 L 209 31" stroke="#182c20" stroke-width="4"/><path d="M 100 215 L 209 31" stroke="#b7b997" stroke-width="1.3"/><path d="M 103 210 L 128 167" stroke="#b79e70" stroke-width="5"/><path d="M 108 202 L 126 171" stroke="#4c563b" stroke-width=".8"/>
    <path d="M 131 162 L 137 168 132 180 123 178" stroke="#b3ba94" stroke-width="2"/><ellipse cx="132" cy="174" rx="6" ry="8" fill="#79866a" stroke="#d1c499"/><path d="M 137 176 L 145 180 148 175" stroke="#d1c499" stroke-width="1.3"/>
    <path d="M 156 120 l 5 3 2 -7 M 174 90 l 5 3 1 -6 M 190 63 l 4 2 1 -5 M 204 40 l 4 2 1 -5" stroke="#c0c6a7" stroke-width=".7"/><path d="M 211 32 Q 229 95 224 169" stroke="#d0d1b1" stroke-width=".5" opacity=".6"/>
    <path d="M 223 168 l 2 14" stroke="#c79d67" stroke-width="2"/><path d="M 224 168 l 1 4" stroke="#e2c9a0" stroke-width="2"/>
  `, 'Visser met persoonlijke uitrusting');
}
