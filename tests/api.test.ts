import { describe, expect, it } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import os from 'node:os';
import { createApp } from '../server/app.js';
import { JsonStore } from '../server/store.js';

const setup=async()=>{const store=new JsonStore(path.join(os.tmpdir(),`donezo-${crypto.randomUUID()}.json`));await store.load();return{store,app:createApp(store)}};
describe('Donezo API',()=>{
  it('creates, retrieves, edits, completes, reopens, and deletes tasks',async()=>{const{app}=await setup();const created=await request(app).post('/api/tasks').send({title:'API task',description:'tested',priority:'HIGH',status:'TODO',deadline:null,estimatedMinutes:30,category:'QA',tags:['api']}).expect(201);await request(app).get(`/api/tasks/${created.body.id}`).expect(200);await request(app).patch(`/api/tasks/${created.body.id}`).send({title:'Edited task'}).expect(200);await request(app).post(`/api/tasks/${created.body.id}/complete`).expect(200);await request(app).post(`/api/tasks/${created.body.id}/reopen`).expect(200);await request(app).delete(`/api/tasks/${created.body.id}`).expect(204)});
  it('validates tasks and rejects a dependency cycle',async()=>{const{app}=await setup();await request(app).post('/api/tasks').send({title:''}).expect(400);const a=(await request(app).post('/api/tasks').send({title:'A'})).body;const b=(await request(app).post('/api/tasks').send({title:'B'})).body;await request(app).post('/api/dependencies').send({prerequisiteTaskId:a.id,dependentTaskId:b.id}).expect(201);const rejected=await request(app).post('/api/dependencies').send({prerequisiteTaskId:b.id,dependentTaskId:a.id}).expect(409);expect(rejected.body.error).toMatch(/cycle/)});
  it('generates and invalidates a schedule, persists activity, and undoes',async()=>{const{app}=await setup();const schedule=await request(app).post('/api/schedule/generate').expect(200);expect(schedule.body.steps.length).toBeGreaterThan(0);const created=await request(app).post('/api/tasks').send({title:'Invalidate me'}).expect(201);const current=await request(app).get('/api/schedule/current').expect(200);expect(current.body.stale).toBe(true);await request(app).post('/api/undo').expect(200);const tasks=await request(app).get('/api/tasks').expect(200);expect(tasks.body.some((t:{id:string})=>t.id===created.body.id)).toBe(false);const activity=await request(app).get('/api/activity').expect(200);expect(activity.body.some((e:{type:string})=>e.type==='UNDO_PERFORMED')).toBe(true)});
});
