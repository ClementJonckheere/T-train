const {test} = require('node:test');
const assert = require('node:assert/strict');
const Motivation = require('../motivation.js');
const flat = {id:'mass_flat',n:'Couché',sets:4,rep:[8,12],kg:10,load:'pair'};
function session(reps=[12,11,10,9], overrides={}) {
  return {id:1,date:'2026-11-10',programVersion:'mass-v1',partial:false,exercises:[{id:flat.id,load:'pair',sides:1,sets:reps.map(reps=>({kg:10,reps}))}],...overrides};
}
test('A daily goal adds one rep, never changes load, and distinguishes short/full formats',()=>{
  assert.equal(Motivation.nextRepGoal([flat],[session()]).target,43);
  assert.equal(Motivation.nextRepGoal([{...flat,kg:11}],[session()]),null);
  assert.equal(Motivation.nextRepGoal([{...flat,sets:2}],[session()]),null);
  assert.equal(Motivation.nextRepGoal([{...flat,sets:2}],[session([10,10])]).target,21);
});
test('Incomplete, legacy, mixed-load and outside-range sessions never establish targets or records',()=>{
  const mixed = session(); mixed.exercises[0].sets[1].kg=9;
  const old = session(); old.exercises[0].load='legacy';
  for(const entry of [session(undefined,{partial:true}),session(undefined,{programVersion:'legacy'}),mixed,old,session([13,11,10,9])]) {
    assert.equal(Motivation.nextRepGoal([flat],[entry]),null);
    assert.deepEqual(Motivation.records([entry],[flat]),[]);
  }
});
test('Targets stay within the programmed rep range, even at the upper boundary',()=>{
  assert.equal(Motivation.nextRepGoal([flat],[session([12,12,12,12])]),null);
  assert.deepEqual(Motivation.monthlyOptions([flat],[session([12,12,12,12])]),[]);
  assert.equal(Motivation.monthlyOptions([flat],[session([12,12,12,11])])[0].target,48);
});
test('Monthly progress respects chosen load, count, month and creation date',()=>{
  const target={...Motivation.monthlyOptions([flat],[session()])[0],period:'2026-11',createdAt:2};
  const success=session([12,12,11,9],{id:3,date:'2026-11-12'});
  assert.equal(Motivation.achieved(target,success),true);
  assert.equal(Motivation.achieved(target,{...success,id:1}),false);
  assert.equal(Motivation.achieved(target,{...success,date:'2026-12-01'}),false);
  assert.equal(Motivation.achieved(target,session([12,12],{id:3})),false);
  assert.equal(Motivation.achieved(target,{...success,partial:true}),false);
});
test('A first performance is a baseline; a true record must beat the same weight and count',()=>{
  const better=session([12,12,11,9],{id:2});
  assert.deepEqual(Motivation.newRecords(better,[],[flat]),[]);
  assert.equal(Motivation.newRecords(better,[session()],[flat])[0].previous,42);
  assert.deepEqual(Motivation.newRecords(better,[session([12,12,11,9])],[flat]),[]);
  assert.deepEqual(Motivation.newRecords(session([12,12],{id:2}),[session()],[flat]),[]);
});
test('Regularity counts three distinct completed training dates, including short sessions, without a streak reset',()=>{
  const target={createdAt:2,startDate:'2026-11-11'};
  const entries=[session(undefined,{id:1,date:'2026-11-11'}),session([10,10],{id:2,date:'2026-11-11',mode:15}),session(undefined,{id:3,date:'2026-11-11'}),session(undefined,{id:4,date:'2026-11-12',partial:true}),session(undefined,{id:5,date:'2026-11-15'}),session(undefined,{id:6,date:'2026-11-20'}),session(undefined,{id:7,date:'2026-12-01'})];
  assert.deepEqual(Motivation.regularity(target,entries),['2026-11-11','2026-11-20','2026-12-01']);
  assert.deepEqual(Motivation.regularity(null,entries),[]);
});
