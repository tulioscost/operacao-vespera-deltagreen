'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const importer = fs.readFileSync(path.join(root,'scripts/importer.mjs'),'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root,'data/vespera.json'),'utf8'));
const mod = 'operacao-vespera-deltagreen';
let counter = 0;
class MockLevel {
  constructor(scene, img='') {this.scene=scene;this.id='mockLevel'+(++counter);this.background={src:img};this.writes=0;}
  async update(data) {assert(Object.hasOwn(data, 'background.src'));this.background.src=data['background.src'];this.writes++;}
}
class MockScene {
  constructor(entry, {existingLevel=true, img='', version=2, owned=true}={}) {
    this.name=entry.name;this.entry=entry;this.tokenVision=false;this.fog={mode:0};this.levels={contents:existingLevel?[new MockLevel(this,img)]:[]};this.flags={key:owned?entry.id:'outro',sceneConfigVersion:version};this.writes=0;this.levelCreates=0;
  }
  get initialLevel(){return this.levels.contents[0]||null;}
  getFlag(module,key){assert.strictEqual(module,mod);return this.flags[key];}
  async setFlag(module,key,value){assert.strictEqual(module,mod);this.flags[key]=value;}
  async update(data){this.writes++;if(Object.hasOwn(data,'tokenVision'))this.tokenVision=data.tokenVision;if(Object.hasOwn(data,'fog.mode'))this.fog.mode=data['fog.mode'];if(Object.hasOwn(data,'initialLevel'))this.initialLevelId=data.initialLevel;}
  async createEmbeddedDocuments(type, docs){assert.strictEqual(type,'Level');this.levelCreates++;const l=new MockLevel(this,docs[0].background.src);this.levels.contents.push(l);return [l];}
}
const ownedScenes=data.scenes.map((entry,i)=>new MockScene(entry,{existingLevel:i!==1,img:i===2?'modules/another-module/something.webp':'',version:2}));
const stranger=new MockScene(data.scenes[0],{owned:false});
const all=[...ownedScenes,stranger];
const logs=[];
const ctx={
  Hooks:{once:()=>{}},
  game:{user:{isGM:true},system:{id:'deltagreen'},scenes:{contents:all},settings:{register:()=>{},get:()=>false,set:async()=>{}}},
  ui:{notifications:{info:m=>logs.push(m),error:m=>{throw new Error(m)},warn:m=>logs.push(m)}},
  fetch:async()=>({ok:true,json:async()=>data}),
  console,
  foundry:{utils:{deepClone:structuredClone}},
  CONFIG:{},
  Math
};
vm.createContext(ctx);vm.runInContext(importer,ctx,{filename:'importer.mjs'});
async function test(){
  const first=await vm.runInContext('repairScenes()',ctx);
  assert.strictEqual(first.updated,9,'should fix all 9 prior scenes');
  assert.strictEqual(first.checked,9,'foreign scene must not be changed');
  assert.strictEqual(first.failures.length,0);
  for(let i=0;i<9;i++){
    let s=ownedScenes[i],entry=data.scenes[i];
    assert.strictEqual(s.initialLevel.background.src,`modules/${mod}/${entry.image}`);
    assert.strictEqual(s.fog.mode,1);assert.strictEqual(s.tokenVision,true);
    assert.strictEqual(s.flags.sceneConfigVersion,3);
  }
  assert.strictEqual(ownedScenes[1].levelCreates,1,'must create missing Level once');
  assert.strictEqual(stranger.initialLevel.background.src,'','foreign scene must not be updated');
  const second=await vm.runInContext('repairScenes()',ctx);
  assert.strictEqual(second.updated,0,'reopening world must be idempotent');
  assert.strictEqual(ownedScenes[1].levelCreates,1,'must not duplicate Level');
  ownedScenes[3].initialLevel.background.src='modules/another/intentional-custom.webp';
  const third=await vm.runInContext('repairScenes()',ctx);
  assert.strictEqual(third.updated,0,'manual nonempty backgrounds are preserved after migration');
  const force=await vm.runInContext('repairScenes({force:true})',ctx);
  assert.strictEqual(force.updated,1,'optional force should restore canonical background');
  ownedScenes[4].initialLevel.background.src='';
  const fourth=await vm.runInContext('repairScenes()',ctx);
  assert.strictEqual(fourth.updated,1,'empty background must be repaired regardless version');
  console.log('OK: 9 scenes migrated to Levels, fog and tokenVision enabled, foreign scene unchanged, no duplicates, optional force and empty-map repair.');
}
test().catch(e=>{console.error(e);process.exitCode=1});
