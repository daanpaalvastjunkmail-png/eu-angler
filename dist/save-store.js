import {SCHEMA_VERSION} from './tackle.js';
export const SAVE_KEY='europa-angler-progress';
export const BACKUP_KEY='europa-angler-progress-backup';
export const LEGACY_KEY='europa-angler-idle-v2';
// The stable key is independent of release versions. Old browser tabs only know
// LEGACY_KEY and cannot overwrite the migrated game. Never rewrite that source.
export class SaveStore{
 constructor(storage){this.storage=storage;this.last=null;this.blocked=false;this.recovered=false;this.migrated=false;}
 load(validate){
  if(!this.storage)return null;
  const primary=this.storage.getItem(SAVE_KEY);this.last=primary;
  let invalid=false;
  for(const [key,text]of [[SAVE_KEY,primary],[BACKUP_KEY,this.storage.getItem(BACKUP_KEY)],[LEGACY_KEY,this.storage.getItem(LEGACY_KEY)]]){
   if(!text)continue;
   try{const raw=JSON.parse(text);if(Number(raw.schemaVersion)>SCHEMA_VERSION){this.blocked=true;this.error='NEWER_SAVE';return null;}const state=validate(raw);this.recovered=key===BACKUP_KEY||key!==SAVE_KEY&&primary!==null;this.migrated=key===LEGACY_KEY;this.recoveryUsed=this.recovered;return state;}
   catch(error){if(error.message==='NEWER_SAVE'){this.blocked=true;this.error='NEWER_SAVE';return null;}invalid=true;}
  }
  if(invalid){this.blocked=true;this.error='INVALID_SAVE';}return null;
 }
 write(text){
  if(!this.storage||this.blocked)return false;
  const current=this.storage.getItem(SAVE_KEY);
  if(current!==this.last){this.blocked=true;this.error='OTHER_TAB';return false;}
  if(text===this.last)return true;
  if(this.last&&!this.recovered){try{this.storage.setItem(BACKUP_KEY,this.last);}catch{}}
  try{this.storage.setItem(SAVE_KEY,text);}catch(error){
   // Main remains atomic and unchanged if quota is exceeded. Sacrifice only the
   // rolling backup, never the old-version source or current primary save.
   if(!this.storage.removeItem)throw error;
   this.storage.removeItem(BACKUP_KEY);this.storage.setItem(SAVE_KEY,text);
  }
  this.last=text;this.recovered=false;return true;
 }
 allowImport(){this.recovered=this.blocked;this.blocked=false;this.error=null;this.last=this.storage?.getItem(SAVE_KEY)||null;}
}
