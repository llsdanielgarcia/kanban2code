export type Stage = 'inbox' | 'plan' | 'code' | 'audit' | 'completed';

export interface Task {
  id: string;
  filePath: string;
  title: string;
  stage: Stage;
  project?: string;
  phase?: string;
  agent?: string;
  provider?: string;
  parent?: string; // ID of parent task
  tags?: string[];
  contexts?: string[];
  skills?: string[];
  order?: number;
  created?: string; // ISO Date
  attempts?: number;
  content: string; // The markdown content body
}
