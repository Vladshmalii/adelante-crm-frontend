/* Сгенерировано scripts/generate-api.mjs — не редактировать вручную. */

export interface paths {
    "/api/admin/v1/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Audit */
        get: operations["list_audit_api_admin_v1_audit_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/forgot-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Forgot Password
         * @description Выдаёт одноразовый токен сброса (TTL 1 час) и отправляет письмо со ссылкой.
         *
         *     Ответ всегда 204, чтобы не раскрывать, существует ли email.
         */
        post: operations["forgot_password_api_admin_v1_auth_forgot_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login */
        post: operations["login_api_admin_v1_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Me */
        get: operations["me_api_admin_v1_auth_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Patch Me */
        patch: operations["patch_me_api_admin_v1_auth_me_patch"];
        trace?: never;
    };
    "/api/admin/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refresh
         * @description Новая пара токенов. Роль, салоны и is_superuser перечитываются из БД —
         *     увольнение и снятие прав вступают в силу не позже срока жизни access-токена.
         */
        post: operations["refresh_api_admin_v1_auth_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reset Password */
        post: operations["reset_password_api_admin_v1_auth_reset_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Clients */
        get: operations["list_clients_api_admin_v1_clients_get"];
        put?: never;
        /** Create Client */
        post: operations["create_client_api_admin_v1_clients_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients/{client_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Client */
        get: operations["get_client_api_admin_v1_clients__client_id__get"];
        put?: never;
        post?: never;
        /**
         * Delete Client
         * @description Soft-delete: на клиента ссылаются шард-БД всех салонов.
         */
        delete: operations["delete_client_api_admin_v1_clients__client_id__delete"];
        options?: never;
        head?: never;
        /** Patch Client */
        patch: operations["patch_client_api_admin_v1_clients__client_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/clients/{client_id}/visits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Client Visits
         * @description История визитов клиента в салоне (мастеру — только по своим клиентам).
         */
        get: operations["client_visits_api_admin_v1_clients__client_id__visits_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export Clients
         * @description Excel-выгрузка клиентской базы (+ визиты в текущем салоне).
         */
        get: operations["export_clients_api_admin_v1_clients_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Import Clients
         * @description Импорт из Excel. Колонки листа: Имя | Фамилия | Телефон | Email.
         *
         *     Клиент идентифицируется телефоном: существующий — обновляется, новый —
         *     создаётся. Первая строка считается заголовком и пропускается.
         */
        post: operations["import_clients_api_admin_v1_clients_import_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/cash-registers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Cash Registers */
        get: operations["list_cash_registers_api_admin_v1_finances_cash_registers_get"];
        put?: never;
        /** Create Cash Register */
        post: operations["create_cash_register_api_admin_v1_finances_cash_registers_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/cash-registers/{register_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Patch Cash Register */
        patch: operations["patch_cash_register_api_admin_v1_finances_cash_registers__register_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/finances/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dashboard */
        get: operations["dashboard_api_admin_v1_finances_dashboard_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Documents */
        get: operations["list_documents_api_admin_v1_finances_documents_get"];
        put?: never;
        /** Create Document */
        post: operations["create_document_api_admin_v1_finances_documents_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/documents/{document_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Patch Document */
        patch: operations["patch_document_api_admin_v1_finances_documents__document_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/finances/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export Operations
         * @description Excel-отчёт по операциям за период.
         */
        get: operations["export_operations_api_admin_v1_finances_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/locations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Locations
         * @description Локации активных касс — для фильтра «Локація».
         */
        get: operations["list_locations_api_admin_v1_finances_locations_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/operations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Operations */
        get: operations["list_operations_api_admin_v1_finances_operations_get"];
        put?: never;
        /** Create Operation */
        post: operations["create_operation_api_admin_v1_finances_operations_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/operations/{operation_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Patch Operation */
        patch: operations["patch_operation_api_admin_v1_finances_operations__operation_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/finances/payment-methods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Payment Methods */
        get: operations["list_payment_methods_api_admin_v1_finances_payment_methods_get"];
        put?: never;
        /** Create Payment Method */
        post: operations["create_payment_method_api_admin_v1_finances_payment_methods_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/payment-methods/{method_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Patch Payment Method */
        patch: operations["patch_payment_method_api_admin_v1_finances_payment_methods__method_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/finances/receipts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Receipts */
        get: operations["list_receipts_api_admin_v1_finances_receipts_get"];
        put?: never;
        /**
         * Create Receipt
         * @description Чек: ручная продажа или (с recordId) оплата визита. Операции — на каждую оплату.
         */
        post: operations["create_receipt_api_admin_v1_finances_receipts_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/receipts/{receipt_id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancel Receipt
         * @description Отмена чека: чек и связанные операции — cancelled; запись чека снова не оплачена.
         */
        post: operations["cancel_receipt_api_admin_v1_finances_receipts__receipt_id__cancel_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/inventory/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Categories */
        get: operations["list_categories_api_admin_v1_inventory_categories_get"];
        put?: never;
        /** Create Category */
        post: operations["create_category_api_admin_v1_inventory_categories_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/inventory/categories/{category_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete Category
         * @description Удаление категории. Товары переносятся в «Без категорії»; при
         *     mode=delete_products они ещё и удаляются (мягко — история движений остаётся).
         */
        delete: operations["delete_category_api_admin_v1_inventory_categories__category_id__delete"];
        options?: never;
        head?: never;
        /** Rename Category */
        patch: operations["rename_category_api_admin_v1_inventory_categories__category_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/inventory/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export Products
         * @description Excel-выгрузка склада; blocks — через запятую из main, stock, finance, description.
         */
        get: operations["export_products_api_admin_v1_inventory_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/inventory/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Import Products
         * @description Импорт из Excel (колонки — IMPORT_COLUMNS, первая строка — заголовок).
         *
         *     Товар ищется по артикулу: новый — создаётся, существующий — обновляется;
         *     отличие остатка оформляется коригуванням. Неизвестная категория создаётся.
         */
        post: operations["import_products_api_admin_v1_inventory_import_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/inventory/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Products
         * @description Список товаров. Мастеру — только активные и только название, единица, остаток.
         */
        get: operations["list_products_api_admin_v1_inventory_products_get"];
        put?: never;
        /** Create Product */
        post: operations["create_product_api_admin_v1_inventory_products_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/inventory/products/{product_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Product */
        get: operations["get_product_api_admin_v1_inventory_products__product_id__get"];
        put?: never;
        post?: never;
        /**
         * Delete Product
         * @description Мягкое удаление: на товар ссылается история движений.
         */
        delete: operations["delete_product_api_admin_v1_inventory_products__product_id__delete"];
        options?: never;
        head?: never;
        /** Patch Product */
        patch: operations["patch_product_api_admin_v1_inventory_products__product_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/inventory/products/{product_id}/movements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Movements */
        get: operations["list_movements_api_admin_v1_inventory_products__product_id__movements_get"];
        put?: never;
        /** Create Movement */
        post: operations["create_movement_api_admin_v1_inventory_products__product_id__movements_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/inventory/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Inventory Summary */
        get: operations["inventory_summary_api_admin_v1_inventory_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/masters/{master_id}/slots": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Master Slots
         * @description Свободное время мастера на дату под набор услуг (длительность — сумма).
         */
        get: operations["master_slots_api_admin_v1_masters__master_id__slots_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment-methods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Payment Methods
         * @description Способы оплаты для приёма оплаты визита (администратор).
         *
         *     Только те, через которые оплата пройдёт: способ активен, у него есть
         *     касса и она не выключена. Финансовые настройки — в /finances/payment-methods.
         */
        get: operations["list_payment_methods_api_admin_v1_payment_methods_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Records */
        get: operations["list_records_api_admin_v1_records_get"];
        put?: never;
        /** Create Record */
        post: operations["create_record_api_admin_v1_records_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/records/{record_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Record */
        get: operations["get_record_api_admin_v1_records__record_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Patch Record */
        patch: operations["patch_record_api_admin_v1_records__record_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/records/{record_id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Complete Record
         * @description Завершение визита — без оплаты: запись получает completed + unpaid.
         */
        post: operations["complete_record_api_admin_v1_records__record_id__complete_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/records/{record_id}/consumables": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Consumables */
        get: operations["list_consumables_api_admin_v1_records__record_id__consumables_get"];
        put?: never;
        /**
         * Write Off Consumables
         * @description Списание расходников по записи (мастер — по своей записи, администратор — по любой).
         */
        post: operations["write_off_consumables_api_admin_v1_records__record_id__consumables_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/records/{record_id}/consumables/{movement_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Cancel Consumable
         * @description Отмена ошибочного списания: обратное движение «надходження» с record_id.
         *
         *     Исходное движение не удаляется. Можно по любой записи, в том числе
         *     завершённой, оплаченной и с удалённым товаром (ошибки находят после визита).
         *     Ответ — обновлённый список расходников записи.
         */
        delete: operations["cancel_consumable_api_admin_v1_records__record_id__consumables__movement_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/records/{record_id}/payment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pay Record
         * @description Оплата завершённого визита: чек с recordId на полную сумму (администратор).
         */
        post: operations["pay_record_api_admin_v1_records__record_id__payment_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/records/{record_id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Set Status */
        post: operations["set_status_api_admin_v1_records__record_id__status_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/records/daily-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Daily Summary
         * @description Число и длительность записей по дням — вид «Місяць» и мини-календарь.
         *
         *     Отменённые не считаются, «Не прийшов» — считаются (время мастера было занято).
         *     Запись относится к дню своего начала.
         */
        get: operations["daily_summary_api_admin_v1_records_daily_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/reports/clients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Clients Report */
        get: operations["clients_report_api_admin_v1_reports_clients_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/reports/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export Reports
         * @description Все отчёты одним файлом; администратору — без денежных колонок и листа выручки.
         */
        get: operations["export_reports_api_admin_v1_reports_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/reports/revenue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Revenue */
        get: operations["revenue_api_admin_v1_reports_revenue_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/reports/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Services Report */
        get: operations["services_report_api_admin_v1_reports_services_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/reports/staff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Staff Report */
        get: operations["staff_report_api_admin_v1_reports_staff_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/reports/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Summary */
        get: operations["summary_api_admin_v1_reports_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Reviews */
        get: operations["list_reviews_api_admin_v1_reviews_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Schedule
         * @description Рабочее время мастеров по дням (даты включительно) — сетка Розкладу.
         */
        get: operations["schedule_api_admin_v1_schedule_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Services */
        get: operations["list_services_api_admin_v1_services_get"];
        put?: never;
        /** Create Service */
        post: operations["create_service_api_admin_v1_services_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/services/{service_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Archive Service
         * @description Архивирование вместо удаления — на услугу ссылаются записи.
         */
        delete: operations["archive_service_api_admin_v1_services__service_id__delete"];
        options?: never;
        head?: never;
        /** Patch Service */
        patch: operations["patch_service_api_admin_v1_services__service_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/services/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Categories */
        get: operations["list_categories_api_admin_v1_services_categories_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/settings/salon": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Salon Info */
        get: operations["get_salon_info_api_admin_v1_settings_salon_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Patch Salon Info */
        patch: operations["patch_salon_info_api_admin_v1_settings_salon_patch"];
        trace?: never;
    };
    "/api/admin/v1/settings/schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Salon Schedule */
        get: operations["get_salon_schedule_api_admin_v1_settings_schedule_get"];
        /**
         * Put Salon Schedule
         * @description Весь график целиком: все семь дней недели.
         */
        put: operations["put_salon_schedule_api_admin_v1_settings_schedule_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/staff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Staff */
        get: operations["list_staff_api_admin_v1_staff_get"];
        put?: never;
        /** Create Staff */
        post: operations["create_staff_api_admin_v1_staff_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/staff/{staff_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Staff */
        get: operations["get_staff_api_admin_v1_staff__staff_id__get"];
        put?: never;
        post?: never;
        /**
         * Fire Staff
         * @description Увольнение из салона. 409, если у мастера есть будущие записи.
         */
        delete: operations["fire_staff_api_admin_v1_staff__staff_id__delete"];
        options?: never;
        head?: never;
        /** Patch Staff */
        patch: operations["patch_staff_api_admin_v1_staff__staff_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/staff/{staff_id}/schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Schedule */
        get: operations["get_schedule_api_admin_v1_staff__staff_id__schedule_get"];
        put?: never;
        /** Save Schedule */
        post: operations["save_schedule_api_admin_v1_staff__staff_id__schedule_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/staff/{staff_id}/schedule/exceptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add Exception */
        post: operations["add_exception_api_admin_v1_staff__staff_id__schedule_exceptions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/staff/{staff_id}/schedule/exceptions/{exception_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Exception */
        delete: operations["delete_exception_api_admin_v1_staff__staff_id__schedule_exceptions__exception_id__delete"];
        options?: never;
        head?: never;
        /** Patch Exception */
        patch: operations["patch_exception_api_admin_v1_staff__staff_id__schedule_exceptions__exception_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/staff/{staff_id}/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Staff Stats */
        get: operations["staff_stats_api_admin_v1_staff__staff_id__stats_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/staff/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export Staff
         * @description Excel-выгрузка сотрудников салона (суперюзер).
         */
        get: operations["export_staff_api_admin_v1_staff_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload File */
        post: operations["upload_file_api_admin_v1_uploads_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/booking/{salon_slug}/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Availability */
        get: operations["availability_api_booking__salon_slug__availability_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/booking/{salon_slug}/masters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Masters */
        get: operations["list_masters_api_booking__salon_slug__masters_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/booking/{salon_slug}/records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Booking */
        post: operations["create_booking_api_booking__salon_slug__records_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/booking/{salon_slug}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create Review
         * @description Отзыв по одноразовому review_token из уведомления о завершённом визите.
         */
        post: operations["create_review_api_booking__salon_slug__reviews_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/booking/{salon_slug}/reviews/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Review Context
         * @description Данные визита по токену из ссылки; использованный или чужой токен — 404.
         */
        get: operations["review_context_api_booking__salon_slug__reviews__token__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/booking/{salon_slug}/salon": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Salon
         * @description Карточка салона для сайта записи: контакты и график (без юридического названия).
         */
        get: operations["get_salon_api_booking__salon_slug__salon_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/booking/{salon_slug}/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Services
         * @description Активные услуги, которые выполняет хотя бы один мастер.
         */
        get: operations["list_services_api_booking__salon_slug__services_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/booking/{salon_slug}/slots": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Slots */
        get: operations["list_slots_api_booking__salon_slug__slots_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bot/clients/link-telegram": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Link Client Telegram
         * @deprecated
         * @description Устарело: используйте POST /api/bot/link-telegram.
         */
        post: operations["link_client_telegram_api_bot_clients_link_telegram_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bot/identify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Identify
         * @description Определяет, кто пишет боту, по telegram_user_id (только Master DB).
         */
        get: operations["identify_api_bot_identify_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bot/link-telegram": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Link Telegram
         * @description Привязывает Telegram по телефону из контакта (бот проверяет, что контакт свой).
         *
         *     Привязываются все совпадения — администратор, мастер, клиент: мастер,
         *     который сам записывается как клиент, получает и уведомления мастера, и
         *     напоминания. Ответ — как у /identify (старшая роль).
         */
        post: operations["link_telegram_api_bot_link_telegram_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bot/masters/records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Master Records
         * @description Записи мастера на дату (по Киеву) во всех его салонах, кроме отменённых.
         */
        get: operations["master_records_api_bot_masters_records_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bot/salons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Salons
         * @description Активные салоны со ссылками на сайт записи — бот ведёт туда клиентов.
         */
        get: operations["list_salons_api_bot_salons_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** SalonOut */
        app__api__admin__auth__SalonOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /** Slug */
            slug: string;
        };
        /** MasterDayOut */
        app__api__admin__calendar__MasterDayOut: {
            /** Bookedminutes */
            bookedMinutes: number;
            /** Count */
            count: number;
            /** Masterid */
            masterId: string | null;
            /** Workminutes */
            workMinutes: number | null;
        };
        /** CategoryOut */
        app__api__admin__inventory__CategoryOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Issystem */
            isSystem: boolean;
            /** Name */
            name: string;
            /** Productscount */
            productsCount: number;
        };
        /** SlotOut */
        app__api__admin__records__SlotOut: {
            /** Label */
            label: string;
            /**
             * Startat
             * Format: date-time
             */
            startAt: string;
        };
        /** CategoryOut */
        app__api__admin__services__CategoryOut: {
            /** Category */
            category: string;
            /** Count */
            count: number;
        };
        /** ServiceOut */
        app__api__admin__services__ServiceOut: {
            /** Category */
            category: string;
            /** Color */
            color: string | null;
            /** Description */
            description: string | null;
            /** Durationminutes */
            durationMinutes: number;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Masters */
            masters?: components["schemas"]["PersonRef"][];
            /** Name */
            name: string;
            /** Price */
            price: string;
            status: components["schemas"]["ServiceStatus"];
        };
        /** SalonOut */
        app__api__booking__router__SalonOut: {
            /** Address */
            address?: string | null;
            /** City */
            city?: string | null;
            /** Description */
            description?: string | null;
            /** Email */
            email?: string | null;
            /** Facebook */
            facebook?: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Instagram */
            instagram?: string | null;
            /** Name */
            name: string;
            /** Phone */
            phone?: string | null;
            /** Schedule */
            schedule?: {
                [key: string]: components["schemas"]["SalonDayOut"];
            } | null;
            /** Slug */
            slug: string;
            /** Timezone */
            timezone: string;
            /** Website */
            website?: string | null;
        };
        /** ServiceOut */
        app__api__booking__router__ServiceOut: {
            /** Category */
            category: string;
            /** Color */
            color: string | null;
            /** Description */
            description: string | null;
            /** Duration Minutes */
            duration_minutes: number;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /** Price */
            price: string;
        };
        /** SlotOut */
        app__api__booking__router__SlotOut: {
            /** Label */
            label: string;
            /** Master Ids */
            master_ids: string[];
            /**
             * Start At
             * Format: date-time
             */
            start_at: string;
        };
        /** MasterDayOut */
        app__api__bot__router__MasterDayOut: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Master Name */
            master_name: string;
            /** Salons */
            salons: components["schemas"]["SalonRecordsOut"][];
        };
        /** Envelope[list[CategoryOut]] */
        app__api__schemas__Envelope_list_CategoryOut____1: {
            /** Data */
            data: components["schemas"]["app__api__admin__services__CategoryOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[CategoryOut]] */
        app__api__schemas__Envelope_list_CategoryOut____2: {
            /** Data */
            data: components["schemas"]["app__api__admin__inventory__CategoryOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /**
         * AuditAction
         * @enum {string}
         */
        AuditAction: "created" | "updated" | "deleted";
        /** AuditOut */
        AuditOut: {
            action: components["schemas"]["AuditAction"];
            author: components["schemas"]["PersonRef"];
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            /** Details */
            details: {
                [key: string]: unknown;
            } | null;
            /** Entity */
            entity: string;
            /** Entityid */
            entityId: string;
            /** Entityname */
            entityName: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
        };
        /** AvailabilityOut */
        AvailabilityOut: {
            /** Dates */
            dates: string[];
        };
        /** Body_import_clients_api_admin_v1_clients_import_post */
        Body_import_clients_api_admin_v1_clients_import_post: {
            /** File */
            file: string;
        };
        /** Body_import_products_api_admin_v1_inventory_import_post */
        Body_import_products_api_admin_v1_inventory_import_post: {
            /** File */
            file: string;
        };
        /** Body_upload_file_api_admin_v1_uploads_post */
        Body_upload_file_api_admin_v1_uploads_post: {
            /** File */
            file: string;
        };
        /** BookingCreate */
        BookingCreate: {
            /** Client Name */
            client_name: string;
            /** Client Phone */
            client_phone: string;
            /** Comment */
            comment?: string | null;
            /** Master Id */
            master_id?: string | null;
            /**
             * Service Id
             * Format: uuid
             */
            service_id: string;
            /**
             * Start At
             * Format: date-time
             */
            start_at: string;
        };
        /** BookingOut */
        BookingOut: {
            /**
             * End At
             * Format: date-time
             */
            end_at: string;
            /**
             * Master Id
             * Format: uuid
             */
            master_id: string;
            /** Master Name */
            master_name: string;
            /** Price */
            price: string;
            /**
             * Record Id
             * Format: uuid
             */
            record_id: string;
            /** Service Name */
            service_name: string;
            /**
             * Start At
             * Format: date-time
             */
            start_at: string;
        };
        /** CashRegisterCreateIn */
        CashRegisterCreateIn: {
            /**
             * Isactive
             * @default true
             */
            isActive: boolean;
            /** Location */
            location?: string | null;
            /** Name */
            name: string;
        };
        /** CashRegisterOut */
        CashRegisterOut: {
            /** Balance */
            balance: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Isactive */
            isActive: boolean;
            /** Location */
            location: string | null;
            /** Name */
            name: string;
        };
        /**
         * CashRegisterPatchIn
         * @description Баланс не редактируется — только операциями. Удаления нет — isActive=false.
         */
        CashRegisterPatchIn: {
            /** Isactive */
            isActive?: boolean | null;
            /** Location */
            location?: string | null;
            /** Name */
            name?: string | null;
        };
        /** CategoryAmount */
        CategoryAmount: {
            /** Amount */
            amount: string;
            /** Category */
            category: string;
        };
        /**
         * CategoryDeleteMode
         * @enum {string}
         */
        CategoryDeleteMode: "delete_products" | "move_to_uncategorized";
        /** CategoryIn */
        CategoryIn: {
            /** Name */
            name: string;
        };
        /** CategoryRowOut */
        CategoryRowOut: {
            /** Category */
            category: string;
            /** Count */
            count: number;
            /** Revenue */
            revenue: string | null;
        };
        /**
         * ClientCategory
         * @enum {string}
         */
        ClientCategory: "vip" | "regular" | "new" | "inactive";
        /** ClientCreateIn */
        ClientCreateIn: {
            /** Additionalphone */
            additionalPhone?: string | null;
            /** Birthdate */
            birthDate?: string | null;
            /** Cardnumber */
            cardNumber?: string | null;
            /** @default new */
            category: components["schemas"]["ClientCategory"];
            /** Color */
            color?: string | null;
            /**
             * Discountpercent
             * @default 0
             */
            discountPercent: number;
            /** Email */
            email?: string | null;
            /** Firstname */
            firstName: string;
            gender?: components["schemas"]["Gender"] | null;
            /** @default medium */
            importance: components["schemas"]["ClientImportance"];
            /** Lastname */
            lastName?: string | null;
            /** Middlename */
            middleName?: string | null;
            /**
             * Noonlinebooking
             * @default false
             */
            noOnlineBooking: boolean;
            /** Notes */
            notes?: string | null;
            /** Phone */
            phone: string;
            /** Source */
            source?: string | null;
        };
        /**
         * ClientImportance
         * @enum {string}
         */
        ClientImportance: "high" | "medium" | "low";
        /** ClientOut */
        ClientOut: {
            /** Additionalphone */
            additionalPhone: string | null;
            /** Birthdate */
            birthDate: string | null;
            /** Cardnumber */
            cardNumber: string | null;
            category: components["schemas"]["ClientCategory"];
            /** Color */
            color: string | null;
            /** Discountpercent */
            discountPercent: number;
            /** Email */
            email: string | null;
            /** Firstname */
            firstName: string;
            /** Firstvisit */
            firstVisit?: string | null;
            gender: components["schemas"]["Gender"] | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            importance: components["schemas"]["ClientImportance"];
            /** Lastname */
            lastName: string | null;
            /** Lastvisit */
            lastVisit?: string | null;
            /** Middlename */
            middleName: string | null;
            /** Noonlinebooking */
            noOnlineBooking: boolean;
            /** Notes */
            notes: string | null;
            /** Phone */
            phone: string;
            /**
             * Segment
             * @default new
             */
            segment: string;
            /** Source */
            source: string | null;
            /**
             * Telegramlinked
             * @default false
             */
            telegramLinked: boolean;
            /**
             * Totalspent
             * @default 0
             */
            totalSpent: string;
            /**
             * Totalvisits
             * @default 0
             */
            totalVisits: number;
        };
        /** ClientPatchIn */
        ClientPatchIn: {
            /** Additionalphone */
            additionalPhone?: string | null;
            /** Birthdate */
            birthDate?: string | null;
            /** Cardnumber */
            cardNumber?: string | null;
            category?: components["schemas"]["ClientCategory"] | null;
            /** Color */
            color?: string | null;
            /** Discountpercent */
            discountPercent?: number | null;
            /** Email */
            email?: string | null;
            /** Firstname */
            firstName?: string | null;
            gender?: components["schemas"]["Gender"] | null;
            importance?: components["schemas"]["ClientImportance"] | null;
            /** Lastname */
            lastName?: string | null;
            /** Middlename */
            middleName?: string | null;
            /** Noonlinebooking */
            noOnlineBooking?: boolean | null;
            /** Notes */
            notes?: string | null;
            /** Phone */
            phone?: string | null;
            /** Source */
            source?: string | null;
        };
        /** ClientRef */
        ClientRef: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /** Phone */
            phone: string;
        };
        /** ClientsOut */
        ClientsOut: {
            groupBy: components["schemas"]["GroupBy"];
            /** New */
            new: number;
            /** Points */
            points: components["schemas"]["ClientsPointOut"][];
            /** Returning */
            returning: number;
            /** Total */
            total: number;
        };
        /** ClientsPointOut */
        ClientsPointOut: {
            /** New */
            new: number;
            /**
             * Period
             * Format: date
             */
            period: string;
            /** Retentionpercent */
            retentionPercent: number | null;
            /** Returning */
            returning: number;
            /** Total */
            total: number;
        };
        /**
         * CommissionPayer
         * @enum {string}
         */
        CommissionPayer: "client" | "salon" | "split";
        /**
         * CommissionType
         * @enum {string}
         */
        CommissionType: "none" | "percentage" | "fixed";
        /** CompleteIn */
        CompleteIn: {
            /** Notes */
            notes?: string | null;
            /** Photourls */
            photoUrls?: string[];
        };
        /** ConsumableIn */
        ConsumableIn: {
            /**
             * Productid
             * Format: uuid
             */
            productId: string;
            /** Quantity */
            quantity: number | string;
        };
        /** ConsumableOut */
        ConsumableOut: {
            author: components["schemas"]["PersonRef"];
            /**
             * Cancelled
             * @default false
             */
            cancelled: boolean;
            /** Cancelledat */
            cancelledAt?: string | null;
            cancelledBy?: components["schemas"]["PersonRef"] | null;
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            /**
             * Movementid
             * Format: uuid
             */
            movementId: string;
            /**
             * Productid
             * Format: uuid
             */
            productId: string;
            /** Productname */
            productName: string;
            /** Quantity */
            quantity: string;
            unit: components["schemas"]["ProductUnit"];
        };
        /** ConsumablesIn */
        ConsumablesIn: {
            /** Items */
            items: components["schemas"]["ConsumableIn"][];
        };
        /** DashboardOut */
        DashboardOut: {
            /** Expensesbycategory */
            expensesByCategory: components["schemas"]["CategoryAmount"][];
            /** Netincome */
            netIncome: string;
            /** Paymentsplit */
            paymentSplit: components["schemas"]["PaymentSplitItem"][];
            /** Revenuebyday */
            revenueByDay: components["schemas"]["DayAmount"][];
            /** Topservices */
            topServices: components["schemas"]["TopService"][];
            /** Totalexpenses */
            totalExpenses: string;
            /** Totalrevenue */
            totalRevenue: string;
        };
        /** DayAmount */
        DayAmount: {
            /** Amount */
            amount: string;
            /** Date */
            date: string;
        };
        /** DayExceptionOut */
        DayExceptionOut: {
            /** Comment */
            comment: string | null;
            type: components["schemas"]["ScheduleExceptionType"];
        };
        /** DayScheduleIn */
        DayScheduleIn: {
            /** Breakend */
            breakEnd?: string | null;
            /** Breakstart */
            breakStart?: string | null;
            /** End */
            end?: string | null;
            /**
             * Isworkday
             * @default false
             */
            isWorkDay: boolean;
            /** Start */
            start?: string | null;
        };
        /** DaySummaryOut */
        DaySummaryOut: {
            /** Bookedminutes */
            bookedMinutes: number;
            /** Bymaster */
            byMaster: components["schemas"]["app__api__admin__calendar__MasterDayOut"][];
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Total */
            total: number;
            /** Workminutes */
            workMinutes: number;
        };
        /**
         * DocumentContentType
         * @enum {string}
         */
        DocumentContentType: "services" | "products" | "mixed";
        /** DocumentCreateIn */
        DocumentCreateIn: {
            /** Amount */
            amount: number | string;
            /** Comment */
            comment?: string | null;
            /** @default services */
            contentType: components["schemas"]["DocumentContentType"];
            /** Counterparty */
            counterparty?: string | null;
            /**
             * Date
             * Format: date-time
             */
            date: string;
            /** Number */
            number: string;
            /** @default draft */
            status: components["schemas"]["DocumentStatus"];
            type: components["schemas"]["DocumentType"];
        };
        /** DocumentOut */
        DocumentOut: {
            /** Amount */
            amount: string;
            author: components["schemas"]["PersonRef"];
            /** Comment */
            comment: string | null;
            contentType: components["schemas"]["DocumentContentType"];
            /** Counterparty */
            counterparty: string | null;
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            /**
             * Date
             * Format: date-time
             */
            date: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Number */
            number: string;
            status: components["schemas"]["DocumentStatus"];
            type: components["schemas"]["DocumentType"];
        };
        /** DocumentPatchIn */
        DocumentPatchIn: {
            /** Amount */
            amount?: number | string | null;
            /** Comment */
            comment?: string | null;
            contentType?: components["schemas"]["DocumentContentType"] | null;
            /** Counterparty */
            counterparty?: string | null;
            /** Date */
            date?: string | null;
            status?: components["schemas"]["DocumentStatus"] | null;
        };
        /**
         * DocumentStatus
         * @enum {string}
         */
        DocumentStatus: "draft" | "issued" | "paid" | "cancelled";
        /**
         * DocumentType
         * @enum {string}
         */
        DocumentType: "receipt" | "invoice" | "expense" | "income" | "act";
        /** Envelope[CashRegisterOut] */
        Envelope_CashRegisterOut_: {
            data: components["schemas"]["CashRegisterOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[CategoryOut] */
        Envelope_CategoryOut_: {
            data: components["schemas"]["app__api__admin__inventory__CategoryOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ClientOut] */
        Envelope_ClientOut_: {
            data: components["schemas"]["ClientOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ClientsOut] */
        Envelope_ClientsOut_: {
            data: components["schemas"]["ClientsOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[DashboardOut] */
        Envelope_DashboardOut_: {
            data: components["schemas"]["DashboardOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[DocumentOut] */
        Envelope_DocumentOut_: {
            data: components["schemas"]["DocumentOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ExceptionOut] */
        Envelope_ExceptionOut_: {
            data: components["schemas"]["ExceptionOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ImportReportOut] */
        Envelope_ImportReportOut_: {
            data: components["schemas"]["ImportReportOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[InventorySummaryOut] */
        Envelope_InventorySummaryOut_: {
            data: components["schemas"]["InventorySummaryOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[AuditOut]] */
        Envelope_list_AuditOut__: {
            /** Data */
            data: components["schemas"]["AuditOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[CashRegisterOut]] */
        Envelope_list_CashRegisterOut__: {
            /** Data */
            data: components["schemas"]["CashRegisterOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[ClientOut]] */
        Envelope_list_ClientOut__: {
            /** Data */
            data: components["schemas"]["ClientOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[ConsumableOut]] */
        Envelope_list_ConsumableOut__: {
            /** Data */
            data: components["schemas"]["ConsumableOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[DaySummaryOut]] */
        Envelope_list_DaySummaryOut__: {
            /** Data */
            data: components["schemas"]["DaySummaryOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[DocumentOut]] */
        Envelope_list_DocumentOut__: {
            /** Data */
            data: components["schemas"]["DocumentOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[MasterScheduleOut]] */
        Envelope_list_MasterScheduleOut__: {
            /** Data */
            data: components["schemas"]["MasterScheduleOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[MovementOut]] */
        Envelope_list_MovementOut__: {
            /** Data */
            data: components["schemas"]["MovementOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[OperationOut]] */
        Envelope_list_OperationOut__: {
            /** Data */
            data: components["schemas"]["OperationOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[PaymentMethodOut]] */
        Envelope_list_PaymentMethodOut__: {
            /** Data */
            data: components["schemas"]["PaymentMethodOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[PaymentMethodRefOut]] */
        Envelope_list_PaymentMethodRefOut__: {
            /** Data */
            data: components["schemas"]["PaymentMethodRefOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[ProductOut]] */
        Envelope_list_ProductOut__: {
            /** Data */
            data: components["schemas"]["ProductOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[ReceiptOut]] */
        Envelope_list_ReceiptOut__: {
            /** Data */
            data: components["schemas"]["ReceiptOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[RecordOut]] */
        Envelope_list_RecordOut__: {
            /** Data */
            data: components["schemas"]["RecordOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[ReviewOut]] */
        Envelope_list_ReviewOut__: {
            /** Data */
            data: components["schemas"]["ReviewOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[ServiceOut]] */
        Envelope_list_ServiceOut__: {
            /** Data */
            data: components["schemas"]["app__api__admin__services__ServiceOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[SlotOut]] */
        Envelope_list_SlotOut__: {
            /** Data */
            data: components["schemas"]["app__api__admin__records__SlotOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[StaffOut]] */
        Envelope_list_StaffOut__: {
            /** Data */
            data: components["schemas"]["StaffOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[StaffRowOut]] */
        Envelope_list_StaffRowOut__: {
            /** Data */
            data: components["schemas"]["StaffRowOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[str]] */
        Envelope_list_str__: {
            /** Data */
            data: string[];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[VisitOut]] */
        Envelope_list_VisitOut__: {
            /** Data */
            data: components["schemas"]["VisitOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[MeOut] */
        Envelope_MeOut_: {
            data: components["schemas"]["MeOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[MovementOut] */
        Envelope_MovementOut_: {
            data: components["schemas"]["MovementOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[OperationOut] */
        Envelope_OperationOut_: {
            data: components["schemas"]["OperationOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[PaymentMethodOut] */
        Envelope_PaymentMethodOut_: {
            data: components["schemas"]["PaymentMethodOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ProductOut] */
        Envelope_ProductOut_: {
            data: components["schemas"]["ProductOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ReceiptOut] */
        Envelope_ReceiptOut_: {
            data: components["schemas"]["ReceiptOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[RecordDetailOut] */
        Envelope_RecordDetailOut_: {
            data: components["schemas"]["RecordDetailOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[RecordOut] */
        Envelope_RecordOut_: {
            data: components["schemas"]["RecordOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[RecordPaymentOut] */
        Envelope_RecordPaymentOut_: {
            data: components["schemas"]["RecordPaymentOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[RevenueOut] */
        Envelope_RevenueOut_: {
            data: components["schemas"]["RevenueOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[SalonInfoOut] */
        Envelope_SalonInfoOut_: {
            data: components["schemas"]["SalonInfoOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[SalonScheduleOut] */
        Envelope_SalonScheduleOut_: {
            data: components["schemas"]["SalonScheduleOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ScheduleOut] */
        Envelope_ScheduleOut_: {
            data: components["schemas"]["ScheduleOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ServiceOut] */
        Envelope_ServiceOut_: {
            data: components["schemas"]["app__api__admin__services__ServiceOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ServicesOut] */
        Envelope_ServicesOut_: {
            data: components["schemas"]["ServicesOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[StaffOut] */
        Envelope_StaffOut_: {
            data: components["schemas"]["StaffOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[StaffStatsOut] */
        Envelope_StaffStatsOut_: {
            data: components["schemas"]["StaffStatsOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[SummaryOut] */
        Envelope_SummaryOut_: {
            data: components["schemas"]["SummaryOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[TokenPairOut] */
        Envelope_TokenPairOut_: {
            data: components["schemas"]["TokenPairOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[TokensOnlyOut] */
        Envelope_TokensOnlyOut_: {
            data: components["schemas"]["TokensOnlyOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[UploadOut] */
        Envelope_UploadOut_: {
            data: components["schemas"]["UploadOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** ExceptionIn */
        ExceptionIn: {
            /** Comment */
            comment?: string | null;
            /**
             * Datefrom
             * Format: date
             */
            dateFrom: string;
            /**
             * Dateto
             * Format: date
             */
            dateTo: string;
            /** End */
            end?: string | null;
            /** Start */
            start?: string | null;
            type: components["schemas"]["ScheduleExceptionType"];
        };
        /** ExceptionOut */
        ExceptionOut: {
            /** Comment */
            comment?: string | null;
            /**
             * Datefrom
             * Format: date
             */
            dateFrom: string;
            /**
             * Dateto
             * Format: date
             */
            dateTo: string;
            /** End */
            end?: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Start */
            start?: string | null;
            type: components["schemas"]["ScheduleExceptionType"];
        };
        /** ExceptionPatchIn */
        ExceptionPatchIn: {
            /** Comment */
            comment?: string | null;
            /** Datefrom */
            dateFrom?: string | null;
            /** Dateto */
            dateTo?: string | null;
            /** End */
            end?: string | null;
            /** Start */
            start?: string | null;
            type?: components["schemas"]["ScheduleExceptionType"] | null;
        };
        /** ForgotPasswordIn */
        ForgotPasswordIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
        };
        /**
         * Gender
         * @enum {string}
         */
        Gender: "male" | "female" | "other";
        /**
         * GroupBy
         * @enum {string}
         */
        GroupBy: "day" | "week" | "month";
        /** HistoryItemOut */
        HistoryItemOut: {
            /** Action */
            action: string;
            /** Author */
            author: string | null;
            /**
             * Date
             * Format: date-time
             */
            date: string;
            /** Details */
            details: {
                [key: string]: unknown;
            } | null;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** IdentifyOut */
        IdentifyOut: {
            /** Name */
            name: string | null;
            /** Role */
            role: string | null;
            /**
             * Salon Ids
             * @default []
             */
            salon_ids: string[];
            /** User Id */
            user_id: string | null;
        };
        /** ImportReportOut */
        ImportReportOut: {
            /** Created */
            created: number;
            /** Errors */
            errors: string[];
            /** Updated */
            updated: number;
        };
        /** InventorySummaryOut */
        InventorySummaryOut: {
            /** Low */
            low: number;
            /** Out */
            out: number;
            /** Stockvalue */
            stockValue: string;
            /** Total */
            total: number;
        };
        /** LinkTelegramRequest */
        LinkTelegramRequest: {
            /** Phone */
            phone: string;
            /** Telegram User Id */
            telegram_user_id: number;
        };
        /** LoginIn */
        LoginIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
        };
        /** MasterOut */
        MasterOut: {
            /** Avatar Url */
            avatar_url: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /** Specializations */
            specializations: string[];
        };
        /** MasterRecordOut */
        MasterRecordOut: {
            /** Client Name */
            client_name: string;
            /** Client Phone */
            client_phone: string;
            /** Comment */
            comment: string | null;
            /**
             * End At
             * Format: date-time
             */
            end_at: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Services */
            services: string[];
            /**
             * Start At
             * Format: date-time
             */
            start_at: string;
            status: components["schemas"]["RecordStatus"];
            /** Visitor Name */
            visitor_name: string | null;
        };
        /** MasterRef */
        MasterRef: {
            /** Color */
            color?: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
        };
        /** MasterScheduleOut */
        MasterScheduleOut: {
            /** Color */
            color: string | null;
            /** Days */
            days: components["schemas"]["ScheduleDayOut"][];
            /**
             * Masterid
             * Format: uuid
             */
            masterId: string;
            /** Name */
            name: string;
        };
        /** MeOut */
        MeOut: {
            /** Additionalphone */
            additionalPhone: string | null;
            /** Address */
            address: string | null;
            /** Avatarurl */
            avatarUrl: string | null;
            /** Birthdate */
            birthDate: string | null;
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            /** Email */
            email: string | null;
            /** Emergencycontactname */
            emergencyContactName: string | null;
            /** Emergencycontactphone */
            emergencyContactPhone: string | null;
            /** Firstname */
            firstName: string;
            gender: components["schemas"]["Gender"] | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Issuperuser */
            isSuperuser: boolean;
            /** Lastname */
            lastName: string | null;
            /** Middlename */
            middleName: string | null;
            /** Name */
            name: string;
            /** Phone */
            phone: string | null;
            profile?: components["schemas"]["SalonProfileOut"] | null;
            role: components["schemas"]["Role"];
            /** Salons */
            salons: components["schemas"]["app__api__admin__auth__SalonOut"][];
            /** Telegramlinked */
            telegramLinked: boolean;
            /** Timezone */
            timezone: string;
        };
        /**
         * MePatchIn
         * @description Свои контакты. Имя, должность, оклад и прочее меняет администратор.
         */
        MePatchIn: {
            /** Additionalphone */
            additionalPhone?: string | null;
            /** Address */
            address?: string | null;
            /** Avatarurl */
            avatarUrl?: string | null;
            /** Emergencycontactname */
            emergencyContactName?: string | null;
            /** Emergencycontactphone */
            emergencyContactPhone?: string | null;
            /** Phone */
            phone?: string | null;
        };
        /** MetricOut */
        MetricOut: {
            /** Changepercent */
            changePercent: number | null;
            /** Previous */
            previous: string;
            /** Value */
            value: string;
        };
        /** MovementIn */
        MovementIn: {
            /** Quantity */
            quantity: number | string;
            /** Reason */
            reason?: string | null;
            type: components["schemas"]["MovementType"];
        };
        /** MovementOut */
        MovementOut: {
            author: components["schemas"]["PersonRef"];
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            /** Delta */
            delta: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Productid
             * Format: uuid
             */
            productId: string;
            /** Quantityafter */
            quantityAfter: string;
            /** Reason */
            reason: string | null;
            /** Recordid */
            recordId: string | null;
            type: components["schemas"]["MovementType"];
        };
        /**
         * MovementType
         * @enum {string}
         */
        MovementType: "receipt" | "write_off" | "adjustment";
        /** NewClientIn */
        NewClientIn: {
            /** Name */
            name: string;
            /** Phone */
            phone: string;
        };
        /** OperationCreateIn */
        OperationCreateIn: {
            /** Amount */
            amount: number | string;
            /** Cashregisterid */
            cashRegisterId?: string | null;
            /** Category */
            category?: string | null;
            /** Clientid */
            clientId?: string | null;
            /**
             * Date
             * Format: date-time
             */
            date: string;
            /** Description */
            description?: string | null;
            /** Paymentmethodid */
            paymentMethodId?: string | null;
            type: components["schemas"]["OperationType"];
        };
        /** OperationOut */
        OperationOut: {
            /** Amount */
            amount: string;
            author: components["schemas"]["PersonRef"];
            cashRegister: components["schemas"]["PersonRef"] | null;
            /** Category */
            category: string | null;
            /** Clientid */
            clientId: string | null;
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            /**
             * Date
             * Format: date-time
             */
            date: string;
            /** Description */
            description: string | null;
            /** Documentid */
            documentId: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            paymentMethod: components["schemas"]["PersonRef"] | null;
            /** Receiptid */
            receiptId: string | null;
            /** Recordid */
            recordId: string | null;
            status: components["schemas"]["OperationStatus"];
            type: components["schemas"]["OperationType"];
        };
        /** OperationPatchIn */
        OperationPatchIn: {
            /** Amount */
            amount?: number | string | null;
            /** Category */
            category?: string | null;
            /** Date */
            date?: string | null;
            /** Description */
            description?: string | null;
            status?: components["schemas"]["OperationStatus"] | null;
        };
        /**
         * OperationStatus
         * @enum {string}
         */
        OperationStatus: "completed" | "pending" | "cancelled";
        /**
         * OperationType
         * @enum {string}
         */
        OperationType: "income" | "expense" | "transfer";
        /** PageMeta */
        PageMeta: {
            /** Page */
            page: number;
            /** Perpage */
            perPage: number;
            /** Total */
            total: number;
            /** Totalpages */
            totalPages: number;
        };
        /** PaymentIn */
        PaymentIn: {
            /** Amount */
            amount: number | string;
            /**
             * Paymentmethodid
             * Format: uuid
             */
            paymentMethodId: string;
        };
        /** PaymentMethodCreateIn */
        PaymentMethodCreateIn: {
            /**
             * Allowpartialpayment
             * @default true
             */
            allowPartialPayment: boolean;
            /**
             * Allowtips
             * @default false
             */
            allowTips: boolean;
            /**
             * Availableonline
             * @default false
             */
            availableOnline: boolean;
            /** Cashregisterid */
            cashRegisterId?: string | null;
            /** @default salon */
            commissionPayer: components["schemas"]["CommissionPayer"];
            /** @default none */
            commissionType: components["schemas"]["CommissionType"];
            /**
             * Commissionvalue
             * @default 0
             */
            commissionValue: number | string;
            /**
             * Isactive
             * @default true
             */
            isActive: boolean;
            /** Name */
            name: string;
            /**
             * Sortorder
             * @default 0
             */
            sortOrder: number;
            type: components["schemas"]["PaymentMethodType"];
        };
        /** PaymentMethodOut */
        PaymentMethodOut: {
            /** Allowpartialpayment */
            allowPartialPayment: boolean;
            /** Allowtips */
            allowTips: boolean;
            /** Availableonline */
            availableOnline: boolean;
            /** Cashregisterid */
            cashRegisterId: string | null;
            commissionPayer: components["schemas"]["CommissionPayer"];
            commissionType: components["schemas"]["CommissionType"];
            /** Commissionvalue */
            commissionValue: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Isactive */
            isActive: boolean;
            /** Name */
            name: string;
            /** Sortorder */
            sortOrder: number;
            type: components["schemas"]["PaymentMethodType"];
        };
        /** PaymentMethodPatchIn */
        PaymentMethodPatchIn: {
            /** Allowpartialpayment */
            allowPartialPayment?: boolean | null;
            /** Allowtips */
            allowTips?: boolean | null;
            /** Availableonline */
            availableOnline?: boolean | null;
            /** Cashregisterid */
            cashRegisterId?: string | null;
            commissionPayer?: components["schemas"]["CommissionPayer"] | null;
            commissionType?: components["schemas"]["CommissionType"] | null;
            /** Commissionvalue */
            commissionValue?: number | string | null;
            /** Isactive */
            isActive?: boolean | null;
            /** Name */
            name?: string | null;
            /** Sortorder */
            sortOrder?: number | null;
            type?: components["schemas"]["PaymentMethodType"] | null;
        };
        /** PaymentMethodRefOut */
        PaymentMethodRefOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            type: components["schemas"]["PaymentMethodType"];
        };
        /**
         * PaymentMethodType
         * @enum {string}
         */
        PaymentMethodType: "cash" | "card" | "online" | "certificate" | "bonus" | "tips" | "other";
        /** PaymentSplitItem */
        PaymentSplitItem: {
            /** Amount */
            amount: string;
            methodType: components["schemas"]["PaymentMethodType"];
            /** Share */
            share: number;
        };
        /**
         * PaymentStatus
         * @enum {string}
         */
        PaymentStatus: "unpaid" | "partial" | "paid";
        /**
         * PersonRef
         * @description Короткая ссылка на человека в ответах: {id, name}.
         */
        PersonRef: {
            /** Id */
            id?: string | null;
            /** Name */
            name?: string | null;
        };
        /** PhotoOut */
        PhotoOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Url */
            url: string;
        };
        /** ProductCreateIn */
        ProductCreateIn: {
            /** Categoryid */
            categoryId?: string | null;
            /** Costprice */
            costPrice?: number | string | null;
            /** Description */
            description?: string | null;
            /**
             * Minquantity
             * @default 0
             */
            minQuantity: number | string;
            /** Name */
            name: string;
            /** Packagevolume */
            packageVolume?: number | string | null;
            /**
             * Quantity
             * @default 0
             */
            quantity: number | string;
            /** Saleprice */
            salePrice?: number | string | null;
            /** Sku */
            sku: string;
            /** @default pcs */
            unit: components["schemas"]["ProductUnit"];
        };
        /** ProductOut */
        ProductOut: {
            category?: components["schemas"]["PersonRef"] | null;
            /** Costprice */
            costPrice?: string | null;
            /** Createdat */
            createdAt?: string | null;
            /** Description */
            description?: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Isactive
             * @default true
             */
            isActive: boolean;
            /** Minquantity */
            minQuantity?: string | null;
            /** Name */
            name: string;
            /** Packagevolume */
            packageVolume?: string | null;
            /** Quantity */
            quantity: string;
            /** Saleprice */
            salePrice?: string | null;
            /** Sku */
            sku?: string | null;
            stockStatus: components["schemas"]["StockStatus"];
            unit: components["schemas"]["ProductUnit"];
        };
        /**
         * ProductPatchIn
         * @description Остаток здесь не меняется — только движениями.
         */
        ProductPatchIn: {
            /** Categoryid */
            categoryId?: string | null;
            /** Costprice */
            costPrice?: number | string | null;
            /** Description */
            description?: string | null;
            /** Isactive */
            isActive?: boolean | null;
            /** Minquantity */
            minQuantity?: number | string | null;
            /** Name */
            name?: string | null;
            /** Packagevolume */
            packageVolume?: number | string | null;
            /** Saleprice */
            salePrice?: number | string | null;
            /** Sku */
            sku?: string | null;
            unit?: components["schemas"]["ProductUnit"] | null;
        };
        /**
         * ProductUnit
         * @enum {string}
         */
        ProductUnit: "pcs" | "ml" | "l" | "g" | "kg";
        /** ReceiptCreateIn */
        ReceiptCreateIn: {
            /** Clientid */
            clientId?: string | null;
            /** Clientname */
            clientName?: string | null;
            /** Date */
            date?: string | null;
            /** Payments */
            payments: components["schemas"]["ReceiptPaymentIn"][];
            /** Recordid */
            recordId?: string | null;
            /** @default web */
            source: components["schemas"]["ReceiptSource"];
        };
        /** ReceiptOut */
        ReceiptOut: {
            /** Amount */
            amount: string;
            author: components["schemas"]["PersonRef"];
            cashRegister: components["schemas"]["PersonRef"];
            client: components["schemas"]["PersonRef"] | null;
            /**
             * Date
             * Format: date-time
             */
            date: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Number */
            number: string;
            /** Payments */
            payments: components["schemas"]["ReceiptPaymentOut"][];
            /** Recordid */
            recordId: string | null;
            source: components["schemas"]["ReceiptSource"];
            status: components["schemas"]["ReceiptStatus"];
        };
        /** ReceiptPaymentIn */
        ReceiptPaymentIn: {
            /** Amount */
            amount: number | string;
            /**
             * Paymentmethodid
             * Format: uuid
             */
            paymentMethodId: string;
        };
        /** ReceiptPaymentOut */
        ReceiptPaymentOut: {
            /** Amount */
            amount: string;
            method: components["schemas"]["PersonRef"];
            methodType?: components["schemas"]["PaymentMethodType"] | null;
        };
        /** ReceiptRef */
        ReceiptRef: {
            /** Amount */
            amount: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Number */
            number: string;
        };
        /**
         * ReceiptSource
         * @enum {string}
         */
        ReceiptSource: "web" | "mobile" | "pos";
        /**
         * ReceiptStatus
         * @enum {string}
         */
        ReceiptStatus: "paid" | "partial" | "cancelled";
        /** RecordCreateIn */
        RecordCreateIn: {
            /** Clientid */
            clientId?: string | null;
            /** Comment */
            comment?: string | null;
            /** @default standard */
            importance: components["schemas"]["RecordImportance"];
            /** Masterid */
            masterId?: string | null;
            newClient?: components["schemas"]["NewClientIn"] | null;
            /**
             * Reminderenabled
             * @default true
             */
            reminderEnabled: boolean;
            /** Serviceids */
            serviceIds: string[];
            /** @default admin */
            source: components["schemas"]["RecordSource"];
            /**
             * Startat
             * Format: date-time
             */
            startAt: string;
            /** Visitorname */
            visitorName?: string | null;
            /** Visitorphone */
            visitorPhone?: string | null;
        };
        /** RecordDetailOut */
        RecordDetailOut: {
            /** Actualendat */
            actualEndAt: string | null;
            /** Actualstartat */
            actualStartAt: string | null;
            client: components["schemas"]["ClientRef"];
            /** Clienttelegramlinked */
            clientTelegramLinked: boolean;
            /** Closedat */
            closedAt: string | null;
            closedBy: components["schemas"]["PersonRef"];
            /** Comment */
            comment: string | null;
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            createdBy: components["schemas"]["PersonRef"];
            /**
             * Endat
             * Format: date-time
             */
            endAt: string;
            /** History */
            history: components["schemas"]["HistoryItemOut"][];
            /**
             * Id
             * Format: uuid
             */
            id: string;
            importance: components["schemas"]["RecordImportance"];
            /** Internalnotes */
            internalNotes: string | null;
            master: components["schemas"]["MasterRef"] | null;
            paymentStatus: components["schemas"]["PaymentStatus"];
            /** Photos */
            photos: components["schemas"]["PhotoOut"][];
            /** Price */
            price: string;
            /** Reminderenabled */
            reminderEnabled: boolean;
            /** Remindersentat */
            reminderSentAt: string | null;
            /** Services */
            services: components["schemas"]["RecordServiceOut"][];
            source: components["schemas"]["RecordSource"];
            /**
             * Startat
             * Format: date-time
             */
            startAt: string;
            status: components["schemas"]["RecordStatus"];
            /** Totalamount */
            totalAmount: string;
            /** Visitorname */
            visitorName: string | null;
            /** Visitorphone */
            visitorPhone: string | null;
        };
        /**
         * RecordImportance
         * @enum {string}
         */
        RecordImportance: "standard" | "important" | "special";
        /** RecordOut */
        RecordOut: {
            /** Actualendat */
            actualEndAt: string | null;
            /** Actualstartat */
            actualStartAt: string | null;
            client: components["schemas"]["ClientRef"];
            /** Clienttelegramlinked */
            clientTelegramLinked: boolean;
            /** Comment */
            comment: string | null;
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            createdBy: components["schemas"]["PersonRef"];
            /**
             * Endat
             * Format: date-time
             */
            endAt: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            importance: components["schemas"]["RecordImportance"];
            master: components["schemas"]["MasterRef"] | null;
            paymentStatus: components["schemas"]["PaymentStatus"];
            /** Price */
            price: string;
            /** Reminderenabled */
            reminderEnabled: boolean;
            /** Remindersentat */
            reminderSentAt: string | null;
            /** Services */
            services: components["schemas"]["RecordServiceOut"][];
            source: components["schemas"]["RecordSource"];
            /**
             * Startat
             * Format: date-time
             */
            startAt: string;
            status: components["schemas"]["RecordStatus"];
            /** Totalamount */
            totalAmount: string;
            /** Visitorname */
            visitorName: string | null;
            /** Visitorphone */
            visitorPhone: string | null;
        };
        /** RecordPatchIn */
        RecordPatchIn: {
            /** Comment */
            comment?: string | null;
            importance?: components["schemas"]["RecordImportance"] | null;
            /** Internalnotes */
            internalNotes?: string | null;
            /** Masterid */
            masterId?: string | null;
            /** Reminderenabled */
            reminderEnabled?: boolean | null;
            /** Serviceids */
            serviceIds?: string[] | null;
            /** Startat */
            startAt?: string | null;
            /** Visitorname */
            visitorName?: string | null;
            /** Visitorphone */
            visitorPhone?: string | null;
        };
        /** RecordPaymentIn */
        RecordPaymentIn: {
            /** Payments */
            payments: components["schemas"]["PaymentIn"][];
        };
        /** RecordPaymentOut */
        RecordPaymentOut: {
            receipt: components["schemas"]["ReceiptRef"];
            record: components["schemas"]["RecordOut"];
        };
        /**
         * RecordServiceOut
         * @description Услуга в записи: снапшот названия/цены/длительности + текущие категория и цвет.
         */
        RecordServiceOut: {
            /** Category */
            category?: string | null;
            /** Color */
            color?: string | null;
            /** Durationminutes */
            durationMinutes: number;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /** Price */
            price: string;
        };
        /**
         * RecordSource
         * @enum {string}
         */
        RecordSource: "admin" | "booking" | "bot" | "phone" | "walk_in";
        /**
         * RecordStatus
         * @enum {string}
         */
        RecordStatus: "scheduled" | "confirmed" | "arrived" | "completed" | "cancelled" | "no_show";
        /** RefreshIn */
        RefreshIn: {
            /** Refreshtoken */
            refreshToken: string;
        };
        /** ResetPasswordIn */
        ResetPasswordIn: {
            /** Password */
            password: string;
            /** Token */
            token: string;
        };
        /** RevenueOut */
        RevenueOut: {
            groupBy: components["schemas"]["GroupBy"];
            /** Points */
            points: components["schemas"]["RevenuePointOut"][];
            /** Total */
            total: string;
        };
        /** RevenuePointOut */
        RevenuePointOut: {
            /** Amount */
            amount: string;
            /**
             * Period
             * Format: date
             */
            period: string;
            /** Receipts */
            receipts: number;
        };
        /**
         * ReviewContextOut
         * @description Что показать на форме отзыва: к кому и когда был визит.
         */
        ReviewContextOut: {
            /** Master Name */
            master_name: string;
            /** Salon Name */
            salon_name: string;
            /** Services */
            services: string[];
            /**
             * Visit At
             * Format: date-time
             */
            visit_at: string;
        };
        /** ReviewCreate */
        ReviewCreate: {
            /** Rating */
            rating: number;
            /** Text */
            text?: string | null;
            /**
             * Token
             * Format: uuid
             */
            token: string;
        };
        /** ReviewCreatedOut */
        ReviewCreatedOut: {
            /**
             * Review Id
             * Format: uuid
             */
            review_id: string;
        };
        /** ReviewOut */
        ReviewOut: {
            client: components["schemas"]["PersonRef"];
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            master: components["schemas"]["PersonRef"];
            /** Rating */
            rating: number;
            /**
             * Recordid
             * Format: uuid
             */
            recordId: string;
            /** Text */
            text: string | null;
        };
        /**
         * Role
         * @enum {string}
         */
        Role: "administrator" | "master";
        /** SalonDay */
        SalonDay: {
            /** End */
            end?: string | null;
            /**
             * Isworkday
             * @default false
             */
            isWorkDay: boolean;
            /** Start */
            start?: string | null;
        };
        /** SalonDayOut */
        SalonDayOut: {
            /** End */
            end: string | null;
            /** Is Work Day */
            is_work_day: boolean;
            /** Start */
            start: string | null;
        };
        /** SalonInfoOut */
        SalonInfoOut: {
            /** Address */
            address: string | null;
            /** City */
            city: string | null;
            /** Description */
            description: string | null;
            /** Email */
            email: string | null;
            /** Facebook */
            facebook: string | null;
            /** Instagram */
            instagram: string | null;
            /** Legalname */
            legalName: string | null;
            /** Name */
            name: string;
            /** Openedon */
            openedOn: string | null;
            /** Phone */
            phone: string | null;
            /** Website */
            website: string | null;
        };
        /**
         * SalonInfoPatchIn
         * @description Передаются только изменённые поля; null — очистить (кроме name).
         */
        SalonInfoPatchIn: {
            /** Address */
            address?: string | null;
            /** City */
            city?: string | null;
            /** Description */
            description?: string | null;
            /** Email */
            email?: string | null;
            /** Facebook */
            facebook?: string | null;
            /** Instagram */
            instagram?: string | null;
            /** Legalname */
            legalName?: string | null;
            /** Name */
            name?: string | null;
            /** Openedon */
            openedOn?: string | null;
            /** Phone */
            phone?: string | null;
            /** Website */
            website?: string | null;
        };
        /** SalonLinkOut */
        SalonLinkOut: {
            /** Booking Url */
            booking_url: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
        };
        /**
         * SalonProfileOut
         * @description Условия работы в текущем салоне (заголовок X-Salon-Id). Свой оклад видит каждый.
         */
        SalonProfileOut: {
            /** Commissionpercent */
            commissionPercent: string | null;
            /** Hiredate */
            hireDate: string | null;
            /** Position */
            position: string | null;
            /** Salary */
            salary: string | null;
            /**
             * Salonid
             * Format: uuid
             */
            salonId: string;
            /** Specializations */
            specializations: string[];
            status: components["schemas"]["StaffStatus"];
        };
        /** SalonRecordsOut */
        SalonRecordsOut: {
            /** Records */
            records: components["schemas"]["MasterRecordOut"][];
            /**
             * Salon Id
             * Format: uuid
             */
            salon_id: string;
            /** Salon Name */
            salon_name: string;
        };
        /** SalonScheduleIn */
        SalonScheduleIn: {
            /** Week */
            week: {
                [key: string]: components["schemas"]["SalonDay"];
            };
        };
        /** SalonScheduleOut */
        SalonScheduleOut: {
            /** Configured */
            configured: boolean;
            /** Week */
            week: {
                [key: string]: components["schemas"]["SalonDay"];
            };
        };
        /** ScheduleDayOut */
        ScheduleDayOut: {
            /**
             * Date
             * Format: date
             */
            date: string;
            exception: components["schemas"]["DayExceptionOut"] | null;
            /** Isworkday */
            isWorkDay: boolean;
            /** Windows */
            windows: components["schemas"]["WindowOut"][];
        };
        /**
         * ScheduleExceptionType
         * @enum {string}
         */
        ScheduleExceptionType: "vacation" | "sick" | "day_off" | "extra_shift";
        /** ScheduleOut */
        ScheduleOut: {
            /** Exceptions */
            exceptions: components["schemas"]["ExceptionOut"][];
            /** Week */
            week: {
                [key: string]: components["schemas"]["DayScheduleIn"];
            };
        };
        /** ServiceCreateIn */
        ServiceCreateIn: {
            /**
             * Category
             * @default other
             */
            category: string;
            /** Color */
            color?: string | null;
            /** Description */
            description?: string | null;
            /**
             * Durationminutes
             * @default 60
             */
            durationMinutes: number;
            /** Masterids */
            masterIds?: string[];
            /** Name */
            name: string;
            /** Price */
            price: number | string;
            /** @default active */
            status: components["schemas"]["ServiceStatus"];
        };
        /** ServicePatchIn */
        ServicePatchIn: {
            /** Category */
            category?: string | null;
            /** Color */
            color?: string | null;
            /** Description */
            description?: string | null;
            /** Durationminutes */
            durationMinutes?: number | null;
            /** Masterids */
            masterIds?: string[] | null;
            /** Name */
            name?: string | null;
            /** Price */
            price?: number | string | null;
            status?: components["schemas"]["ServiceStatus"] | null;
        };
        /** ServiceRowOut */
        ServiceRowOut: {
            /** Category */
            category: string;
            /** Count */
            count: number;
            /** Name */
            name: string;
            /** Revenue */
            revenue: string | null;
            /**
             * Serviceid
             * Format: uuid
             */
            serviceId: string;
        };
        /** ServicesOut */
        ServicesOut: {
            /** Categories */
            categories: components["schemas"]["CategoryRowOut"][];
            /** Services */
            services: components["schemas"]["ServiceRowOut"][];
        };
        /**
         * ServiceStatus
         * @enum {string}
         */
        ServiceStatus: "active" | "inactive" | "archived";
        /** StaffCreateIn */
        StaffCreateIn: {
            /** Additionalphone */
            additionalPhone?: string | null;
            /** Address */
            address?: string | null;
            /** Birthdate */
            birthDate?: string | null;
            /** Color */
            color?: string | null;
            /** Commissionpercent */
            commissionPercent?: number | string | null;
            /** Email */
            email?: string | null;
            /** Emergencycontactname */
            emergencyContactName?: string | null;
            /** Emergencycontactphone */
            emergencyContactPhone?: string | null;
            /** Firstname */
            firstName: string;
            gender?: components["schemas"]["Gender"] | null;
            /** Hiredate */
            hireDate?: string | null;
            /**
             * Issuperuser
             * @default false
             */
            isSuperuser: boolean;
            /** Lastname */
            lastName?: string | null;
            /** Middlename */
            middleName?: string | null;
            /** Password */
            password?: string | null;
            /** Phone */
            phone: string;
            /** Position */
            position?: string | null;
            /** @default master */
            role: components["schemas"]["Role"];
            /** Salary */
            salary?: number | string | null;
            /** Specializations */
            specializations?: string[];
        };
        /** StaffOut */
        StaffOut: {
            /** Additionalphone */
            additionalPhone: string | null;
            /** Address */
            address?: string | null;
            /** Avatarurl */
            avatarUrl: string | null;
            /** Birthdate */
            birthDate: string | null;
            /** Color */
            color?: string | null;
            /** Commissionpercent */
            commissionPercent?: string | null;
            /** Email */
            email: string | null;
            /** Emergencycontactname */
            emergencyContactName?: string | null;
            /** Emergencycontactphone */
            emergencyContactPhone?: string | null;
            /** Firedat */
            firedAt?: string | null;
            /** Firstname */
            firstName: string;
            gender: components["schemas"]["Gender"] | null;
            /** Hiredate */
            hireDate?: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Issuperuser
             * @default false
             */
            isSuperuser: boolean;
            /** Lastname */
            lastName: string | null;
            /** Middlename */
            middleName: string | null;
            /** Phone */
            phone: string | null;
            /** Position */
            position?: string | null;
            role: components["schemas"]["Role"];
            /** Salary */
            salary?: string | null;
            /** Specializations */
            specializations?: string[];
            /** @default active */
            status: components["schemas"]["StaffStatus"];
            /**
             * Telegramlinked
             * @default false
             */
            telegramLinked: boolean;
        };
        /** StaffPatchIn */
        StaffPatchIn: {
            /** Additionalphone */
            additionalPhone?: string | null;
            /** Address */
            address?: string | null;
            /** Avatarurl */
            avatarUrl?: string | null;
            /** Birthdate */
            birthDate?: string | null;
            /** Color */
            color?: string | null;
            /** Commissionpercent */
            commissionPercent?: number | string | null;
            /** Email */
            email?: string | null;
            /** Emergencycontactname */
            emergencyContactName?: string | null;
            /** Emergencycontactphone */
            emergencyContactPhone?: string | null;
            /** Firstname */
            firstName?: string | null;
            gender?: components["schemas"]["Gender"] | null;
            /** Hiredate */
            hireDate?: string | null;
            /** Issuperuser */
            isSuperuser?: boolean | null;
            /** Lastname */
            lastName?: string | null;
            /** Middlename */
            middleName?: string | null;
            /** Password */
            password?: string | null;
            /** Phone */
            phone?: string | null;
            /** Position */
            position?: string | null;
            /** Salary */
            salary?: number | string | null;
            /** Specializations */
            specializations?: string[] | null;
            status?: components["schemas"]["StaffStatus"] | null;
        };
        /** StaffRowOut */
        StaffRowOut: {
            /** Avgcheck */
            avgCheck: string | null;
            /** Cancelled */
            cancelled: number;
            /** Completed */
            completed: number;
            /**
             * Masterid
             * Format: uuid
             */
            masterId: string;
            /** Name */
            name: string;
            /** Noshow */
            noShow: number;
            /** Rating */
            rating: number | null;
            /** Records */
            records: number;
            /** Revenue */
            revenue: string | null;
            /** Reviews */
            reviews: number;
        };
        /** StaffStatsOut */
        StaffStatsOut: {
            /** Avgcheck */
            avgCheck: string;
            /** Rating */
            rating: number | null;
            /** Revenue */
            revenue: string;
            /** Visits */
            visits: number;
        };
        /**
         * StaffStatus
         * @enum {string}
         */
        StaffStatus: "active" | "vacation" | "sick" | "fired";
        /** StatusIn */
        StatusIn: {
            status: components["schemas"]["RecordStatus"];
        };
        /**
         * StockStatus
         * @enum {string}
         */
        StockStatus: "in_stock" | "low" | "out";
        /** SummaryOut */
        SummaryOut: {
            avgCheck: components["schemas"]["MetricOut"] | null;
            clients: components["schemas"]["MetricOut"];
            /**
             * Datefrom
             * Format: date-time
             */
            dateFrom: string;
            /**
             * Dateto
             * Format: date-time
             */
            dateTo: string;
            /**
             * Previousfrom
             * Format: date-time
             */
            previousFrom: string;
            records: components["schemas"]["MetricOut"];
            revenue: components["schemas"]["MetricOut"] | null;
        };
        /** TokenPairOut */
        TokenPairOut: {
            /** Accesstoken */
            accessToken: string;
            /** Refreshtoken */
            refreshToken: string;
            user: components["schemas"]["UserOut"];
        };
        /** TokensOnlyOut */
        TokensOnlyOut: {
            /** Accesstoken */
            accessToken: string;
            /** Refreshtoken */
            refreshToken: string;
        };
        /** TopService */
        TopService: {
            /** Count */
            count: number;
            /** Name */
            name: string;
            /** Revenue */
            revenue: string;
        };
        /** UploadOut */
        UploadOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Url */
            url: string;
        };
        /** UserOut */
        UserOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Issuperuser */
            isSuperuser: boolean;
            /** Name */
            name: string;
            role: components["schemas"]["Role"];
            /** Salonids */
            salonIds: string[];
        };
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
        /** VisitOut */
        VisitOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Internalnotes */
            internalNotes: string | null;
            /** Masterid */
            masterId: string | null;
            /** Mastername */
            masterName: string | null;
            /** Photos */
            photos: string[];
            /** Services */
            services: components["schemas"]["VisitServiceOut"][];
            /**
             * Startat
             * Format: date-time
             */
            startAt: string;
            status: components["schemas"]["RecordStatus"];
            /** Totalamount */
            totalAmount: string;
        };
        /** VisitServiceOut */
        VisitServiceOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
        };
        /** WindowOut */
        WindowOut: {
            /**
             * End
             * Format: time
             */
            end: string;
            /**
             * Start
             * Format: time
             */
            start: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    list_audit_api_admin_v1_audit_get: {
        parameters: {
            query?: {
                action?: components["schemas"]["AuditAction"] | null;
                authorId?: string | null;
                dateFrom?: string | null;
                dateTo?: string | null;
                entity?: string | null;
                page?: number;
                perPage?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_AuditOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    forgot_password_api_admin_v1_auth_forgot_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ForgotPasswordIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    login_api_admin_v1_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_TokenPairOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    me_api_admin_v1_auth_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_MeOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_me_api_admin_v1_auth_me_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MePatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_MeOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    refresh_api_admin_v1_auth_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_TokensOnlyOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reset_password_api_admin_v1_auth_reset_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResetPasswordIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_clients_api_admin_v1_clients_get: {
        parameters: {
            query?: {
                category?: components["schemas"]["ClientCategory"] | null;
                page?: number;
                perPage?: number;
                query?: string | null;
                segment?: string | null;
                sort?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_ClientOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_client_api_admin_v1_clients_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClientCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ClientOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_client_api_admin_v1_clients__client_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ClientOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_client_api_admin_v1_clients__client_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_client_api_admin_v1_clients__client_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClientPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ClientOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    client_visits_api_admin_v1_clients__client_id__visits_get: {
        parameters: {
            query?: {
                page?: number;
                perPage?: number;
            };
            header?: never;
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_VisitOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_clients_api_admin_v1_clients_export_get: {
        parameters: {
            query?: {
                includeVisits?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_clients_api_admin_v1_clients_import_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_import_clients_api_admin_v1_clients_import_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ImportReportOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_cash_registers_api_admin_v1_finances_cash_registers_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_CashRegisterOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_cash_register_api_admin_v1_finances_cash_registers_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CashRegisterCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_CashRegisterOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_cash_register_api_admin_v1_finances_cash_registers__register_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                register_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CashRegisterPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_CashRegisterOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    dashboard_api_admin_v1_finances_dashboard_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
                location?: string | null;
                masterId?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_DashboardOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_documents_api_admin_v1_finances_documents_get: {
        parameters: {
            query?: {
                dateFrom?: string | null;
                dateTo?: string | null;
                page?: number;
                perPage?: number;
                status?: components["schemas"]["DocumentStatus"] | null;
                type?: components["schemas"]["DocumentType"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_DocumentOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_document_api_admin_v1_finances_documents_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DocumentCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_DocumentOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_document_api_admin_v1_finances_documents__document_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DocumentPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_DocumentOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_operations_api_admin_v1_finances_export_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
                location?: string | null;
                masterId?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_locations_api_admin_v1_finances_locations_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_str__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_operations_api_admin_v1_finances_operations_get: {
        parameters: {
            query?: {
                cashRegisterId?: string | null;
                category?: string | null;
                dateFrom?: string | null;
                dateTo?: string | null;
                location?: string | null;
                masterId?: string | null;
                page?: number;
                paymentMethodId?: string | null;
                perPage?: number;
                type?: components["schemas"]["OperationType"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_OperationOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_operation_api_admin_v1_finances_operations_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OperationCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_OperationOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_operation_api_admin_v1_finances_operations__operation_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                operation_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OperationPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_OperationOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_payment_methods_api_admin_v1_finances_payment_methods_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_PaymentMethodOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_payment_method_api_admin_v1_finances_payment_methods_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentMethodCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_PaymentMethodOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_payment_method_api_admin_v1_finances_payment_methods__method_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                method_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentMethodPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_PaymentMethodOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_receipts_api_admin_v1_finances_receipts_get: {
        parameters: {
            query?: {
                dateFrom?: string | null;
                dateTo?: string | null;
                location?: string | null;
                masterId?: string | null;
                page?: number;
                perPage?: number;
                status?: components["schemas"]["ReceiptStatus"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_ReceiptOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_receipt_api_admin_v1_finances_receipts_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReceiptCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ReceiptOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    cancel_receipt_api_admin_v1_finances_receipts__receipt_id__cancel_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                receipt_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ReceiptOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_categories_api_admin_v1_inventory_categories_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__api__schemas__Envelope_list_CategoryOut____2"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_category_api_admin_v1_inventory_categories_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CategoryIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_CategoryOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_category_api_admin_v1_inventory_categories__category_id__delete: {
        parameters: {
            query?: {
                mode?: components["schemas"]["CategoryDeleteMode"];
            };
            header?: never;
            path: {
                category_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    rename_category_api_admin_v1_inventory_categories__category_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CategoryIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_CategoryOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_products_api_admin_v1_inventory_export_get: {
        parameters: {
            query?: {
                blocks?: string;
                categoryId?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_products_api_admin_v1_inventory_import_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_import_products_api_admin_v1_inventory_import_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ImportReportOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_products_api_admin_v1_inventory_products_get: {
        parameters: {
            query?: {
                categoryId?: string | null;
                desc?: boolean;
                includeInactive?: boolean;
                page?: number;
                perPage?: number;
                query?: string | null;
                sort?: string;
                stockStatus?: components["schemas"]["StockStatus"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_ProductOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_product_api_admin_v1_inventory_products_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProductCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ProductOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_product_api_admin_v1_inventory_products__product_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ProductOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_product_api_admin_v1_inventory_products__product_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_product_api_admin_v1_inventory_products__product_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProductPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ProductOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_movements_api_admin_v1_inventory_products__product_id__movements_get: {
        parameters: {
            query?: {
                page?: number;
                perPage?: number;
            };
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_MovementOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_movement_api_admin_v1_inventory_products__product_id__movements_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                product_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MovementIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_MovementOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    inventory_summary_api_admin_v1_inventory_summary_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_InventorySummaryOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    master_slots_api_admin_v1_masters__master_id__slots_get: {
        parameters: {
            query: {
                date: string;
                serviceIds: string[];
            };
            header?: never;
            path: {
                master_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_SlotOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_payment_methods_api_admin_v1_payment_methods_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_PaymentMethodRefOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_records_api_admin_v1_records_get: {
        parameters: {
            query?: {
                clientQuery?: string | null;
                createdFrom?: string | null;
                createdTo?: string | null;
                dateFrom?: string | null;
                dateTo?: string | null;
                masterId?: string | null;
                page?: number;
                paymentStatus?: components["schemas"]["PaymentStatus"] | null;
                perPage?: number;
                serviceCategory?: string | null;
                source?: components["schemas"]["RecordSource"] | null;
                status?: components["schemas"]["RecordStatus"] | null;
                withoutMaster?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_RecordOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_record_api_admin_v1_records_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecordCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_RecordOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_record_api_admin_v1_records__record_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                record_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_RecordDetailOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_record_api_admin_v1_records__record_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                record_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecordPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_RecordOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    complete_record_api_admin_v1_records__record_id__complete_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                record_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompleteIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_RecordOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_consumables_api_admin_v1_records__record_id__consumables_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                record_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_ConsumableOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    write_off_consumables_api_admin_v1_records__record_id__consumables_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                record_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConsumablesIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_ConsumableOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    cancel_consumable_api_admin_v1_records__record_id__consumables__movement_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                movement_id: string;
                record_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_ConsumableOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    pay_record_api_admin_v1_records__record_id__payment_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                record_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecordPaymentIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_RecordPaymentOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_status_api_admin_v1_records__record_id__status_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                record_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StatusIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_RecordOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    daily_summary_api_admin_v1_records_daily_summary_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
                masterId?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_DaySummaryOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    clients_report_api_admin_v1_reports_clients_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
                groupBy?: components["schemas"]["GroupBy"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ClientsOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_reports_api_admin_v1_reports_export_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
                groupBy?: components["schemas"]["GroupBy"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    revenue_api_admin_v1_reports_revenue_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
                groupBy?: components["schemas"]["GroupBy"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_RevenueOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    services_report_api_admin_v1_reports_services_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ServicesOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    staff_report_api_admin_v1_reports_staff_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_StaffRowOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    summary_api_admin_v1_reports_summary_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_SummaryOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_reviews_api_admin_v1_reviews_get: {
        parameters: {
            query?: {
                dateFrom?: string | null;
                dateTo?: string | null;
                page?: number;
                perPage?: number;
                rating?: number | null;
                type?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_ReviewOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    schedule_api_admin_v1_schedule_get: {
        parameters: {
            query: {
                dateFrom: string;
                dateTo: string;
                masterId?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_MasterScheduleOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_services_api_admin_v1_services_get: {
        parameters: {
            query?: {
                category?: string | null;
                priceFrom?: number | string | null;
                priceTo?: number | string | null;
                query?: string | null;
                status?: components["schemas"]["ServiceStatus"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_ServiceOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_service_api_admin_v1_services_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ServiceCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ServiceOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    archive_service_api_admin_v1_services__service_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                service_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ServiceOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_service_api_admin_v1_services__service_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                service_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ServicePatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ServiceOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_categories_api_admin_v1_services_categories_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__api__schemas__Envelope_list_CategoryOut____1"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_salon_info_api_admin_v1_settings_salon_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_SalonInfoOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_salon_info_api_admin_v1_settings_salon_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SalonInfoPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_SalonInfoOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_salon_schedule_api_admin_v1_settings_schedule_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_SalonScheduleOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    put_salon_schedule_api_admin_v1_settings_schedule_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SalonScheduleIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_SalonScheduleOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_staff_api_admin_v1_staff_get: {
        parameters: {
            query?: {
                page?: number;
                perPage?: number;
                query?: string | null;
                role?: components["schemas"]["Role"] | null;
                status?: components["schemas"]["StaffStatus"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_list_StaffOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_staff_api_admin_v1_staff_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StaffCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_StaffOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_staff_api_admin_v1_staff__staff_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_StaffOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    fire_staff_api_admin_v1_staff__staff_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_StaffOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_staff_api_admin_v1_staff__staff_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StaffPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_StaffOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_schedule_api_admin_v1_staff__staff_id__schedule_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ScheduleOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    save_schedule_api_admin_v1_staff__staff_id__schedule_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: components["schemas"]["DayScheduleIn"];
                };
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ScheduleOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_exception_api_admin_v1_staff__staff_id__schedule_exceptions_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExceptionIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ExceptionOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_exception_api_admin_v1_staff__staff_id__schedule_exceptions__exception_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                exception_id: string;
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_exception_api_admin_v1_staff__staff_id__schedule_exceptions__exception_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                exception_id: string;
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExceptionPatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ExceptionOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    staff_stats_api_admin_v1_staff__staff_id__stats_get: {
        parameters: {
            query?: {
                dateFrom?: string | null;
                dateTo?: string | null;
            };
            header?: never;
            path: {
                staff_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_StaffStatsOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_staff_api_admin_v1_staff_export_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_file_api_admin_v1_uploads_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_file_api_admin_v1_uploads_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_UploadOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    availability_api_booking__salon_slug__availability_get: {
        parameters: {
            query: {
                master_id?: string | null;
                /** @description YYYY-MM */
                month: string;
                service_id: string;
            };
            header?: never;
            path: {
                salon_slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvailabilityOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_masters_api_booking__salon_slug__masters_get: {
        parameters: {
            query: {
                service_id: string;
            };
            header?: never;
            path: {
                salon_slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MasterOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_booking_api_booking__salon_slug__records_post: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string | null;
            };
            path: {
                salon_slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BookingCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookingOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_review_api_booking__salon_slug__reviews_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                salon_slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewCreatedOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    review_context_api_booking__salon_slug__reviews__token__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                salon_slug: string;
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewContextOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_salon_api_booking__salon_slug__salon_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                salon_slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__api__booking__router__SalonOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_services_api_booking__salon_slug__services_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                salon_slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__api__booking__router__ServiceOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_slots_api_booking__salon_slug__slots_get: {
        parameters: {
            query: {
                date: string;
                master_id?: string | null;
                service_id: string;
            };
            header?: never;
            path: {
                salon_slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__api__booking__router__SlotOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    link_client_telegram_api_bot_clients_link_telegram_post: {
        parameters: {
            query?: never;
            header?: {
                "X-API-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LinkTelegramRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IdentifyOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    identify_api_bot_identify_get: {
        parameters: {
            query: {
                telegram_user_id: number;
            };
            header?: {
                "X-API-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IdentifyOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    link_telegram_api_bot_link_telegram_post: {
        parameters: {
            query?: never;
            header?: {
                "X-API-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LinkTelegramRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IdentifyOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    master_records_api_bot_masters_records_get: {
        parameters: {
            query: {
                day: string;
                telegram_user_id: number;
            };
            header?: {
                "X-API-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__api__bot__router__MasterDayOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_salons_api_bot_salons_get: {
        parameters: {
            query?: never;
            header?: {
                "X-API-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SalonLinkOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    health_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
}
