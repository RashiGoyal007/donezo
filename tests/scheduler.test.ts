import { describe, expect, it } from 'vitest';
import { generateSchedule } from '../shared/scheduler.js';
import type { Dependency, Priority, Status, Task } from '../shared/types.js';

const task=(id:string,priority:Priority='MEDIUM',status:Status='TODO',deadline:string|null=null):Task=>({id,title:id,description:'',priority,status,deadline,estimatedMinutes:null,category:'',tags:[],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z',completedAt:status==='COMPLETED'?'2026-01-02T00:00:00.000Z':null});
const dep=(from:string,to:string):Dependency=>({id:`${from}-${to}`,prerequisiteTaskId:from,dependentTaskId:to,createdAt:'2026-01-01T00:00:00.000Z'});
describe('generateSchedule',()=>{
  it('handles empty and completed collections',()=>{expect(generateSchedule([],[]).taskIds).toEqual([]);expect(generateSchedule([task('a','HIGH','COMPLETED')],[]).taskIds).toEqual([])});
  it('respects a dependency chain regardless of priority',()=>{const result=generateSchedule([task('a','LOW'),task('b','URGENT'),task('c','HIGH')],[dep('a','b'),dep('b','c')]);expect(result.taskIds).toEqual(['a','b','c'])});
  it('selects highest priority among eligible tasks',()=>{const result=generateSchedule([task('low','LOW'),task('urgent','URGENT'),task('high','HIGH')],[]);expect(result.taskIds[0]).toBe('urgent')});
  it('uses nearer deadlines to break equal priority',()=>{const result=generateSchedule([task('later','HIGH','TODO','2026-12-20T00:00:00.000Z'),task('sooner','HIGH','TODO','2026-10-21T00:00:00.000Z')],[],new Date('2026-10-20T00:00:00.000Z'));expect(result.taskIds[0]).toBe('sooner')});
  it('treats completed prerequisites as satisfied',()=>{const result=generateSchedule([task('done','LOW','COMPLETED'),task('next','HIGH')],[dep('done','next')]);expect(result.taskIds).toEqual(['next'])});
  it('rejects cycles',()=>{expect(()=>generateSchedule([task('a'),task('b')],[dep('a','b'),dep('b','a')])).toThrow(/cycle/)});
  it('ensures every unfinished prerequisite appears first',()=>{const tasks=[task('a'),task('b','URGENT'),task('c'),task('d','HIGH')];const deps=[dep('a','c'),dep('b','c'),dep('c','d')];const order=generateSchedule(tasks,deps).taskIds;for(const edge of deps)expect(order.indexOf(edge.prerequisiteTaskId)).toBeLessThan(order.indexOf(edge.dependentTaskId))});
});
