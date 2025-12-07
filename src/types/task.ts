export type Stage = 'inbox' | 'plan' | 'code' | 'audit' | 'completed';

export interface Task {
  id: string;
  filePath: string;
  title: string;
  stage: Stage;
  project?: string;
  phase?: string;
  agent?: string;
  parent?: string;
  tags?: string[];
  contexts?: string[];
  order?: number;
  created?: string;
  content: string;
}
