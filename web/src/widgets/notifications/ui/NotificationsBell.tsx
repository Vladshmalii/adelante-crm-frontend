import { BellOutlined, CalendarOutlined, StarOutlined } from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';
import { useNavigate } from '@tanstack/react-router';
import { Badge, Button, Empty, Popover, Space, Typography } from 'antd';
import { useState } from 'react';

import { formatDateTime } from '@/shared/lib';

import { type NotificationItem, useNotificationsStore } from '../model/store';
import { useRealtimeNotifications } from '../model/use-realtime';

export function NotificationsBell() {
  useRealtimeNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { items, markRead, markAllRead, clear } = useNotificationsStore();
  const unread = items.filter((i) => !i.read).length;

  const openItem = (item: NotificationItem) => {
    markRead(item.id);
    if (!item.link) return;
    setOpen(false);
    void navigate({
      to: '/overview',
      search: { tab: item.link.tab, recordId: item.link.recordId },
    });
  };

  const content = (
    <div style={{ width: 380 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
        <Typography.Text strong>Сповіщення</Typography.Text>
        <Space size={0}>
          <Button type="link" size="small" disabled={!unread} onClick={markAllRead}>
            Прочитати всі
          </Button>
          <Button type="link" size="small" disabled={!items.length} onClick={clear}>
            Очистити
          </Button>
        </Space>
      </Space>
      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нових сповіщень немає" />
      ) : (
        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          <ProList<NotificationItem>
            rowKey="id"
            dataSource={items}
            split
            onRow={(item) => ({
              onClick: () => {
                openItem(item);
              },
              style: { cursor: 'pointer', opacity: item.read ? 0.6 : 1 },
            })}
            columns={[
              {
                key: 'avatar',
                listSlot: 'avatar',
                render: (_, i) => (i.kind === 'review' ? <StarOutlined /> : <CalendarOutlined />),
              },
              {
                key: 'title',
                listSlot: 'title',
                render: (_, i) => <Badge dot={!i.read}>{i.title}</Badge>,
              },
              {
                key: 'description',
                listSlot: 'description',
                render: (_, i) => (
                  <>
                    <div>{i.text}</div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDateTime(i.at)}
                    </Typography.Text>
                  </>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <Badge count={unread} size="small" offset={[-4, 4]}>
        <Button type="text" aria-label="Сповіщення" icon={<BellOutlined />} />
      </Badge>
    </Popover>
  );
}
