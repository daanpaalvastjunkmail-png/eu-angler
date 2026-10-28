// Procedural bite sounds: no audio files, downloads or microphone access.
export class BiteAudio{
 constructor(){this.context=null;this.enabled=false;}
 async unlock(){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;try{this.context??=new Audio();await this.context.resume();this.enabled=true;return true;}catch{return false;}}
 mute(){this.enabled=false;}
 tone(frequency,start,length,gain=.025,type='sine',end=null){const ctx=this.context,osc=ctx.createOscillator(),volume=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,start);if(end)osc.frequency.exponentialRampToValueAtTime(end,start+length);volume.gain.setValueAtTime(.0001,start);volume.gain.linearRampToValueAtTime(gain,start+.006);volume.gain.exponentialRampToValueAtTime(.0001,start+length);osc.connect(volume);volume.connect(ctx.destination);osc.start(start);osc.stop(start+length+.01);}
 play(style,indicator=null,phase='bite'){
  const kind=style==='feeder'?(indicator?'bell':'silent'):style==='karper'?(indicator?'alarm':'reel'):style==='zee'?'ratchet':'silent';
  if(!this.enabled||!this.context||this.context.state!=='running'||kind==='silent')return kind;
  const t=this.context.currentTime,quiet=phase==='nibble'?.4:1;
  if(kind==='bell'){for(const delay of [0,.18])for(const f of [1760,2640,3520])this.tone(f,t+delay,.48,.012*quiet,'sine');}
  else if(kind==='alarm'){for(const delay of [0,.15,.3])this.tone(2100,t+delay,.08,.027,'square');}
  else{for(let i=0;i<12;i++)this.tone(110+(i%3)*40,t+i*.034,.027,.019,'sawtooth',75);}
  return kind;
 }
}
