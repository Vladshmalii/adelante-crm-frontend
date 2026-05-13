import { PermissionItemConfig } from '../../config/permissions.config';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Select } from '@/shared/components/ui/Select';
import { cn } from '@/lib/utils/cn';

interface PermissionItemProps {
  item: PermissionItemConfig;
  permissions: Record<string, any>;
  onChange: (id: string, value: any) => void;
  disabled?: boolean;
  level?: number;
}

export function PermissionItem({ item, permissions, onChange, disabled, level = 0 }: PermissionItemProps) {
  const value = permissions[item.id];

  const handleCheckboxChange = (checked: boolean) => {
    onChange(item.id, checked);
    if (!checked && item.children) {
      // Uncheck all children if parent is unchecked
      item.children.forEach(child => {
        onChange(child.id, false);
      });
    }
  };

  const isChecked = typeof value === 'boolean' ? value : false;

  return (
    <div className={cn("flex flex-col py-1.5", level > 0 && "ml-6")}>
      <div className="flex items-center gap-3">
        {(!item.type || item.type === 'checkbox') && (
          <Checkbox
            checked={isChecked}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            disabled={disabled}
            label={item.title}
          />
        )}
        
        {item.type === 'select' && (
          <div className="flex flex-col gap-1 w-full max-w-sm">
            <span className={cn("text-sm", disabled ? "text-muted-foreground/50" : "text-foreground")}>
              {item.title}
            </span>
            <Select
              value={value || ''}
              onChange={(val) => onChange(item.id, val)}
              disabled={disabled}
              options={item.options || []}
              placeholder="Обрати значення"
            />
          </div>
        )}
      </div>

      {item.children && isChecked && (
        <div className="mt-2 border-l-2 border-border/50 pl-2">
          {item.children.map(child => (
            <PermissionItem
              key={child.id}
              item={child}
              permissions={permissions}
              onChange={onChange}
              disabled={disabled}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
