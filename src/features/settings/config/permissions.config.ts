export type PermissionType = 'checkbox' | 'switch' | 'select' | 'multiselect';

export interface PermissionOption {
  value: string;
  label: string;
}

export interface PermissionItemConfig {
  id: string;
  title: string;
  description?: string;
  type?: PermissionType;
  options?: PermissionOption[];
  children?: PermissionItemConfig[];
  dependencies?: string[];
}

export interface PermissionModuleConfig {
  id: string;
  title: string;
  permissions: PermissionItemConfig[];
}

export const PERMISSIONS_CONFIG: PermissionModuleConfig[] = [
  {
    id: 'appointments',
    title: 'Вікно запису',
    permissions: [
      { id: 'appointments.view_clients_data', title: 'Доступ до даних клієнтів (включно з номером телефону)' },
      { id: 'appointments.create_clients', title: 'Доступ до створення нових клієнтів у записі' },
      { id: 'appointments.view_clients_dropdown', title: 'Доступ до випадаючого списку з даними про клієнтів' },
      { id: 'appointments.view_extra_fields', title: 'Перегляд додаткових полів запису' },
      { id: 'appointments.create', title: 'Створювати записи' },
      {
        id: 'appointments.edit',
        title: 'Змінювати записи',
        children: [
          { id: 'appointments.edit.status_arrived', title: 'Змінити запис зі статусом "Клієнт прийшов"' },
          { id: 'appointments.edit.paid_confirmed', title: 'Доступ до редагування оплачених записів зі статусом "Підтверджено"' },
          { id: 'appointments.edit.price', title: 'Змінювати вартість послуг' },
          { id: 'appointments.edit.discount', title: 'Змінювати знижку на послуги' },
          { id: 'appointments.edit.extra_fields', title: 'Змінювати додаткові поля запису' },
          { id: 'appointments.edit.staff_time', title: 'Змінити працівника та час зустрічі' },
          { id: 'appointments.edit.duration', title: 'Змінювати тривалість' },
          { id: 'appointments.edit.comment', title: 'Змінювати коментар' },
          { id: 'appointments.edit.services', title: 'Змінювати послуги' },
        ]
      },
      { id: 'appointments.delete', title: 'Видаляти записи' },
      { id: 'appointments.sell_products', title: 'Проводити продаж товарів' },
      { id: 'appointments.process_payment', title: 'Проводити оплату' },
      { id: 'appointments.edit_consumables', title: 'Редагування розхідників' },
      { id: 'appointments.view_network_clients', title: 'Доступ до даних мережевих клієнтів' },
    ]
  },
  {
    id: 'clients',
    title: 'Клієнтська база',
    permissions: [
      { id: 'clients.list.show_contacts', title: 'Показувати номери телефонів та email в списку клієнтів' },
      { id: 'clients.card.show_phone', title: 'Показувати номер телефону в картці клієнта' },
      { id: 'clients.card.show_name', title: 'Переглянути прізвище та по батькові клієнта' },
      { id: 'clients.card.edit', title: 'Відредагувати дані клієнта в картці клієнта' },
      { id: 'clients.loyalty.view', title: 'Переглядати список лояльності клієнта' },
      { id: 'clients.card.view_note', title: 'Переглянути примітку картки клієнта' },
      { id: 'clients.delete', title: 'Видаляти клієнтів' },
      { id: 'clients.export', title: 'Вивантажувати список клієнтів' },
      { id: 'clients.comments.view', title: 'Переглядати коментарі' },
      { id: 'clients.comments.add', title: 'Додавати коментарі' },
      { id: 'clients.comments.edit_own', title: 'Змінювати / видаляти свої коментарі' },
      { id: 'clients.comments.edit_others', title: 'Змінювати / видаляти чужі коментарі' },
      { id: 'clients.files.view_download', title: 'Переглядати і скачувати файли' },
      { id: 'clients.extra_fields.view', title: 'Перегляд додаткових полів клієнта' },
      { 
        id: 'clients.show', 
        title: 'Показувати клієнтів',
        type: 'select',
        options: [
          { value: 'all', label: 'Всіх співробітників' },
          { value: 'own', label: 'Лише своїх' }
        ]
      },
      { id: 'clients.history.view', title: 'Перегляд історії відвідувань клієнта' },
      { id: 'clients.accounts', title: 'Рахунки' },
      { id: 'clients.loyalty.settings', title: 'Налаштування програм лояльності' },
    ]
  },
  {
    id: 'loyalty',
    title: 'Лояльність',
    permissions: [
      { id: 'loyalty.cards.manage', title: 'Видача і видалення карт лояльності клієнта' },
      { id: 'loyalty.cards.manual_balance', title: 'Ручне поповнення / списання з карт лояльності' },
      { id: 'loyalty.subscriptions.edit_balance', title: 'Редагування балансу абонементів' },
      { id: 'loyalty.subscriptions.edit_expiry', title: 'Редагування терміну дії абонементів' },
      { id: 'loyalty.subscriptions.history', title: 'Перегляд історії абонементів' },
      { id: 'loyalty.certificates.edit_balance', title: 'Редагування балансу сертифікатів' },
      { id: 'loyalty.certificates.edit_expiry', title: 'Редагування терміну дії сертифікатів' },
      { id: 'loyalty.payment_without_code', title: 'Оплата сертифікатом і абонементом без коду' },
    ]
  },
  {
    id: 'finances',
    title: 'Фінанси',
    permissions: [
      { 
        id: 'finances.salary_calc.specific', 
        title: 'Доступ до розрахунку заробітної плати тільки конкретного співробітника',
        type: 'select',
        options: [
          { value: 'specific_employee', label: 'Обрати співробітника' }
        ]
      },
      { id: 'finances.salary_accrual', title: 'Доступ до нарахування заробітної плати' },
      { 
        id: 'finances.cashboxes.all', 
        title: 'Доступ до всіх кас',
        type: 'select',
        options: [
          { value: 'all_cashboxes', label: 'Обрати касу' }
        ]
      },
      { id: 'finances.movements.view', title: 'Перегляд рухів коштів' },
      { id: 'finances.accounts_cashboxes.access', title: 'Доступ до рахунків і кас' },
      { id: 'finances.contractors.access', title: 'Доступ до контрагентів' },
      { id: 'finances.payment_items.access', title: 'Доступ до статті платежів' },
      { id: 'finances.rro.operations', title: 'Операції з РРО' },
      { id: 'finances.rro.settings', title: 'Налаштування РРО' },
      { id: 'finances.cashless_payment', title: 'Безготівкова оплата' },
      { id: 'finances.payment_settings', title: 'Доступ до налаштувань оплати' },
      { id: 'finances.salary_schemes', title: 'Доступ до схем розрахунку заробітної плати' },
      { id: 'finances.salary_calculation', title: 'Доступ до розрахунку заробітної плати' },
      { id: 'finances.reports.period', title: 'Доступ до звіту за період' },
      { id: 'finances.reports.annual', title: 'Доступ до річного звіту' },
      { id: 'finances.receipt.print', title: 'Доступ до друку чека' },
      { id: 'finances.reports.daily_cash', title: 'Доступ до звіту по касі за день' },
    ]
  },
  {
    id: 'inventory',
    title: 'Склад',
    permissions: [
      { 
        id: 'inventory.stores.all', 
        title: 'Доступ до всіх складах',
        type: 'select',
        options: [
          { value: 'all_stores', label: 'Обрати склад' }
        ]
      },
      { id: 'inventory.cost.view', title: 'Переглянути собівартість товарів і витратних матеріалів' },
      { 
        id: 'inventory.movements.view', 
        title: 'Перегляд рухів товарів',
        type: 'select',
        options: [
          { value: 'unlimited', label: 'Не обмежувати' },
          { value: 'other', label: 'Інше значення' }
        ]
      },
      { id: 'inventory.movements.transfer', title: 'Переміщення товарів між складами' },
      { id: 'inventory.transactions.create', title: 'Створення товарних транзакцій' },
      { id: 'inventory.transactions.edit', title: 'Редагування товарних транзакцій' },
      { id: 'inventory.transactions.delete', title: 'Видалення товарних транзакцій' },
      { id: 'inventory.movements.export', title: 'Доступ до вивантаження рухів товарів в Excel' },
      { id: 'inventory.transaction_types.all', title: 'Доступ до всіх типів транзакцій' },
      { id: 'inventory.inventory_check', title: 'Доступ до інвентаризації' },
      { id: 'inventory.reports.stock', title: 'Доступ до звіту залишків на складі' },
      { id: 'inventory.reports.sales', title: 'Доступ до звіту з продажу' },
      { id: 'inventory.reports.write_off_materials', title: 'Доступ до звіту по списанню матеріалів' },
      { id: 'inventory.reports.write_off_products', title: 'Доступ до звіту по списанню товарів' },
      { id: 'inventory.reports.turnover', title: 'Доступ до звіту по оборотності' },
      { id: 'inventory.management', title: 'Доступ до управління товарами' },
    ]
  },
  {
    id: 'settings',
    title: 'Налаштування',
    permissions: [
      { id: 'settings.general.access', title: 'Доступ до розділу Основні' },
      { id: 'settings.info.access', title: 'Доступ до розділу Інформація' },
      { id: 'settings.staff.manage_access', title: 'Керувати співробітниками з доступом' },
      { id: 'settings.services.access', title: 'Доступ до розділу Послуги' },
      { id: 'settings.staff.access', title: 'Доступ до розділу Співробітники' },
      { id: 'settings.positions.access', title: 'Доступ до розділу Посади' },
      { id: 'settings.schedule.edit', title: 'Редагування графіка роботи' },
      { id: 'settings.sms.access', title: 'Доступ до розділу SMS-повідомлення' },
      { id: 'settings.email.access', title: 'Доступ до розділу Email-повідомлення' },
      { id: 'settings.message_types.access', title: 'Доступ до розділу Типи повідомлень' },
      { id: 'settings.webhook.edit', title: 'Зміна налаштувань WebHook' },
      { id: 'settings.payment_docs.edit', title: 'Зміна налаштувань отримання платіжних документів' },
      { id: 'settings.client_categories.edit', title: 'Налаштування списку категорій клієнтів' },
    ]
  },
  {
    id: 'overview',
    title: 'Розділ "Огляд"',
    permissions: [
      { id: 'overview.summary', title: 'Розділ "Зведення"' },
      { id: 'overview.appointments.view', title: 'Переглядати список записів' },
      { id: 'overview.messages.view_details', title: 'Переглядати деталізацію повідомлень' },
      { id: 'overview.reviews.view', title: 'Переглядати відгуки' },
      { id: 'overview.calls', title: 'Розділ "Дзвінки"' },
    ]
  }
];
