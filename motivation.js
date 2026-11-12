/* Objectifs facultatifs. Comparaisons à exercice, charge et nombre de séries identiques. */
const Motivation = (() => {
  const complete = entry => entry.programVersion === 'mass-v1' && entry.partial === false;
  const ordered = history => [...history].sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id);
  function stats(ex, saved, count = ex.sets) {
    if (!saved || saved.id !== ex.id || saved.load !== ex.load || (saved.sides || 1) !== (ex.sides || 1) || saved.sets.length !== count) return null;
    if (count !== ex.sets && count !== 2) return null;
    const kg = saved.sets[0]?.kg;
    if (!Number.isFinite(kg) || kg < 0 || (!ex.allowZero && kg === 0)) return null;
    if (!saved.sets.every(s => s.kg === kg && Number.isInteger(s.reps) && s.reps >= ex.rep[0] && s.reps <= ex.rep[1])) return null;
    return {kg, total:saved.sets.reduce((sum,s) => sum+s.reps,0), sets:count};
  }
  function goal(ex, value, entry, increment) {
    const target = Math.min(value.total+increment, ex.rep[1]*value.sets);
    if (target <= value.total) return null;
    return {exerciseId:ex.id, name:ex.n, kg:value.kg, load:ex.load, sides:ex.sides || 1, sets:value.sets, rep:[...ex.rep], baseline:value.total, target, baselineSessionId:entry.id};
  }
  function nextRepGoal(exercises, history) {
    for (const ex of exercises) {
      if (ex.kg == null) continue;
      for (const entry of ordered(history).filter(complete)) {
        const value = stats(ex, entry.exercises.find(e => e.id === ex.id));
        if (value && value.kg === ex.kg) {
          const proposal = goal(ex,value,entry,1);
          if (proposal) return proposal;
          break; // The most recent comparable session is already at the upper limit.
        }
      }
    }
    return null;
  }
  function monthlyOptions(definitions, history) {
    const seen = new Set(), options = [];
    for (const entry of ordered(history).filter(complete)) for (const saved of entry.exercises) {
      const ex = definitions.find(e => e.id === saved.id);
      if (!ex) continue;
      const value = stats(ex,saved,saved.sets.length), key = `${saved.id}|${saved.sets.length}`;
      if (!value || seen.has(key)) continue;
      seen.add(key);
      const proposal = goal(ex,value,entry,2);
      if (proposal) options.push(proposal);
    }
    return options;
  }
  function progress(target, entry) {
    if (!target || !complete(entry)) return null;
    const ex = {id:target.exerciseId, load:target.load, sides:target.sides, sets:target.sets, rep:target.rep, allowZero:target.kg === 0};
    const value = stats(ex,entry.exercises.find(e => e.id === ex.id));
    return value?.kg === target.kg ? value.total : null;
  }
  function achieved(target, entry) {
    if (target.period && (entry.date.slice(0,7) !== target.period || entry.id < target.createdAt || entry.id === target.baselineSessionId)) return false;
    const total = progress(target,entry);
    return total !== null && total >= target.target;
  }
  function records(history, definitions) {
    const best = new Map();
    for (const entry of ordered(history).filter(complete)) for (const saved of entry.exercises) {
      const ex = definitions.find(e => e.id === saved.id);
      if (!ex) continue;
      const value = stats(ex,saved,saved.sets.length);
      if (!value) continue;
      const key = `${saved.id}|${value.kg}|${value.sets}`, previous = best.get(key);
      if (!previous || value.total > previous.total) best.set(key,{...value,id:ex.id,name:ex.n,load:ex.load,date:entry.date,sessionId:entry.id});
    }
    return [...best.values()].sort((a,b) => b.date.localeCompare(a.date) || b.sessionId-a.sessionId);
  }
  function newRecords(entry, history, definitions) {
    if (!complete(entry)) return [];
    const previous = records(history,definitions);
    return records([entry],definitions).flatMap(value => {
      const old = previous.find(p => p.id === value.id && p.kg === value.kg && p.sets === value.sets);
      return old && value.total > old.total ? [{...value,previous:old.total}] : [];
    });
  }
  function regularity(target, history) {
    if (!target) return [];
    return [...new Set(history.filter(entry => complete(entry) && entry.id >= target.createdAt && entry.date >= target.startDate && new Date(entry.date+'T12:00:00').getDay() !== 0).map(entry => entry.date))].sort().slice(0,3);
  }
  return {nextRepGoal,monthlyOptions,progress,achieved,records,newRecords,regularity};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Motivation;
