import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { DirectedGraph } from '../shared/structures.js';
import { generateSchedule } from '../shared/scheduler.js';
import type { Status, Task } from '../shared/types.js';
import { JsonStore } from './store.js';

const taskInput = z.object({
  title: z.string().trim().min(1).max(120), description: z.string().max(2000).default(''),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'), status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).default('TODO'),
  deadline: z.string().datetime().nullable().default(null), estimatedMinutes: z.number().int().positive().max(10080).nullable().default(null),
  category: z.string().trim().max(60).default(''), tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
});

export function createApp(store: JsonStore) {
  const app = express(); app.use(cors()); app.use(express.json({ limit: '200kb' }));
  const graph = () => { const value = new DirectedGraph(); store.data.tasks.forEach((task) => value.addVertex(task.id)); store.data.dependencies.forEach((edge) => value.addEdge(edge.prerequisiteTaskId, edge.dependentTaskId)); return value; };
  const getTask = (id: string) => store.data.tasks.find((task) => task.id === id);
  const prerequisitesComplete = (id: string) => store.data.dependencies.filter((edge) => edge.dependentTaskId === id).every((edge) => getTask(edge.prerequisiteTaskId)?.status === 'COMPLETED');

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/tasks', (_req, res) => res.json(store.data.tasks));
  app.get('/api/tasks/:id', (req, res) => { const task = getTask(req.params.id); if (!task) return res.status(404).json({ error: 'Task not found' }); res.json({ ...task, prerequisites: store.data.dependencies.filter((edge) => edge.dependentTaskId === task.id), dependents: store.data.dependencies.filter((edge) => edge.prerequisiteTaskId === task.id), ready: prerequisitesComplete(task.id) }); });
  app.post('/api/tasks', async (req, res, next) => { try { const input = taskInput.parse(req.body); const now = new Date().toISOString(); const task: Task = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now, completedAt: input.status === 'COMPLETED' ? now : null }; store.snapshot('task creation'); store.data.tasks.push(task); store.invalidateSchedule(); store.addActivity({ type: 'TASK_CREATED', taskId: task.id, summary: `Created “${task.title}”` }); await store.save(); res.status(201).json(task); } catch (error) { next(error); } });
  app.patch('/api/tasks/:id', async (req, res, next) => { try { const task = getTask(req.params.id); if (!task) return res.status(404).json({ error: 'Task not found' }); const input = taskInput.partial().parse(req.body); if (input.status === 'COMPLETED' && !prerequisitesComplete(task.id)) return res.status(409).json({ error: 'Complete all prerequisites first' }); store.snapshot('task edit'); Object.assign(task, input, { updatedAt: new Date().toISOString() }); if (input.status) task.completedAt = input.status === 'COMPLETED' ? new Date().toISOString() : null; store.invalidateSchedule(); store.addActivity({ type: input.status ? 'STATUS_CHANGED' : 'TASK_EDITED', taskId: task.id, summary: `${input.status ? 'Changed status of' : 'Updated'} “${task.title}”` }); await store.save(); res.json(task); } catch (error) { next(error); } });
  app.delete('/api/tasks/:id', async (req, res) => { const task = getTask(req.params.id); if (!task) return res.status(404).json({ error: 'Task not found' }); store.snapshot('task deletion'); store.data.tasks = store.data.tasks.filter((item) => item.id !== task.id); store.data.dependencies = store.data.dependencies.filter((edge) => edge.prerequisiteTaskId !== task.id && edge.dependentTaskId !== task.id); store.invalidateSchedule(); store.addActivity({ type: 'TASK_DELETED', taskId: task.id, summary: `Deleted “${task.title}” and its dependency links` }); await store.save(); res.status(204).end(); });
  app.post('/api/tasks/:id/:action', async (req, res, next) => { if (req.params.action !== 'complete' && req.params.action !== 'reopen') return next(); const task = getTask(req.params.id); if (!task) return res.status(404).json({ error: 'Task not found' }); const status: Status = req.params.action === 'complete' ? 'COMPLETED' : 'TODO'; if (status === 'COMPLETED' && !prerequisitesComplete(task.id)) return res.status(409).json({ error: 'This task is blocked by incomplete prerequisites' }); store.snapshot(`task ${req.params.action}`); task.status = status; task.completedAt = status === 'COMPLETED' ? new Date().toISOString() : null; task.updatedAt = new Date().toISOString(); store.invalidateSchedule(); store.addActivity({ type: 'STATUS_CHANGED', taskId: task.id, summary: `${status === 'COMPLETED' ? 'Completed' : 'Reopened'} “${task.title}”` }); await store.save(); res.json(task); });

  app.get('/api/dependencies', (_req, res) => res.json(store.data.dependencies));
  app.post('/api/dependencies', async (req, res, next) => { try { const input = z.object({ prerequisiteTaskId: z.string(), dependentTaskId: z.string() }).parse(req.body); const test = graph(); test.addEdge(input.prerequisiteTaskId, input.dependentTaskId); store.snapshot('dependency addition'); const edge = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() }; store.data.dependencies.push(edge); store.invalidateSchedule(); store.addActivity({ type: 'DEPENDENCY_ADDED', taskId: input.dependentTaskId, summary: `Added dependency: ${getTask(input.prerequisiteTaskId)?.title} → ${getTask(input.dependentTaskId)?.title}` }); await store.save(); res.status(201).json(edge); } catch (error) { next(error); } });
  app.delete('/api/dependencies/:id', async (req, res) => { const edge = store.data.dependencies.find((item) => item.id === req.params.id); if (!edge) return res.status(404).json({ error: 'Dependency not found' }); store.snapshot('dependency removal'); store.data.dependencies = store.data.dependencies.filter((item) => item.id !== edge.id); store.invalidateSchedule(); store.addActivity({ type: 'DEPENDENCY_REMOVED', taskId: edge.dependentTaskId, summary: 'Removed a task dependency' }); await store.save(); res.status(204).end(); });
  app.post('/api/schedule/generate', async (_req, res, next) => { try { const result = generateSchedule(store.data.tasks, store.data.dependencies); store.data.currentSchedule = result; store.addActivity({ type: 'SCHEDULE_GENERATED', taskId: null, summary: `Generated a ${result.taskIds.length}-task execution plan` }); await store.save(); res.json(result); } catch (error) { next(error); } });
  app.get('/api/schedule/current', (_req, res) => res.json(store.data.currentSchedule));
  app.get('/api/activity', (_req, res) => res.json(store.data.activity));
  app.post('/api/undo', async (_req, res) => { const label = await store.undo(); if (!label) return res.status(409).json({ error: 'Nothing to undo in this session' }); res.json({ label, data: store.data }); });

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  const errors: ErrorRequestHandler = (error, _req, res, _next) => { if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', issues: error.issues }); const message = error instanceof Error ? error.message : 'Unexpected error'; const status = /cycle|already exists|cannot depend/.test(message) ? 409 : /must exist|does not exist/.test(message) ? 404 : 500; res.status(status).json({ error: message }); }; app.use(errors);
  return app;
}
