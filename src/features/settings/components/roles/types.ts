export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  createdAt: string;
  permissions: Record<string, any>;
}

export type ViewState = 'list' | 'create' | 'edit';
