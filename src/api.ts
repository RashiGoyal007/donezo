import type { ActivityEvent, Dependency, ScheduleResult, Task } from '../shared/types';

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? `Request failed (${response.status})`); }
  return response.status === 204 ? undefined as T : response.json();
};
export const api = {
  tasks: () => request<Task[]>('/tasks'),
  createTask: (task: Partial<Task>) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id: string, task: Partial<Task>) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(task) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  action: (id: string, action: 'complete' | 'reopen') => request<Task>(`/tasks/${id}/${action}`, { method: 'POST' }),
  dependencies: () => request<Dependency[]>('/dependencies'),
  addDependency: (prerequisiteTaskId: string, dependentTaskId: string) => request<Dependency>('/dependencies', { method: 'POST', body: JSON.stringify({ prerequisiteTaskId, dependentTaskId }) }),
  removeDependency: (id: string) => request<void>(`/dependencies/${id}`, { method: 'DELETE' }),
  schedule: () => request<ScheduleResult>('/schedule/generate', { method: 'POST' }),
  currentSchedule: () => request<ScheduleResult | null>('/schedule/current'),
  activity: () => request<ActivityEvent[]>('/activity'),
  undo: () => request<{ label: string }>('/undo', { method: 'POST' }),
};
