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
         * @description Выдаёт одноразовый токен сброса (TTL 1 час).
         *
         *     Отправка письма не подключена: токен пишется в лог — при интеграции SMTP
         *     заменить logger на отправку. Ответ всегда 204, чтобы не раскрывать,
         *     существует ли email.
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
        patch?: never;
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
        /** Refresh */
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
        /** Client Visits */
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
         * @description Ручной чек (продажа без записи) — операции создаются на каждую оплату.
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
         * @description Отмена чека: сам чек и связанные операции переводятся в cancelled.
         */
        post: operations["cancel_receipt_api_admin_v1_finances_receipts__receipt_id__cancel_post"];
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
        /** Master Slots */
        get: operations["master_slots_api_admin_v1_masters__master_id__slots_get"];
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
        /** Complete Record */
        post: operations["complete_record_api_admin_v1_records__record_id__complete_post"];
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
        get?: never;
        put?: never;
        post?: never;
        /**
         * Fire Staff
         * @description Увольнение (status=fired). 409, если у мастера есть будущие записи.
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
    "/api/booking/{salon_slug}/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Services */
        get: operations["list_services_api_booking__salon_slug__services_get"];
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
         * @description Привязывает telegram_user_id к клиенту по телефону (шаг онбординга в боте).
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
        /** Body_import_clients_api_admin_v1_clients_import_post */
        Body_import_clients_api_admin_v1_clients_import_post: {
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
            /**
             * Master Id
             * Format: uuid
             */
            master_id: string;
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
            /** Master Name */
            master_name: string;
            /**
             * Record Id
             * Format: uuid
             */
            record_id: string;
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
        /** CategoryAmount */
        CategoryAmount: {
            /** Amount */
            amount: string;
            /** Category */
            category: string;
        };
        /** CategoryOut */
        CategoryOut: {
            /** Category */
            category: string;
            /** Count */
            count: number;
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
            /** Payments */
            payments?: components["schemas"]["PaymentIn"][];
            /** Photourls */
            photoUrls?: string[];
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
        /** Envelope[ClientOut] */
        Envelope_ClientOut_: {
            data: components["schemas"]["ClientOut"];
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
        /** Envelope[list[CategoryOut]] */
        Envelope_list_CategoryOut__: {
            /** Data */
            data: components["schemas"]["CategoryOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[ClientOut]] */
        Envelope_list_ClientOut__: {
            /** Data */
            data: components["schemas"]["ClientOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[DocumentOut]] */
        Envelope_list_DocumentOut__: {
            /** Data */
            data: components["schemas"]["DocumentOut"][];
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
            data: components["schemas"]["SlotOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[StaffOut]] */
        Envelope_list_StaffOut__: {
            /** Data */
            data: components["schemas"]["StaffOut"][];
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
        /** LinkClientRequest */
        LinkClientRequest: {
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
        /** MeOut */
        MeOut: {
            /** Avatarurl */
            avatarUrl: string | null;
            /**
             * Createdat
             * Format: date-time
             */
            createdAt: string;
            /** Email */
            email: string | null;
            /** Firstname */
            firstName: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Lastname */
            lastName: string | null;
            /** Name */
            name: string;
            /** Phone */
            phone: string | null;
            role: components["schemas"]["Role"];
            /** Salons */
            salons: components["schemas"]["SalonOut"][];
        };
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
            /**
             * Masterid
             * Format: uuid
             */
            masterId: string;
            newClient?: components["schemas"]["NewClientIn"] | null;
            /**
             * Serviceid
             * Format: uuid
             */
            serviceId: string;
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
            master: components["schemas"]["MasterRef"];
            paymentStatus: components["schemas"]["PaymentStatus"];
            /** Photos */
            photos: components["schemas"]["PhotoOut"][];
            /** Price */
            price: string;
            service: components["schemas"]["ServiceRef"];
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
            master: components["schemas"]["MasterRef"];
            paymentStatus: components["schemas"]["PaymentStatus"];
            /** Price */
            price: string;
            service: components["schemas"]["ServiceRef"];
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
            /** Serviceid */
            serviceId?: string | null;
            /** Startat */
            startAt?: string | null;
            /** Visitorname */
            visitorName?: string | null;
            /** Visitorphone */
            visitorPhone?: string | null;
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
        /** SalonOut */
        SalonOut: {
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
        /** ServiceRef */
        ServiceRef: {
            /** Category */
            category: string;
            /** Color */
            color: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
        };
        /**
         * ServiceStatus
         * @enum {string}
         */
        ServiceStatus: "active" | "inactive" | "archived";
        /** SlotOut */
        SlotOut: {
            /** Label */
            label: string;
            /**
             * Startat
             * Format: date-time
             */
            startAt: string;
        };
        /** StaffCreateIn */
        StaffCreateIn: {
            /** Additionalphone */
            additionalPhone?: string | null;
            /** Birthdate */
            birthDate?: string | null;
            /** Color */
            color?: string | null;
            /** Commissionpercent */
            commissionPercent?: number | string | null;
            /** Email */
            email?: string | null;
            /** Firstname */
            firstName: string;
            gender?: components["schemas"]["Gender"] | null;
            /** Hiredate */
            hireDate?: string | null;
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
        };
        /** StaffPatchIn */
        StaffPatchIn: {
            /** Additionalphone */
            additionalPhone?: string | null;
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
            /** Firstname */
            firstName?: string | null;
            gender?: components["schemas"]["Gender"] | null;
            /** Hiredate */
            hireDate?: string | null;
            /** Lastname */
            lastName?: string | null;
            /** Middlename */
            middleName?: string | null;
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
            /**
             * Masterid
             * Format: uuid
             */
            masterId: string;
            /** Mastername */
            masterName: string;
            /** Photos */
            photos: string[];
            /**
             * Serviceid
             * Format: uuid
             */
            serviceId: string;
            /** Servicename */
            serviceName: string;
            /**
             * Startat
             * Format: date-time
             */
            startAt: string;
            status: components["schemas"]["RecordStatus"];
            /** Totalamount */
            totalAmount: string;
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
    dashboard_api_admin_v1_finances_dashboard_get: {
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
    list_operations_api_admin_v1_finances_operations_get: {
        parameters: {
            query?: {
                cashRegisterId?: string | null;
                category?: string | null;
                dateFrom?: string | null;
                dateTo?: string | null;
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
    master_slots_api_admin_v1_masters__master_id__slots_get: {
        parameters: {
            query: {
                date: string;
                serviceId: string;
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
                source?: components["schemas"]["RecordSource"] | null;
                status?: components["schemas"]["RecordStatus"] | null;
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
                    "application/json": components["schemas"]["Envelope_list_CategoryOut__"];
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
                "application/json": components["schemas"]["LinkClientRequest"];
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
