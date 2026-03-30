export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TaskResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface TaskDefinition {
  id: string;
  name: string;
  payload: unknown;
  status: TaskStatus;
  result?: TaskResult;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
}

export interface TaskHandler {
  (payload: unknown): Promise<TaskResult>;
}

const handlers = new Map<string, TaskHandler>();
const tasks = new Map<string, TaskDefinition>();

export function registerTask(name: string, handler: TaskHandler, maxRetries = 3): void {
  handlers.set(name, handler);
}

export async function enqueueTask(name: string, payload: unknown): Promise<string> {
  const handler = handlers.get(name);
  if (!handler) {
    throw new Error(`Task handler not registered: ${name}`);
  }

  const taskId = crypto.randomUUID();
  const task: TaskDefinition = {
    id: taskId,
    name,
    payload,
    status: 'pending',
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: handlers.size > 0 ? 3 : 3,
  };

  tasks.set(taskId, task);

  setImmediate(() => runTask(taskId));

  return taskId;
}

export async function runTask(taskId: string): Promise<TaskResult> {
  const task = tasks.get(taskId);
  if (!task) {
    return { success: false, error: `Task not found: ${taskId}` };
  }

  const handler = handlers.get(task.name);
  if (!handler) {
    task.status = 'failed';
    task.result = { success: false, error: `Handler not found: ${task.name}` };
    return task.result;
  }

  task.status = 'running';
  task.startedAt = new Date().toISOString();

  try {
    const result = await handler(task.payload);
    task.result = result;
    task.status = result.success ? 'completed' : 'failed';
    task.completedAt = new Date().toISOString();
    return result;
  } catch (error) {
    task.retryCount++;

    if (task.retryCount < task.maxRetries) {
      task.status = 'pending';
      setTimeout(() => runTask(taskId), Math.pow(2, task.retryCount) * 1000);
      return { success: false, error: `Retrying... (${task.retryCount}/${task.maxRetries})` };
    }

    task.status = 'failed';
    task.result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    task.completedAt = new Date().toISOString();
    return task.result;
  }
}

export function getTaskStatus(taskId: string): TaskDefinition | null {
  return tasks.get(taskId) || null;
}

export function isTaskComplete(taskId: string): boolean {
  const task = tasks.get(taskId);
  return task?.status === 'completed' || task?.status === 'failed';
}

export async function waitForTask(taskId: string, timeoutMs = 30000): Promise<TaskResult> {
  const startTime = Date.now();

  while (!isTaskComplete(taskId)) {
    if (Date.now() - startTime > timeoutMs) {
      return { success: false, error: 'Task timeout' };
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const task = tasks.get(taskId);
  return task?.result || { success: false, error: 'Task not found' };
}
