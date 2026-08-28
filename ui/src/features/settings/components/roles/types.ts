// Значення прав доступу: checkbox -> boolean, select -> string (або string[]
// для потенційного мультивибору, див. Select.onChange).
export type PermissionValue = boolean | string | string[];
export type PermissionsMap = Record<string, PermissionValue>;

export interface Role {
    id: string;
    name: string;
    description: string;
    usersCount: number;
    createdAt: string;
    permissions: PermissionsMap;
}

export type ViewState = 'list' | 'create' | 'edit';
