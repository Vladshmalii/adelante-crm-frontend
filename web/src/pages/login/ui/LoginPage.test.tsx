import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('показывает ошибки валидации при пустой форме', async () => {
    await renderWithProviders(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /увійти/i }));

    expect(await screen.findByText('Вкажіть email')).toBeInTheDocument();
    expect(screen.getByText('Вкажіть пароль')).toBeInTheDocument();
  });
});
