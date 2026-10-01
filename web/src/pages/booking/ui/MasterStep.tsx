import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Col, Empty, Row, Spin, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { lightPalette, withAlpha } from '@/shared/theme';
import { QueryErrorAlert } from '@/shared/ui';

import { mastersQueryOptions } from '../api/booking.api';
import { ANY_MASTER } from '../model/search';
import { ChoiceCard, StepTitle } from './BookingShell';

type Service = Schema<'app__api__booking__router__ServiceOut'>;

interface MasterStepProps {
  slug: string;
  service: Service;
  selectedId?: string;
  onSelect: (masterId: string) => void;
}

/** Шаг 2: «Будь-який майстер» (бекенд назначит свободного) или конкретный мастер. */
export function MasterStep({ slug, service, selectedId, onSelect }: MasterStepProps) {
  const { data = [], isPending, error, refetch } = useQuery(mastersQueryOptions(slug, service.id));

  return (
    <>
      <StepTitle title="Оберіть майстра" subtitle={`Хто виконає послугу «${service.name}»`} />
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      {isPending ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : data.length === 0 ? (
        <Empty description="Немає майстрів для цієї послуги" />
      ) : (
        <Row gutter={[12, 12]}>
          {data.length > 1 && (
            <Col xs={24} sm={12}>
              <ChoiceCard
                selected={selectedId === ANY_MASTER}
                onClick={() => {
                  onSelect(ANY_MASTER);
                }}
              >
                <MasterInfo
                  avatar={<Avatar size={48} icon={<TeamOutlined />} style={avatarStyle} />}
                  name="Будь-який майстер"
                  note="Найближчий вільний час"
                />
              </ChoiceCard>
            </Col>
          )}
          {data.map((m) => (
            <Col key={m.id} xs={24} sm={12}>
              <ChoiceCard
                selected={selectedId === m.id}
                onClick={() => {
                  onSelect(m.id);
                }}
              >
                <MasterInfo
                  avatar={
                    <Avatar
                      size={48}
                      src={m.avatar_url ?? undefined}
                      icon={<UserOutlined />}
                      style={avatarStyle}
                    />
                  }
                  name={m.name}
                  note={m.specializations.join(', ')}
                />
              </ChoiceCard>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}

// bg-gradient-to-br from-primary/20 to-primary/5, иконка text-primary
const avatarStyle = {
  background: `linear-gradient(to bottom right, ${withAlpha(lightPalette.primary, 0.2)}, ${withAlpha(lightPalette.primary, 0.05)})`,
  color: lightPalette.primaryText,
  flex: 'none',
};

function MasterInfo({
  avatar,
  name,
  note,
}: {
  avatar: React.ReactNode;
  name: string;
  note: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {avatar}
      <div style={{ minWidth: 0 }}>
        <Typography.Text strong ellipsis style={{ display: 'block' }}>
          {name}
        </Typography.Text>
        {note && (
          <Typography.Text type="secondary" ellipsis style={{ display: 'block', fontSize: 13 }}>
            {note}
          </Typography.Text>
        )}
      </div>
    </div>
  );
}
