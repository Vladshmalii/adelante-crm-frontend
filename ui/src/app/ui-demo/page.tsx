'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { ButtonGroup } from '@/shared/components/ui/ButtonGroup';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert } from '@/shared/components/ui/Alert';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { Breadcrumbs } from '@/shared/components/ui/Breadcrumbs';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Tooltip } from '@/shared/components/ui/Tooltip';

import {
    Plus,
    Edit,
    Trash,
    Download,
    Upload,
    Settings,
    ChevronLeft,
    ChevronRight,
    Home,
    User,
    Bell,
} from 'lucide-react';

export default function GeneralUIDemo() {
    return (
        <div className="mx-auto max-w-4xl space-y-12 p-8">
            <h1 className="font-heading text-3xl font-bold text-foreground">
                Загальні UI Компоненти
            </h1>

            {/* Buttons */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Кнопки
                </h2>
                <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Основна</Button>
                    <Button variant="secondary">Вторинна</Button>
                    <Button variant="ghost">Прозора</Button>
                    <Button variant="danger">Небезпека</Button>
                    <Button variant="primary" disabled>
                        Вимкнена
                    </Button>
                    <Button variant="primary" isLoading>
                        Завантаження
                    </Button>
                    <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                        З іконкою
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Мала</Button>
                    <Button size="md">Середня</Button>
                    <Button size="lg">Велика</Button>
                </div>
            </section>

            {/* Button Groups */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Групи кнопок
                </h2>
                <div className="flex flex-wrap gap-8">
                    <ButtonGroup variant="primary">
                        <Button leftIcon={<Plus className="h-4 w-4" />}>Додати</Button>
                        <Button leftIcon={<Edit className="h-4 w-4" />}>Змінити</Button>
                        <Button leftIcon={<Trash className="h-4 w-4" />}>Видалити</Button>
                    </ButtonGroup>

                    <ButtonGroup variant="secondary" size="sm">
                        <Button>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button>1</Button>
                        <Button>2</Button>
                        <Button>3</Button>
                        <Button>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </ButtonGroup>
                </div>
            </section>

            {/* Badges */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Бейджі
                </h2>
                <div className="flex flex-wrap gap-3">
                    <Badge variant="default">За замовчуванням</Badge>
                    <Badge variant="primary">Основний</Badge>
                    <Badge variant="success">Успіх</Badge>
                    <Badge variant="warning">Увага</Badge>
                    <Badge variant="danger">Помилка</Badge>
                    <Badge variant="info">Інфо</Badge>
                </div>
            </section>

            {/* Alerts */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Сповіщення
                </h2>
                <div className="grid gap-4">
                    <Alert variant="info" title="Інформація">
                        Це корисна інформація для користувача.
                    </Alert>
                    <Alert variant="success" title="Успішно">
                        Операція виконана успішно!
                    </Alert>
                    <Alert variant="warning" title="Увага">
                        Будь ласка, будьте обережні з цією дією.
                    </Alert>
                    <Alert variant="error" title="Помилка">
                        Щось пішло не так під час обробки вашого запиту.
                    </Alert>
                </div>
            </section>

            {/* Data Display: Avatars, Tooltips */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Аватари та Підказки
                </h2>
                <div className="flex items-center gap-6">
                    <Tooltip content="Активний користувач">
                        <Avatar src="https://i.pravatar.cc/150?u=1" status="online" size="lg" />
                    </Tooltip>
                    <Avatar src="https://i.pravatar.cc/150?u=2" status="busy" size="md" />
                    <Avatar fallback="ІП" status="offline" size="md" />
                    <Avatar fallback="AB" size="sm" />
                </div>
            </section>

            {/* Breadcrumbs */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Хлібні крихти
                </h2>
                <Breadcrumbs
                    items={[
                        {
                            label: 'Панель керування',
                            href: '#',
                            icon: <Home className="h-3 w-3" />,
                        },
                        { label: 'Користувачі', href: '#', icon: <User className="h-3 w-3" /> },
                        { label: 'Профіль', icon: <Settings className="h-3 w-3" /> },
                    ]}
                />
            </section>

            {/* Progress */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Індикатори прогресу
                </h2>
                <div className="max-w-md space-y-6">
                    <Progress value={40} showLabel size="sm" />
                    <Progress value={75} color="success" showLabel />
                    <div className="flex gap-8">
                        <Progress value={60} variant="circular" size="md" showLabel />
                        <Progress
                            value={85}
                            variant="circular"
                            color="accent"
                            size="lg"
                            showLabel
                        />
                    </div>
                </div>
            </section>

            {/* Skeletons */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Скелетони
                </h2>
                <div className="flex items-center gap-4">
                    <Skeleton variant="circle" />
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" />
                    </div>
                </div>
                <Skeleton variant="rectangle" height="100px" />
            </section>

            {/* Empty State */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Порожній стан
                </h2>
                <div className="rounded-lg border border-border bg-card">
                    <EmptyState
                        title="Немає сповіщень"
                        description="Ви переглянули всі сповіщення. Завітайте пізніше."
                        icon={<Bell className="h-8 w-8 text-muted-foreground" />}
                        action={
                            <Button size="sm" variant="secondary">
                                Оновити
                            </Button>
                        }
                    />
                </div>
            </section>

            {/* Cards */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Картки
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="space-y-2 p-4">
                        <h3 className="font-semibold">Базова картка</h3>
                        <p className="text-sm text-muted-foreground">
                            Це простий компонент картки для групування контенту.
                        </p>
                    </Card>
                    <Card className="space-y-2 border-l-4 border-l-primary p-4">
                        <h3 className="font-semibold">Акцентна картка</h3>
                        <p className="text-sm text-muted-foreground">
                            Картки можна стилізувати за допомогою стандартних CSS класів.
                        </p>
                        <div className="pt-2">
                            <Button size="sm" variant="ghost">
                                Дія
                            </Button>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}
