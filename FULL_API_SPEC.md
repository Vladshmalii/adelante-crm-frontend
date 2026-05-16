# 📡 Full API Specification - Adelante CRM

Цей документ містить повний перелік усіх API-запитів, які використовує фронтенд.

---

## 🔐 1. AUTH (Аутентифікація)
| Метод | Ендпоінт | Опис | Тіло запиту / Параметри |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Вхід у систему | `{ email, password }` |
| `POST` | `/auth/register` | Реєстрація салону | `{ email, password, first_name, last_name, phone, salon_name }` |
| `POST` | `/auth/logout` | Вихід | - |
| `POST` | `/auth/refresh` | Оновлення токена | `{ refresh_token }` |
| `POST` | `/auth/forgot-password` | Відновлення пароля | `{ email }` |
| `POST` | `/auth/reset-password` | Скидання пароля | `{ token, password }` |
| `GET` | `/auth/me` | Поточний юзер | - |
| `POST` | `/auth/setup` | Перший запуск | `{ email, password }` |

---

## 📅 2. APPOINTMENTS (Календар)
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/appointments` | Список записів | `date, staffId, status, page, limit` |
| `GET` | `/appointments/:id` | Деталі запису | - |
| `POST` | `/appointments` | Створити запис | `{ clientId, staffId, serviceId, date, startTime, ... }` |
| `PUT` | `/appointments/:id` | Редагувати запис | `{ ... }` |
| `PATCH` | `/appointments/:id/status` | Змінити статус | `{ status }` |
| `DELETE` | `/appointments/:id` | Видалити запис | - |

---

## 👥 3. CLIENTS (Клієнти)
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/clients` | Список клієнтів | `search, segment, page, perPage` |
| `GET` | `/clients/:id` | Профіль клієнта | - |
| `POST` | `/clients` | Додати клієнта | `{ firstName, lastName, phone, email, ... }` |
| `PUT` | `/clients/:id` | Редагувати | `{ ... }` |
| `DELETE` | `/clients/:id` | Видалити | - |
| `GET` | `/clients/:id/history` | Історія візитів | `page, perPage` |
| `POST` | `/clients/import` | Імпорт Excel | `Multipart/Form-Data (file)` |
| `GET` | `/clients/export` | Експорт Excel | - |

---

## 👨‍🎨 4. STAFF (Персонал)
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/staff` | Список майстрів | `search, position, isActive, page` |
| `GET` | `/staff/:id` | Картка майстра | - |
| `POST` | `/staff` | Додати майстра | `{ firstName, lastName, phone, position, ... }` |
| `PUT` | `/staff/:id` | Редагувати | `{ ... }` |
| `DELETE` | `/staff/:id` | Деактивувати | - |
| `GET` | `/staff/:id/schedule` | Графік роботи | `dateFrom, dateTo` |
| `POST` | `/staff/:id/schedule` | Оновити графік | `{ work_days, exceptions }` |

---

## 💰 5. FINANCES (Фінанси)
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/finances/operations` | Лог операцій | `type, category, dateFrom, dateTo` |
| `POST` | `/finances/operations` | Додати операцію | `{ type, amount, category, description, ... }` |
| `GET` | `/finances/documents` | Документи | `type, status, page` |
| `POST` | `/finances/documents` | Створити док | `{ type, number, date, amount, ... }` |
| `GET` | `/finances/dashboard` | Аналітика | `dateFrom, dateTo` |
| `GET` | `/finances/payment-methods` | Методи оплати | - |
| `GET` | `/finances/cash-registers` | Каси/Баланс | - |
| `GET` | `/finances/export` | Звіт (Excel/PDF) | `dateFrom, dateTo, format` |

---

## 📦 6. INVENTORY (Склад)
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/inventory/products` | Список товарів | `search, category, stockStatus, page` |
| `GET` | `/inventory/products/:id` | Картка товару | - |
| `POST` | `/inventory/products` | Додати товар | `{ name, sku, price, costPrice, ... }` |
| `PUT` | `/inventory/products/:id` | Редагувати | `{ ... }` |
| `DELETE` | `/inventory/products/:id` | Видалити | - |
| `POST` | `/inventory/stock-movement` | Рух товару | `{ productId, type, quantity, reason, ... }` |
| `GET` | `/inventory/products/:id/history` | Лог руху | - |
| `GET` | `/inventory/export` | Експорт залишків | - |

---

## 📊 7. OVERVIEW & ANALYTICS
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/overview/records` | Лог записів | `limit, offset, dateFrom, dateTo` |
| `GET` | `/overview/reviews` | Відгуки | `limit, offset` |
| `GET` | `/overview/changes` | Лог змін системи | `limit, offset` |

---

## 🛠 8. SERVICES (Послуги)
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/services` | Прайс-лист | `category, search` |
| `POST` | `/services` | Додати послугу | `{ name, price, duration, category, ... }` |
| `PUT` | `/services/:id` | Редагувати | `{ ... }` |
| `DELETE` | `/services/:id` | Видалити | - |

---

## ⚙️ 9. SETTINGS (Налаштування)
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/settings/salon` | Дані закладу | - |
| `PUT` | `/settings/salon` | Оновити заклад | `{ name, address, phone, schedule, ... }` |
| `GET` | `/settings/profile` | Мій профіль | - |
| `PUT` | `/settings/profile` | Оновити профіль | `{ first_name, last_name, phone, ... }` |
| `GET` | `/settings/roles` | Список ролей | - |
| `PUT` | `/settings/roles/:role` | Права доступу | `{ permissions }` |

---

## 🔔 10. NOTIFICATIONS
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Мої сповіщення | `page, limit` |
| `PATCH` | `/notifications/:id/read` | Прочитано | - |
| `PATCH` | `/notifications/read-all` | Прочитати всі | - |
| `DELETE` | `/notifications/:id` | Видалити | - |

---

## 📈 11. REPORTS
| Метод | Ендпоінт | Опис | Параметри |
| :--- | :--- | :--- | :--- |
| `GET` | `/reports/revenue` | Звіт по виручці | `dateFrom, dateTo, grouping` |
| `GET` | `/reports/staff-performance`| Ефективність майстрів | `dateFrom, dateTo` |
| `GET` | `/reports/services-popularity`| Популярність послуг | `dateFrom, dateTo` |
| `GET` | `/reports/export` | Скачати звіт | `type, format, dateFrom, dateTo` |

---
*Документацію сформовано на основі коду фронтенду. Всі відповіді очікуються у форматі `{ success: boolean, data: any, error: any }`.*
