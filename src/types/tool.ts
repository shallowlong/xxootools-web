export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  tools: Tool[];
}