import { CheckOutlined } from '@ant-design/icons';
import { ConfigProvider, type ThemeConfig, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

import { getTheme, lightPalette, logoFor, withAlpha } from '@/shared/theme';

/**
 * Вид сайта записи — как в старом UI и в палитре светлой темы (`shared/theme`): клиенту всегда
 * светлая тема, независимо от темы админки.
 */
const c = lightPalette;

const bookingTheme: ThemeConfig = {
  ...getTheme('light'),
  token: { ...getTheme('light').token, borderRadius: 12, fontSize: 15 },
};

export function BookingShell({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={bookingTheme}>
      <div
        style={{
          minHeight: '100vh',
          // from-primary/5 via-background to-accent/5
          background: `linear-gradient(to bottom right, ${withAlpha(c.primary, 0.05)}, ${c.background}, ${withAlpha(c.accent, 0.05)})`,
          color: c.text,
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 32px' }}>
          {/* Логотип сети — на всех страницах сайта записи; сайт всегда светлый. */}
          <img
            src={logoFor('light')}
            alt="Adelante"
            width={72}
            height={72}
            style={{ display: 'block', margin: '0 auto 12px' }}
          />
          {children}
          <Typography.Paragraph
            type="secondary"
            style={{ textAlign: 'center', fontSize: 13, marginTop: 24 }}
          >
            © {new Date().getFullYear()} Adelante CRM
          </Typography.Paragraph>
        </div>
      </div>
    </ConfigProvider>
  );
}

/** Белая карточка с тенью — основной контейнер шага. */
export function BookingCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        // bg-card rounded-2xl border border-border shadow-xl
        background: c.card,
        borderRadius: 16,
        border: `1px solid ${c.borderSecondary}`,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        padding: 'clamp(16px, 4vw, 32px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface StepsBarProps {
  steps: { key: string; label: string; icon: ReactNode }[];
  current: number;
}

/** Круглые индикаторы шагов с линиями между ними; пройденные — с галочкой. */
export function StepsBar({ steps, current }: StepsBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '8px 0 24px' }}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  transition: 'all .2s',
                  background: done || active ? c.primary : c.muted,
                  color: done || active ? '#ffffff' : c.textSecondary,
                  boxShadow: active ? `0 0 0 4px ${withAlpha(c.primary, 0.2)}` : undefined,
                }}
              >
                {done ? <CheckOutlined /> : step.icon}
              </div>
              <span
                style={{
                  fontSize: 12,
                  textAlign: 'center',
                  color: active ? c.primaryText : c.textSecondary,
                  fontWeight: active ? 500 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  minWidth: 12,
                  margin: '0 4px 22px',
                  background: i < current ? c.primary : c.muted,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ChoiceCardProps {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  extra?: ReactNode;
  disabled?: boolean;
}

/** Карточка выбора (услуга, мастер): рамка и галочка у выбранной. */
export function ChoiceCard({ selected, onClick, children, extra, disabled }: ChoiceCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        textAlign: 'left',
        font: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 12,
        border: `2px solid ${selected ? c.primary : c.borderSecondary}`,
        background: selected ? withAlpha(c.primary, 0.05) : c.card,
        color: c.text,
        transition: 'border-color .15s, background .15s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {extra}
      {selected && (
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: c.primary,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            flex: 'none',
          }}
        >
          <CheckOutlined />
        </span>
      )}
    </button>
  );
}

/** Заголовок шага: крупно, с подписью. */
export function StepTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      {subtitle && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          {subtitle}
        </Typography.Text>
      )}
    </div>
  );
}
