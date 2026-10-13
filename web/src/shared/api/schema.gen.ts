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
         * @description ����� ����������� ����� ������ (TTL 1 ���) � ���������� ������ �� �������.
         *
         *     ����� ������ 204, ����� �� ����������, ���������� �� email.
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
         * @description ����� ���� �������. ����, ������ � is_superuser �������������� �� �� �
         *     ���������� � ������ ���� �������� � ���� �� ����� ����� ����� access-������.
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
         * @description Soft-delete: �� ������� ��������� ����-�� ���� �������.
         */
        delete: operations["delete_client_api_admin_v1_clients__client_id__delete"];
        options?: never;
        head?: never;
        /** Patch Client */
        patch: operations["patch_client_api_admin_v1_clients__client_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/clients/{client_id}/account": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Account */
        get: operations["get_account_api_admin_v1_clients__client_id__account_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients/{client_id}/account/adjustments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Adjust Account
         * @description ������ ������������� ��������� ������� � ����� ������ � ������ ���������.
         */
        post: operations["adjust_account_api_admin_v1_clients__client_id__account_adjustments_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients/{client_id}/account/refunds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refund
         * @description ������� �������� ������� � �� ������ �������������� �������; ����� �� �������������.
         */
        post: operations["refund_api_admin_v1_clients__client_id__account_refunds_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients/{client_id}/account/topups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Topup
         * @description ���������� (������� ��� ��������� �����). ���� � ����� �� �������������.
         */
        post: operations["topup_api_admin_v1_clients__client_id__account_topups_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients/{client_id}/account/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Account Transactions */
        get: operations["get_account_transactions_api_admin_v1_clients__client_id__account_transactions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/clients/{client_id}/loyalty-cards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Client Cards */
        get: operations["client_cards_api_admin_v1_clients__client_id__loyalty_cards_get"];
        put?: never;
        /** Issue Card */
        post: operations["issue_card_api_admin_v1_clients__client_id__loyalty_cards_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
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
         * @description ������� ������� ������� � ������ (������� � ������ �� ����� ��������).
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
         * @description Excel-�������� ���������� ���� (+ ������ � ������� ������).
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
         * @description ������ �� Excel. ������� �����: ��� | ������� | ������� | Email.
         *
         *     ������ ���������������� ���������: ������������ � �����������, ����� �
         *     ��������. ������ ������ ��������� ���������� � ������������.
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
    "/api/admin/v1/finances/client-balances": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Client Balances
         * @description ������ ������� �� ���� ����: ����� ��������� � ������, ������ ��������� ��������.
         *
         *     �������� ������� ���� ������: ���� ��� �������� ������� �����������.
         */
        get: operations["client_balances_api_admin_v1_finances_client_balances_get"];
        put?: never;
        post?: never;
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
    "/api/admin/v1/finances/expense-categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Expense Categories */
        get: operations["list_expense_categories_api_admin_v1_finances_expense_categories_get"];
        put?: never;
        /** Create Expense Category */
        post: operations["create_expense_category_api_admin_v1_finances_expense_categories_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/expense-categories/{category_id}": {
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
         * Delete Expense Category
         * @description �������� ������� ��������� �� ������; ���������� ������� ��������� � ��������.
         */
        delete: operations["delete_expense_category_api_admin_v1_finances_expense_categories__category_id__delete"];
        options?: never;
        head?: never;
        /**
         * Rename Expense Category
         * @description �������������� ������������ ��������� � ��� ���������� ��������.
         */
        patch: operations["rename_expense_category_api_admin_v1_finances_expense_categories__category_id__patch"];
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
         * @description Excel-����� �� ��������� �� ������.
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
         * @description ������� �������� ���� � ��� ������� ���������.
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
         * @description ���: ������� ��� ������ ��� (� recordId) ������ ������. �������� � �� ������ ������.
         *
         *     ������� � ��� � ������ ������, ������� ��������� ������� (����� clientId).
         *     ������ � ��� �� Idempotency-Key ���������� ��� �� ���.
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
         * @description ������ ����: ��� � ��������� �������� � cancelled; ������ ���� ����� �� ��������.
         */
        post: operations["cancel_receipt_api_admin_v1_finances_receipts__receipt_id__cancel_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/finances/receipts/checkout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sale Checkout
         * @description ������������ ������� ��� ������: subtotal � ��������, ������ � ����������.
         */
        get: operations["sale_checkout_api_admin_v1_finances_receipts_checkout_get"];
        put?: never;
        post?: never;
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
         * @description �������� ���������. ������ ����������� � ���� ������𳿻; ���
         *     mode=delete_products ��� ��� � ��������� (����� � ������� �������� �������).
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
         * @description Excel-�������� ������; blocks � ����� ������� �� main, stock, finance, description.
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
         * @description ������ �� Excel: ������ ������ � ��������� (IMPORT_COLUMNS, ������� �����).
         *
         *     ����� ������ �� ��������: ����� � ��������, ������������ � �����������;
         *     ������� ������� ����������� ������������. ����������� ��������� ��������.
         *     �������� ������������; ������� ������ ������� � ������ ������, ������
         *     ������������; ������ ������ � ������������� ������ �������� �� �������.
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
         * @description ������ �������. ������� � ������ �������� � ������ ��������, �������, �������.
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
         * @description ������ ��������: �� ����� ��������� ������� ��������.
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
    "/api/admin/v1/loyalty-cards/{card_id}": {
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
         * Delete Card
         * @description ��������: ������ �������; ����� ����� �������� � ����, ������� ���� ���������.
         */
        delete: operations["delete_card_api_admin_v1_loyalty_cards__card_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/loyalty-cards/{card_id}/cashback-adjustments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Adjust Cashback
         * @description ������ ������������� ������� � ����� ������ � ������ ���������, ����������� ����������.
         */
        post: operations["adjust_cashback_api_admin_v1_loyalty_cards__card_id__cashback_adjustments_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/loyalty-cards/{card_id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Card Transactions
         * @description ������� ������-������� �����.
         */
        get: operations["card_transactions_api_admin_v1_loyalty_cards__card_id__transactions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/loyalty-cards/{card_id}/visits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Card Visits
         * @description ����� ������� �� ����� �� ���� ������� ����, ���������� � � reversedAt.
         */
        get: operations["card_visits_api_admin_v1_loyalty_cards__card_id__visits_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/loyalty-cards/generate-number": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Generate Number
         * @description ��������� ����� ��� ����� ������; ��������� ������������ ����������� ��� ������.
         */
        get: operations["generate_number_api_admin_v1_loyalty_cards_generate_number_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/loyalty/card-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Card Types */
        get: operations["list_card_types_api_admin_v1_loyalty_card_types_get"];
        put?: never;
        /** Create Card Type */
        post: operations["create_card_type_api_admin_v1_loyalty_card_types_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/loyalty/card-types/{type_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Card Type */
        get: operations["get_card_type_api_admin_v1_loyalty_card_types__type_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Patch Card Type
         * @description ����� �������� � ������ ����������� � ��������� �����; ����������� �� ���������������.
         */
        patch: operations["patch_card_type_api_admin_v1_loyalty_card_types__type_id__patch"];
        trace?: never;
    };
    "/api/admin/v1/loyalty/card-types/{type_id}/bonus-rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Bonus Rules */
        get: operations["list_bonus_rules_api_admin_v1_loyalty_card_types__type_id__bonus_rules_get"];
        put?: never;
        /** Create Bonus Rule */
        post: operations["create_bonus_rule_api_admin_v1_loyalty_card_types__type_id__bonus_rules_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/loyalty/card-types/{type_id}/bonus-rules/{rule_id}": {
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
         * Delete Bonus Rule
         * @description ������� ����� ������ ���������������� �������; �� ��������������� � isActive=false.
         */
        delete: operations["delete_bonus_rule_api_admin_v1_loyalty_card_types__type_id__bonus_rules__rule_id__delete"];
        options?: never;
        head?: never;
        /**
         * Patch Bonus Rule
         * @description ����� N ��������� �� ��������� �������; ����������� �� ���������������.
         */
        patch: operations["patch_bonus_rule_api_admin_v1_loyalty_card_types__type_id__bonus_rules__rule_id__patch"];
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
         * @description ��������� ����� ������� �� ���� ��� ����� ����� (������������ � �����).
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
         * @description ������� ������ ��� ����� ������ ������ (�������������).
         *
         *     ������ ��, ����� ������� ������ ������: ������ �������, � ���� ����
         *     ����� � ��� �� ���������; ��������� ��������� ������� � ������� � ���
         *     �����. ���������� ��������� � � /finances/payment-methods.
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
    "/api/admin/v1/records/{record_id}/checkout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Record Checkout
         * @description ������������ ������ ������: ����� � �������, �������� ������, ������, ����, �������.
         *
         *     bonusRecordServiceIds � ������, ���������� �����������: ���� ��������� � ����.
         */
        get: operations["record_checkout_api_admin_v1_records__record_id__checkout_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
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
         * @description ���������� ������ � ��� ������: ������ �������� completed + unpaid.
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
         * @description �������� ����������� �� ������ (������ � �� ����� ������, ������������� � �� �����).
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
         * @description ������ ���������� ��������: �������� �������� ������������� � record_id.
         *
         *     �������� �������� �� ���������. ����� �� ����� ������, � ��� �����
         *     �����������, ���������� � � �������� ������� (������ ������� ����� ������).
         *     ����� � ���������� ������ ����������� ������.
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
         * @description ������ ������������ ������: ��� � recordId �� ������ ����� (�������������).
         *
         *     ����� ��������� ������� ����������� �� ����� �������, ��� �������� � � ����.
         *     ������ � ��� �� Idempotency-Key ���������� ��� �� ���.
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
         * @description ����� � ������������ ������� �� ���� � ��� �̳����� � ����-���������.
         *
         *     ���������� �� ���������, ��� ������� � ��������� (����� ������� ���� ������).
         *     ������ ��������� � ��� ������ ������.
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
         * @description ��� ������ ����� ������; �������������� � ��� �������� ������� � ����� �������.
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
         * @description ������� ����� �������� �� ���� (���� ������������) � ����� ��������.
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
         * @description ������������� ������ �������� � �� ������ ��������� ������.
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
        /** Create Category */
        post: operations["create_category_api_admin_v1_services_categories_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/services/categories/{category_id}": {
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
         * @description ��������: ��� ������ ��������� (������� ��������) ��������� � �����.
         */
        delete: operations["delete_category_api_admin_v1_services_categories__category_id__delete"];
        options?: never;
        head?: never;
        /** Rename Category */
        patch: operations["rename_category_api_admin_v1_services_categories__category_id__patch"];
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
         * @description ���� ������ �������: ��� ���� ���� ������.
         *
         *     ������� ����� ����������� ���������� �� ����� �����, ����� ����, � �������
         *     �� ���������� ����� ���� ������ (backend/docs/shifts.md).
         */
        put: operations["put_salon_schedule_api_admin_v1_settings_schedule_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/shifts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Shift Grid
         * @description ����� �������: �������, ����� ��������������; ������� � ������ ��� ������.
         */
        get: operations["shift_grid_api_admin_v1_shifts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/shifts/{staffId}/{date}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Put Shift */
        put: operations["put_shift_api_admin_v1_shifts__staffId___date__put"];
        post?: never;
        /**
         * Delete Shift
         * @description ������ ����� ��� ������� (���� ���������� ��������).
         */
        delete: operations["delete_shift_api_admin_v1_shifts__staffId___date__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/shifts/fill": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Fill Shifts
         * @description ��������� ����� ��� ������� �� ������ ��� ���������� �����������.
         */
        post: operations["fill_shifts_api_admin_v1_shifts_fill_post"];
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
         * @description ���������� �� ������. 409, ���� � ������� ���� ������� ������.
         */
        delete: operations["fire_staff_api_admin_v1_staff__staff_id__delete"];
        options?: never;
        head?: never;
        /** Patch Staff */
        patch: operations["patch_staff_api_admin_v1_staff__staff_id__patch"];
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
         * @description Excel-�������� ����������� ������ (���������).
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
         * @description ����� �� ������������ review_token �� ����������� � ����������� ������.
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
         * @description ������ ������ �� ������ �� ������; �������������� ��� ����� ����� � 404.
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
         * @description �������� ������ ��� ����� ������: �������� � ������ (��� ������������ ��������).
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
         * @description �������� ������, ������� ��������� ���� �� ���� ������.
         *
         *     �������: �� �������� ��������� (���������� �������, ����� � ���������),
         *     ������ � �� �������� ������.
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
    "/api/booking/salons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Salons
         * @description �������� ������ ����, �� �������� (���������� �������).
         */
        get: operations["list_salons_api_booking_salons_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bot/clients/by-telegram/{tg_user_id}/loyalty": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Client Loyalty
         * @description ������ �����, �����, ������ � ������� ������� � ������ ��������. 404 � ������� ���.
         */
        get: operations["client_loyalty_api_bot_clients_by_telegram__tg_user_id__loyalty_get"];
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
         * @description ��������: ����������� POST /api/bot/link-telegram.
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
         * @description ����������, ��� ����� ����, �� telegram_user_id (������ Master DB).
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
         * @description ����������� Telegram �� �������� �� �������� (��� ���������, ��� ������� ����).
         *
         *     ������������� ��� ���������� � �������������, ������, ������: ������,
         *     ������� ��� ������������ ��� ������, �������� � ����������� �������, �
         *     �����������. ����� � ��� � /identify (������� ����).
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
         * @description ������ ������� �� ���� (�� �����) �� ���� ��� �������, ����� ����������.
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
         * @description �������� ������ �� �������� �� ���� ������ � ��� ���� ���� ��������.
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
        /** AccountOut */
        AccountOut: {
            /** Balance */
            balance: string;
            /**
             * Clientid
             * Format: uuid
             */
            clientId: string;
        };
        /** AdjustmentIn */
        AdjustmentIn: {
            /** Amount */
            amount: number | string;
            /** Comment */
            comment: string;
        };
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
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Issystem */
            isSystem: boolean;
            /** Name */
            name: string;
            /** Servicescount */
            servicesCount: number;
        };
        /** ServiceOut */
        app__api__admin__services__ServiceOut: {
            category: components["schemas"]["CategoryRef"];
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
            /**
             * Category Id
             * Format: uuid
             */
            category_id: string;
            /** Category Name */
            category_name: string;
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
        /** Envelope[CategoryOut] */
        app__api__schemas__Envelope_CategoryOut___1: {
            data: components["schemas"]["app__api__admin__services__CategoryOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[CategoryOut] */
        app__api__schemas__Envelope_CategoryOut___2: {
            data: components["schemas"]["app__api__admin__inventory__CategoryOut"];
            meta?: components["schemas"]["PageMeta"] | null;
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
        /** BonusProgressOut */
        BonusProgressOut: {
            /** Accruedtotal */
            accruedTotal: number;
            /** Available */
            available: number;
            /** Everyn */
            everyN: number;
            /** Isactive */
            isActive: boolean;
            /** Name */
            name: string;
            /** Progress */
            progress: number;
            /**
             * Ruleid
             * Format: uuid
             */
            ruleId: string;
            /** Usedtotal */
            usedTotal: number;
        };
        /** BonusRuleIn */
        BonusRuleIn: {
            /** Everyn */
            everyN: number;
            /**
             * Isactive
             * @default true
             */
            isActive: boolean;
            /** Name */
            name: string;
            /** Services */
            services: components["schemas"]["RuleServiceRef"][];
        };
        /** BonusRuleOut */
        BonusRuleOut: {
            /**
             * Cardtypeid
             * Format: uuid
             */
            cardTypeId: string;
            /** Everyn */
            everyN: number;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Isactive */
            isActive: boolean;
            /** Name */
            name: string;
            /** Services */
            services: components["schemas"]["RuleServiceRef"][];
        };
        /** BonusRulePatchIn */
        BonusRulePatchIn: {
            /** Everyn */
            everyN?: number | null;
            /** Isactive */
            isActive?: boolean | null;
            /** Name */
            name?: string | null;
            /** Services */
            services?: components["schemas"]["RuleServiceRef"][] | null;
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
        /** CardIssueIn */
        CardIssueIn: {
            /**
             * Cardtypeid
             * Format: uuid
             */
            cardTypeId: string;
            /** Number */
            number?: string | null;
        };
        /**
         * CardStatus
         * @enum {string}
         */
        CardStatus: "active" | "deleted";
        /** CardTypeBrief */
        CardTypeBrief: {
            /** Cashbackmaxpaymentpercent */
            cashbackMaxPaymentPercent: string;
            /** Cashbackpercent */
            cashbackPercent: string;
            /** Cashbackttldays */
            cashbackTtlDays: number | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            levelBasis: components["schemas"]["LevelBasis"];
            /** Name */
            name: string;
        };
        /** CardTypeIn */
        CardTypeIn: {
            /**
             * Cashbackmaxpaymentpercent
             * @default 100
             */
            cashbackMaxPaymentPercent: number | string;
            /**
             * Cashbackonproducts
             * @default true
             */
            cashbackOnProducts: boolean;
            /**
             * Cashbackonservices
             * @default true
             */
            cashbackOnServices: boolean;
            /**
             * Cashbackpercent
             * @default 0
             */
            cashbackPercent: number | string;
            /** Cashbackttldays */
            cashbackTtlDays?: number | null;
            /**
             * Isactive
             * @default true
             */
            isActive: boolean;
            /** @default sold_amount */
            levelBasis: components["schemas"]["LevelBasis"];
            /** Levels */
            levels?: components["schemas"]["LevelIn"][];
            /** Name */
            name: string;
            /** Salonids */
            salonIds?: string[];
        };
        /** CardTypeOut */
        CardTypeOut: {
            /** Cashbackmaxpaymentpercent */
            cashbackMaxPaymentPercent: string;
            /** Cashbackonproducts */
            cashbackOnProducts: boolean;
            /** Cashbackonservices */
            cashbackOnServices: boolean;
            /** Cashbackpercent */
            cashbackPercent: string;
            /** Cashbackttldays */
            cashbackTtlDays: number | null;
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
            /** Isactive */
            isActive: boolean;
            levelBasis: components["schemas"]["LevelBasis"];
            /** Levels */
            levels: components["schemas"]["LevelOut"][];
            /** Name */
            name: string;
            /** Salons */
            salons: components["schemas"]["PersonRef"][];
            /**
             * Updatedat
             * Format: date-time
             */
            updatedAt: string;
        };
        /** CardTypePatchIn */
        CardTypePatchIn: {
            /** Cashbackmaxpaymentpercent */
            cashbackMaxPaymentPercent?: number | string | null;
            /** Cashbackonproducts */
            cashbackOnProducts?: boolean | null;
            /** Cashbackonservices */
            cashbackOnServices?: boolean | null;
            /** Cashbackpercent */
            cashbackPercent?: number | string | null;
            /** Cashbackttldays */
            cashbackTtlDays?: number | null;
            /** Isactive */
            isActive?: boolean | null;
            levelBasis?: components["schemas"]["LevelBasis"] | null;
            /** Levels */
            levels?: components["schemas"]["LevelIn"][] | null;
            /** Name */
            name?: string | null;
            /** Salonids */
            salonIds?: string[] | null;
        };
        /** CardVisitOut */
        CardVisitOut: {
            /** Cashbackbase */
            cashbackBase: string;
            /** Discountamount */
            discountAmount: string;
            /**
             * Happenedat
             * Format: date-time
             */
            happenedAt: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Isvisit */
            isVisit: boolean;
            /** Paidamount */
            paidAmount: string;
            /**
             * Receiptid
             * Format: uuid
             */
            receiptId: string;
            /** Recordid */
            recordId: string | null;
            /** Reversedat */
            reversedAt: string | null;
            salon: components["schemas"]["PersonRef"];
            /** Soldamount */
            soldAmount: string;
        };
        /** CashbackAdjustmentIn */
        CashbackAdjustmentIn: {
            /** Amount */
            amount: number | string;
            /** Comment */
            comment: string;
        };
        /** CashbackOut */
        CashbackOut: {
            /** Balance */
            balance: string;
            /** Maxpayment */
            maxPayment: string;
            /** Percent */
            percent: string;
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
         * @description ������ �� ������������� � ������ ����������. �������� ��� � isActive=false.
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
        /** CategoryRef */
        CategoryRef: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
        };
        /** CategoryRowOut */
        CategoryRowOut: {
            category: components["schemas"]["CategoryRef"];
            /** Count */
            count: number;
            /** Revenue */
            revenue: string | null;
        };
        /** CheckoutCardOut */
        CheckoutCardOut: {
            /** Cardtypename */
            cardTypeName: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            level: components["schemas"]["CheckoutLevelOut"] | null;
            /** Number */
            number: string;
        };
        /** CheckoutLevelOut */
        CheckoutLevelOut: {
            /** Discountfixed */
            discountFixed: string;
            /** Discountpercent */
            discountPercent: string;
            /** Name */
            name: string | null;
            /** Threshold */
            threshold: string;
        };
        /** CheckoutLineOut */
        CheckoutLineOut: {
            /** Amount */
            amount: string;
            /**
             * Bonusavailable
             * @default false
             */
            bonusAvailable: boolean;
            /** Bonusrulename */
            bonusRuleName?: string | null;
            /** Isbonus */
            isBonus: boolean;
            /** Kind */
            kind: string;
            /** Name */
            name: string;
            /** Price */
            price: string;
            /** Recordserviceid */
            recordServiceId: string | null;
            /** Serviceid */
            serviceId: string | null;
        };
        /** CheckoutOut */
        CheckoutOut: {
            /** Accountbalance */
            accountBalance: string;
            /** Bonusamount */
            bonusAmount: string;
            card: components["schemas"]["CheckoutCardOut"] | null;
            cashback: components["schemas"]["CashbackOut"] | null;
            /** Clientid */
            clientId: string | null;
            /** Discountamount */
            discountAmount: string;
            /** Discounts */
            discounts: components["schemas"]["DiscountCandidateOut"][];
            discountSource: components["schemas"]["DiscountSource"];
            /** Lines */
            lines: components["schemas"]["CheckoutLineOut"][];
            /** Sold */
            sold: string;
            /** Total */
            total: string;
        };
        /** ClientBalanceItem */
        ClientBalanceItem: {
            /** Balance */
            balance: string;
            /**
             * Clientid
             * Format: uuid
             */
            clientId: string;
            /** Isactive */
            isActive: boolean;
            /** Name */
            name: string;
            /** Phone */
            phone: string;
        };
        /** ClientBalancesOut */
        ClientBalancesOut: {
            /** Debtorscount */
            debtorsCount: number;
            /** Depositorscount */
            depositorsCount: number;
            /** Items */
            items: components["schemas"]["ClientBalanceItem"][];
            /** Totaldebts */
            totalDebts: string;
            /** Totaldeposits */
            totalDeposits: string;
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
        /** ClientLoyaltyOut */
        ClientLoyaltyOut: {
            /** Account Balance */
            account_balance: string;
            card: components["schemas"]["LoyaltyCardInfo"] | null;
            /** Client Name */
            client_name: string;
        };
        /** ClientOut */
        ClientOut: {
            /**
             * Accountbalance
             * @default 0
             */
            accountBalance: string;
            /** Additionalphone */
            additionalPhone: string | null;
            /** Birthdate */
            birthDate: string | null;
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
            /** Loyaltycardnumber */
            loyaltyCardNumber?: string | null;
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
        /** CopyIn */
        CopyIn: {
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
        };
        /** CycleIn */
        CycleIn: {
            /** Offdays */
            offDays: number;
            shift: components["schemas"]["ShiftTimesIn"];
            /** Startdate */
            startDate?: string | null;
            /** Workdays */
            workDays: number;
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
            type: components["schemas"]["ShiftKind"];
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
        /** DiscountCandidateOut */
        DiscountCandidateOut: {
            /** Amount */
            amount: string;
            /** Percent */
            percent: string | null;
            /** Selected */
            selected: boolean;
            source: components["schemas"]["DiscountSource"];
        };
        /**
         * DiscountSource
         * @description �������� ����������� ������: ����, ���������� � ������� (loyalty-accounts.md, ������ 6).
         * @enum {string}
         */
        DiscountSource: "none" | "client" | "card_percent" | "card_fixed";
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
        /** Envelope[AccountOut] */
        Envelope_AccountOut_: {
            data: components["schemas"]["AccountOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[BonusRuleOut] */
        Envelope_BonusRuleOut_: {
            data: components["schemas"]["BonusRuleOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[CardTypeOut] */
        Envelope_CardTypeOut_: {
            data: components["schemas"]["CardTypeOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[CashRegisterOut] */
        Envelope_CashRegisterOut_: {
            data: components["schemas"]["CashRegisterOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[CheckoutOut] */
        Envelope_CheckoutOut_: {
            data: components["schemas"]["CheckoutOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ClientBalancesOut] */
        Envelope_ClientBalancesOut_: {
            data: components["schemas"]["ClientBalancesOut"];
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
        /** Envelope[ExpenseCategoryOut] */
        Envelope_ExpenseCategoryOut_: {
            data: components["schemas"]["ExpenseCategoryOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[FillReportOut] */
        Envelope_FillReportOut_: {
            data: components["schemas"]["FillReportOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[GeneratedNumberOut] */
        Envelope_GeneratedNumberOut_: {
            data: components["schemas"]["GeneratedNumberOut"];
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
        /** Envelope[list[BonusRuleOut]] */
        Envelope_list_BonusRuleOut__: {
            /** Data */
            data: components["schemas"]["BonusRuleOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[CardTypeOut]] */
        Envelope_list_CardTypeOut__: {
            /** Data */
            data: components["schemas"]["CardTypeOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[CardVisitOut]] */
        Envelope_list_CardVisitOut__: {
            /** Data */
            data: components["schemas"]["CardVisitOut"][];
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
        /** Envelope[list[ExpenseCategoryOut]] */
        Envelope_list_ExpenseCategoryOut__: {
            /** Data */
            data: components["schemas"]["ExpenseCategoryOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[LoyaltyCardOut]] */
        Envelope_list_LoyaltyCardOut__: {
            /** Data */
            data: components["schemas"]["LoyaltyCardOut"][];
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
        /** Envelope[list[TransactionOut]] */
        Envelope_list_TransactionOut__: {
            /** Data */
            data: components["schemas"]["TransactionOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[list[VisitOut]] */
        Envelope_list_VisitOut__: {
            /** Data */
            data: components["schemas"]["VisitOut"][];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[LoyaltyCardOut] */
        Envelope_LoyaltyCardOut_: {
            data: components["schemas"]["LoyaltyCardOut"];
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
        /** Envelope[SalonSchedulePutOut] */
        Envelope_SalonSchedulePutOut_: {
            data: components["schemas"]["SalonSchedulePutOut"];
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
        /** Envelope[ShiftCellOut] */
        Envelope_ShiftCellOut_: {
            data: components["schemas"]["ShiftCellOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[ShiftGridOut] */
        Envelope_ShiftGridOut_: {
            data: components["schemas"]["ShiftGridOut"];
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
        /** Envelope[TransactionOut] */
        Envelope_TransactionOut_: {
            data: components["schemas"]["TransactionOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** Envelope[UploadOut] */
        Envelope_UploadOut_: {
            data: components["schemas"]["UploadOut"];
            meta?: components["schemas"]["PageMeta"] | null;
        };
        /** ExpenseCategoryIn */
        ExpenseCategoryIn: {
            /** Name */
            name: string;
        };
        /** ExpenseCategoryOut */
        ExpenseCategoryOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
        };
        /** FillIn */
        FillIn: {
            copyFrom?: components["schemas"]["CopyIn"] | null;
            cycle?: components["schemas"]["CycleIn"] | null;
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
            mark?: components["schemas"]["MarkIn"] | null;
            /**
             * Mode
             * @enum {string}
             */
            mode: "weekdays" | "cycle" | "copy" | "mark";
            /**
             * Overwrite
             * @default false
             */
            overwrite: boolean;
            /** Staffids */
            staffIds: string[];
            /** Weekdays */
            weekdays?: {
                [key: string]: components["schemas"]["ShiftTimesIn"] | null;
            } | null;
        };
        /** FillReportOut */
        FillReportOut: {
            /** Created */
            created: number;
            /** Removed */
            removed: number;
            /** Skipped */
            skipped: components["schemas"]["SkippedOut"][];
            /** Updated */
            updated: number;
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
        /** GeneratedNumberOut */
        GeneratedNumberOut: {
            /** Number */
            number: string;
        };
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
        /**
         * LevelBasis
         * @enum {string}
         */
        LevelBasis: "sold_amount" | "visits";
        /** LevelIn */
        LevelIn: {
            /**
             * Discountfixed
             * @default 0
             */
            discountFixed: number | string;
            /**
             * Discountpercent
             * @default 0
             */
            discountPercent: number | string;
            /** Name */
            name?: string | null;
            /** Threshold */
            threshold: number | string;
        };
        /** LevelOut */
        LevelOut: {
            /** Discountfixed */
            discountFixed: string;
            /** Discountpercent */
            discountPercent: string;
            /** Name */
            name: string | null;
            /** Threshold */
            threshold: string;
        };
        /** LevelRef */
        LevelRef: {
            /** Discountfixed */
            discountFixed: string;
            /** Discountpercent */
            discountPercent: string;
            /** Name */
            name: string | null;
            /** Threshold */
            threshold: string;
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
        /** LoyaltyCardInfo */
        LoyaltyCardInfo: {
            /** Card Type */
            card_type: string;
            /** Cashback */
            cashback: string;
            /** Discount Fixed */
            discount_fixed: string;
            /** Discount Percent */
            discount_percent: string;
            /** Level Name */
            level_name: string | null;
            /** Number */
            number: string;
        };
        /** LoyaltyCardOut */
        LoyaltyCardOut: {
            /** Applieshere */
            appliesHere: boolean;
            /**
             * Bonusaccrued
             * @default 0
             */
            bonusAccrued: number;
            /**
             * Bonusavailable
             * @default 0
             */
            bonusAvailable: number;
            /** Bonusprogress */
            bonusProgress?: components["schemas"]["BonusProgressOut"][];
            cardType: components["schemas"]["CardTypeBrief"];
            /** Cashbackbalance */
            cashbackBalance: string;
            /**
             * Clientid
             * Format: uuid
             */
            clientId: string;
            /** Deletedat */
            deletedAt: string | null;
            deletedBy: components["schemas"]["PersonRef"] | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Issuedat
             * Format: date-time
             */
            issuedAt: string;
            issuedBy: components["schemas"]["PersonRef"];
            issuedSalon: components["schemas"]["PersonRef"] | null;
            level: components["schemas"]["LevelRef"] | null;
            /** Maxdiscountfixed */
            maxDiscountFixed: string;
            /** Maxdiscountpercent */
            maxDiscountPercent: string;
            nextLevel: components["schemas"]["NextLevelRef"] | null;
            /** Number */
            number: string;
            /** Paidtotal */
            paidTotal: string;
            /** Soldtotal */
            soldTotal: string;
            status: components["schemas"]["CardStatus"];
            /** Visitscount */
            visitsCount: number;
        };
        /** MarkIn */
        MarkIn: {
            /** Comment */
            comment?: string | null;
            /**
             * Kind
             * @enum {string}
             */
            kind: "vacation" | "sick";
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
         * @description ���� ��������. ���, ���������, ����� � ������ ������ �������������.
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
        /** NextLevelRef */
        NextLevelRef: {
            /** Name */
            name: string | null;
            /** Remaining */
            remaining: string;
            /** Threshold */
            threshold: string;
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
            /** Targetcashregisterid */
            targetCashRegisterId?: string | null;
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
            targetCashRegister: components["schemas"]["PersonRef"] | null;
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
            /** Issystem */
            isSystem: boolean;
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
        PaymentMethodType: "cash" | "card" | "online" | "certificate" | "bonus" | "account" | "tips" | "other";
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
         * @description �������� ������ �� �������� � �������: {id, name}.
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
            /** Barcode */
            barcode?: string | null;
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
            /** Barcode */
            barcode?: string | null;
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
         * @description ������� ����� �� �������� � ������ ����������.
         */
        ProductPatchIn: {
            /** Barcode */
            barcode?: string | null;
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
            /** Bonusrecordserviceids */
            bonusRecordServiceIds?: string[];
            /** Clientid */
            clientId?: string | null;
            /** Clientname */
            clientName?: string | null;
            /** Date */
            date?: string | null;
            /** Expectedtotal */
            expectedTotal?: number | string | null;
            /** Payments */
            payments?: components["schemas"]["ReceiptPaymentIn"][];
            /** Recordid */
            recordId?: string | null;
            /** @default web */
            source: components["schemas"]["ReceiptSource"];
            /** Subtotal */
            subtotal?: number | string | null;
        };
        /** ReceiptOut */
        ReceiptOut: {
            /** Amount */
            amount: string;
            author: components["schemas"]["PersonRef"];
            cashRegister: components["schemas"]["PersonRef"] | null;
            client: components["schemas"]["PersonRef"] | null;
            /**
             * Date
             * Format: date-time
             */
            date: string;
            /** Discountamount */
            discountAmount: string;
            discountSource: components["schemas"]["DiscountSource"];
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Loyaltycardid */
            loyaltyCardId: string | null;
            /** Number */
            number: string;
            /** Payments */
            payments: components["schemas"]["ReceiptPaymentOut"][];
            /** Recordid */
            recordId: string | null;
            source: components["schemas"]["ReceiptSource"];
            status: components["schemas"]["ReceiptStatus"];
            /** Subtotal */
            subtotal: string;
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
            /** Endat */
            endAt?: string | null;
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
            /** Discountamount */
            discountAmount: string;
            discountSource: components["schemas"]["DiscountSource"];
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
            /** Outsideshift */
            outsideShift: boolean;
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
            /** Discountamount */
            discountAmount: string;
            discountSource: components["schemas"]["DiscountSource"];
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
            /** Outsideshift */
            outsideShift: boolean;
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
            /** Endat */
            endAt?: string | null;
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
            /** Bonusrecordserviceids */
            bonusRecordServiceIds?: string[];
            /** Expectedtotal */
            expectedTotal?: number | string | null;
            /** Payments */
            payments?: components["schemas"]["PaymentIn"][];
        };
        /** RecordPaymentOut */
        RecordPaymentOut: {
            receipt: components["schemas"]["ReceiptRef"];
            record: components["schemas"]["RecordOut"];
        };
        /**
         * RecordServiceOut
         * @description ������ � ������: ������� ��������/����/������������ + ������� ��������� � ����.
         */
        RecordServiceOut: {
            category?: components["schemas"]["CategoryRef"] | null;
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
        /** RefundIn */
        RefundIn: {
            /** Amount */
            amount: number | string;
            /** Comment */
            comment?: string | null;
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
         * @description ��� �������� �� ����� ������: � ���� � ����� ��� �����.
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
        /** RuleServiceRef */
        RuleServiceRef: {
            /**
             * Salonid
             * Format: uuid
             */
            salonId: string;
            /**
             * Serviceid
             * Format: uuid
             */
            serviceId: string;
        };
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
        /** SalonDayHoursOut */
        SalonDayHoursOut: {
            /** Close */
            close: string | null;
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Open */
            open: string | null;
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
         * @description ���������� ������ ���������� ����; null � �������� (����� name).
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
        /** SalonListItemOut */
        SalonListItemOut: {
            /** Name */
            name: string;
            /** Slug */
            slug: string;
        };
        /**
         * SalonProfileOut
         * @description ������� ������ � ������� ������ (��������� X-Salon-Id). ���� ����� ����� ������.
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
        /** SalonSchedulePutOut */
        SalonSchedulePutOut: {
            /** Configured */
            configured: boolean;
            shifts: components["schemas"]["ShiftTrimOut"];
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
        /** ServiceCreateIn */
        ServiceCreateIn: {
            /** Categoryid */
            categoryId?: string | null;
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
            /** Categoryid */
            categoryId?: string | null;
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
            category: components["schemas"]["CategoryRef"];
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
        /** ShiftCellOut */
        ShiftCellOut: {
            /** Breakend */
            breakEnd?: string | null;
            /** Breakstart */
            breakStart?: string | null;
            /** Comment */
            comment?: string | null;
            /**
             * Date
             * Format: date
             */
            date: string;
            /** End */
            end?: string | null;
            kind: components["schemas"]["ShiftKind"] | null;
            /**
             * Recordscount
             * @default 0
             */
            recordsCount: number;
            /** Start */
            start?: string | null;
        };
        /** ShiftConflictOut */
        ShiftConflictOut: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Records */
            records: components["schemas"]["ShiftConflictRecordOut"][];
            /**
             * Staffid
             * Format: uuid
             */
            staffId: string;
            /** Staffname */
            staffName: string | null;
        };
        /** ShiftConflictRecordOut */
        ShiftConflictRecordOut: {
            /** Clientname */
            clientName: string;
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
            /**
             * Startat
             * Format: date-time
             */
            startAt: string;
        };
        /** ShiftGridOut */
        ShiftGridOut: {
            /** Days */
            days: components["schemas"]["SalonDayHoursOut"][];
            /** Salonscheduleconfigured */
            salonScheduleConfigured: boolean;
            /** Staff */
            staff: components["schemas"]["StaffShiftsOut"][];
        };
        /**
         * ShiftIn
         * @description ����� (`kind: shift` + �����) ��� ������� (`vacation` / `sick`).
         */
        ShiftIn: {
            /** Breakend */
            breakEnd?: string | null;
            /** Breakstart */
            breakStart?: string | null;
            /** Comment */
            comment?: string | null;
            /** End */
            end?: string | null;
            /** @default shift */
            kind: components["schemas"]["ShiftKind"];
            /** Start */
            start?: string | null;
        };
        /**
         * ShiftKind
         * @enum {string}
         */
        ShiftKind: "shift" | "vacation" | "sick";
        /** ShiftTimesIn */
        ShiftTimesIn: {
            /** Breakend */
            breakEnd?: string | null;
            /** Breakstart */
            breakStart?: string | null;
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
        /** ShiftTrimOut */
        ShiftTrimOut: {
            /** Conflicts */
            conflicts: components["schemas"]["ShiftConflictOut"][];
            /** Removed */
            removed: number;
            /** Trimmed */
            trimmed: number;
        };
        /** SkippedOut */
        SkippedOut: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Message */
            message: string;
            /** Reason */
            reason: string;
            /**
             * Staffid
             * Format: uuid
             */
            staffId: string;
        };
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
        /** StaffShiftsOut */
        StaffShiftsOut: {
            /** Canedit */
            canEdit: boolean;
            /** Color */
            color: string | null;
            /** Days */
            days: components["schemas"]["ShiftCellOut"][];
            /** Name */
            name: string;
            role: components["schemas"]["Role"];
            /**
             * Staffid
             * Format: uuid
             */
            staffId: string;
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
         * @description ������ � ������. ������ � ���������� � ������� � ������� (StaffShift).
         * @enum {string}
         */
        StaffStatus: "active" | "fired";
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
        /** TopupIn */
        TopupIn: {
            /** Amount */
            amount: number | string;
            /** Comment */
            comment?: string | null;
            /** Staffid */
            staffId?: string | null;
        };
        /** TransactionOut */
        TransactionOut: {
            /** Amount */
            amount: string;
            author: components["schemas"]["PersonRef"];
            /** Balanceafter */
            balanceAfter: string;
            /** Comment */
            comment: string | null;
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
            /** Receiptid */
            receiptId: string | null;
            /** Recordid */
            recordId: string | null;
            /** Reversesid */
            reversesId: string | null;
            salon: components["schemas"]["PersonRef"] | null;
            staff: components["schemas"]["PersonRef"] | null;
            type: components["schemas"]["TransactionType"];
        };
        /**
         * TransactionType
         * @enum {string}
         */
        TransactionType: "topup" | "refund" | "payment" | "accrual" | "reversal" | "adjustment" | "burn";
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
                balance?: string | null;
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
    get_account_api_admin_v1_clients__client_id__account_get: {
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
                    "application/json": components["schemas"]["Envelope_AccountOut_"];
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
    adjust_account_api_admin_v1_clients__client_id__account_adjustments_post: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string | null;
            };
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdjustmentIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_TransactionOut_"];
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
    refund_api_admin_v1_clients__client_id__account_refunds_post: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string | null;
            };
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefundIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_TransactionOut_"];
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
    topup_api_admin_v1_clients__client_id__account_topups_post: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string | null;
            };
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TopupIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_TransactionOut_"];
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
    get_account_transactions_api_admin_v1_clients__client_id__account_transactions_get: {
        parameters: {
            query?: {
                dateFrom?: string | null;
                dateTo?: string | null;
                page?: number;
                perPage?: number;
                type?: components["schemas"]["TransactionType"][] | null;
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
                    "application/json": components["schemas"]["Envelope_list_TransactionOut__"];
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
    client_cards_api_admin_v1_clients__client_id__loyalty_cards_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["CardStatus"] | null;
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
                    "application/json": components["schemas"]["Envelope_list_LoyaltyCardOut__"];
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
    issue_card_api_admin_v1_clients__client_id__loyalty_cards_post: {
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
                "application/json": components["schemas"]["CardIssueIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_LoyaltyCardOut_"];
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
    client_balances_api_admin_v1_finances_client_balances_get: {
        parameters: {
            query?: {
                kind?: string | null;
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
                    "application/json": components["schemas"]["Envelope_ClientBalancesOut_"];
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
    list_expense_categories_api_admin_v1_finances_expense_categories_get: {
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
                    "application/json": components["schemas"]["Envelope_list_ExpenseCategoryOut__"];
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
    create_expense_category_api_admin_v1_finances_expense_categories_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExpenseCategoryIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ExpenseCategoryOut_"];
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
    delete_expense_category_api_admin_v1_finances_expense_categories__category_id__delete: {
        parameters: {
            query?: never;
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
    rename_expense_category_api_admin_v1_finances_expense_categories__category_id__patch: {
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
                "application/json": components["schemas"]["ExpenseCategoryIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ExpenseCategoryOut_"];
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
            header?: {
                "Idempotency-Key"?: string | null;
            };
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
    sale_checkout_api_admin_v1_finances_receipts_checkout_get: {
        parameters: {
            query: {
                clientId?: string | null;
                subtotal: number | string;
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
                    "application/json": components["schemas"]["Envelope_CheckoutOut_"];
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
                    "application/json": components["schemas"]["app__api__schemas__Envelope_CategoryOut___2"];
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
                    "application/json": components["schemas"]["app__api__schemas__Envelope_CategoryOut___2"];
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
    delete_card_api_admin_v1_loyalty_cards__card_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                card_id: string;
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
                    "application/json": components["schemas"]["Envelope_LoyaltyCardOut_"];
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
    adjust_cashback_api_admin_v1_loyalty_cards__card_id__cashback_adjustments_post: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string | null;
            };
            path: {
                card_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CashbackAdjustmentIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_TransactionOut_"];
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
    card_transactions_api_admin_v1_loyalty_cards__card_id__transactions_get: {
        parameters: {
            query?: {
                dateFrom?: string | null;
                dateTo?: string | null;
                page?: number;
                perPage?: number;
                type?: components["schemas"]["TransactionType"][] | null;
            };
            header?: never;
            path: {
                card_id: string;
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
                    "application/json": components["schemas"]["Envelope_list_TransactionOut__"];
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
    card_visits_api_admin_v1_loyalty_cards__card_id__visits_get: {
        parameters: {
            query?: {
                page?: number;
                perPage?: number;
            };
            header?: never;
            path: {
                card_id: string;
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
                    "application/json": components["schemas"]["Envelope_list_CardVisitOut__"];
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
    generate_number_api_admin_v1_loyalty_cards_generate_number_get: {
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
                    "application/json": components["schemas"]["Envelope_GeneratedNumberOut_"];
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
    list_card_types_api_admin_v1_loyalty_card_types_get: {
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
                    "application/json": components["schemas"]["Envelope_list_CardTypeOut__"];
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
    create_card_type_api_admin_v1_loyalty_card_types_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CardTypeIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_CardTypeOut_"];
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
    get_card_type_api_admin_v1_loyalty_card_types__type_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type_id: string;
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
                    "application/json": components["schemas"]["Envelope_CardTypeOut_"];
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
    patch_card_type_api_admin_v1_loyalty_card_types__type_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CardTypePatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_CardTypeOut_"];
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
    list_bonus_rules_api_admin_v1_loyalty_card_types__type_id__bonus_rules_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type_id: string;
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
                    "application/json": components["schemas"]["Envelope_list_BonusRuleOut__"];
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
    create_bonus_rule_api_admin_v1_loyalty_card_types__type_id__bonus_rules_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BonusRuleIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_BonusRuleOut_"];
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
    delete_bonus_rule_api_admin_v1_loyalty_card_types__type_id__bonus_rules__rule_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                rule_id: string;
                type_id: string;
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
    patch_bonus_rule_api_admin_v1_loyalty_card_types__type_id__bonus_rules__rule_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                rule_id: string;
                type_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BonusRulePatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_BonusRuleOut_"];
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
                serviceCategoryId?: string | null;
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
    record_checkout_api_admin_v1_records__record_id__checkout_get: {
        parameters: {
            query?: {
                bonusRecordServiceIds?: string[] | null;
            };
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
                    "application/json": components["schemas"]["Envelope_CheckoutOut_"];
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
            header?: {
                "Idempotency-Key"?: string | null;
            };
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
                categoryId?: string | null;
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
    create_category_api_admin_v1_services_categories_post: {
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
                    "application/json": components["schemas"]["app__api__schemas__Envelope_CategoryOut___1"];
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
    delete_category_api_admin_v1_services_categories__category_id__delete: {
        parameters: {
            query?: never;
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
    rename_category_api_admin_v1_services_categories__category_id__patch: {
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
                    "application/json": components["schemas"]["app__api__schemas__Envelope_CategoryOut___1"];
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
                    "application/json": components["schemas"]["Envelope_SalonSchedulePutOut_"];
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
    shift_grid_api_admin_v1_shifts_get: {
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
                    "application/json": components["schemas"]["Envelope_ShiftGridOut_"];
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
    put_shift_api_admin_v1_shifts__staffId___date__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                date: string;
                staffId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShiftIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_ShiftCellOut_"];
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
    delete_shift_api_admin_v1_shifts__staffId___date__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                date: string;
                staffId: string;
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
    fill_shifts_api_admin_v1_shifts_fill_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FillIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Envelope_FillReportOut_"];
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
    list_salons_api_booking_salons_get: {
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
                    "application/json": components["schemas"]["SalonListItemOut"][];
                };
            };
        };
    };
    client_loyalty_api_bot_clients_by_telegram__tg_user_id__loyalty_get: {
        parameters: {
            query?: never;
            header?: {
                "X-API-Key"?: string | null;
            };
            path: {
                tg_user_id: number;
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
                    "application/json": components["schemas"]["ClientLoyaltyOut"];
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
