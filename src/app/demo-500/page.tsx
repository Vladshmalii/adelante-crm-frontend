'use client';
import Error from '@/app/error';

export default function Demo500Page() {
    // Симулируем объект ошибки.
    // В реальном приложении Error компонент получает Error объект.
    // Мы создаем искусственный для демо.
    const fakeError = new globalThis.Error('Demo: Critical Server Error (Simulation)');
    (fakeError as any).digest = 'DEMO_ERR_500';

    return (
        <Error
            error={fakeError}
            reset={() => {
                console.log('Reset triggered in demo');
                window.location.reload();
            }}
        />
    );
}
