import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChangeDetails } from './ChangeDetails';

describe('ChangeDetails', () => {
  it('переводит поля и значения-enum из журнала', () => {
    render(<ChangeDetails details={{ status: ['arrived', 'completed'], paid: [null, 650] }} />);
    expect(screen.getByText('Статус:', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Клієнт прийшов')).toBeInTheDocument();
    expect(screen.getByText('Завершено', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Оплачено, ₴:', { exact: false })).toBeInTheDocument();
  });

  it('ничего не рисует без изменений', () => {
    const { container } = render(<ChangeDetails details={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
