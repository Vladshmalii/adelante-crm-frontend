import { ProConfigProvider } from '@ant-design/pro-components';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { App as AntApp, ConfigProvider } from 'antd';
import ukUA from 'antd/locale/uk_UA';
import dayjs from 'dayjs';
import 'dayjs/locale/uk';

import { usePreferencesStore } from '@/shared/preferences';
import { getTheme } from '@/shared/theme';

import { queryClient } from './query-client';
import { router } from './router';

dayjs.locale('uk');

export function App() {
  const themeMode = usePreferencesStore((s) => s.themeMode);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={ukUA} theme={getTheme(themeMode)}>
        <ProConfigProvider dark={themeMode === 'dark'}>
          {/* AntApp даёт message/notification/modal с учётом темы через App.useApp() */}
          <AntApp>
            <RouterProvider router={router} />
          </AntApp>
        </ProConfigProvider>
      </ConfigProvider>
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
