import { type Page } from '@playwright/test';
import { LoginPage } from './auth/LoginPage';
import { MerchantAppPage } from './merchant/MerchantAppPage';
import { MerchantReviewPage } from './merchant/MerchantReviewPage';
import { MerchantDesignSettingsPage } from './merchant/MerchantDesignSettingsPage';
import { MerchantPluginsAdsPage } from './merchant/MerchantPluginsAdsPage';
import { MerchantNotificationsPage } from './merchant/MerchantNotificationsPage';
import { MerchantSupportPage } from './merchant/MerchantSupportPage';
import { MerchantSubscriptionPage } from './merchant/MerchantSubscriptionPage';
import { MerchantProfilePage } from './merchant/MerchantProfilePage';
import { AdminRequestPage } from './admin/AdminRequestPage';
import { AdminConfigPage } from './admin/AdminConfigPage';
import { AdminPublishPage } from './admin/AdminPublishPage';
import { AdminCustomersPage } from './admin/AdminCustomersPage';
import { AdminAddCustomerPage } from './admin/AdminAddCustomerPage';
import { AdminNotificationsPage } from './admin/AdminNotificationsPage';
import { AdminSupportPage } from './admin/AdminSupportPage';
import { AdminActivityLogPage } from './admin/AdminActivityLogPage';
import { AdminRolesPage } from './admin/AdminRolesPage';
import { AdminUsersPage } from './admin/AdminUsersPage';
import { AdminProfilePage } from './admin/AdminProfilePage';

// بيجمع كل الصفحات في مكان واحد، والتست بياخد منه الصفحة اللي محتاجها
export class POManager {
    private readonly page: Page;
    private readonly loginPage: LoginPage;
    private readonly merchantAppPage: MerchantAppPage;
    private readonly merchantReviewPage: MerchantReviewPage;
    private readonly merchantDesignSettingsPage: MerchantDesignSettingsPage;
    private readonly merchantPluginsAdsPage: MerchantPluginsAdsPage;
    private readonly merchantNotificationsPage: MerchantNotificationsPage;
    private readonly merchantSupportPage: MerchantSupportPage;
    private readonly merchantSubscriptionPage: MerchantSubscriptionPage;
    private readonly merchantProfilePage: MerchantProfilePage;
    private readonly adminRequestPage: AdminRequestPage;
    private readonly adminConfigPage: AdminConfigPage;
    private readonly adminPublishPage: AdminPublishPage;
    private readonly adminCustomersPage: AdminCustomersPage;
    private readonly adminAddCustomerPage: AdminAddCustomerPage;
    private readonly adminNotificationsPage: AdminNotificationsPage;
    private readonly adminSupportPage: AdminSupportPage;
    private readonly adminActivityLogPage: AdminActivityLogPage;
    private readonly adminRolesPage: AdminRolesPage;
    private readonly adminUsersPage: AdminUsersPage;
    private readonly adminProfilePage: AdminProfilePage;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.loginPage = new LoginPage(this.page);
        this.merchantAppPage = new MerchantAppPage(this.page);
        this.merchantReviewPage = new MerchantReviewPage(this.page);
        this.merchantDesignSettingsPage = new MerchantDesignSettingsPage(this.page);
        this.merchantPluginsAdsPage = new MerchantPluginsAdsPage(this.page);
        this.merchantNotificationsPage = new MerchantNotificationsPage(this.page);
        this.merchantSupportPage = new MerchantSupportPage(this.page);
        this.merchantSubscriptionPage = new MerchantSubscriptionPage(this.page);
        this.merchantProfilePage = new MerchantProfilePage(this.page);
        this.adminRequestPage = new AdminRequestPage(this.page);
        this.adminConfigPage = new AdminConfigPage(this.page);
        this.adminPublishPage = new AdminPublishPage(this.page);
        this.adminCustomersPage = new AdminCustomersPage(this.page);
        this.adminAddCustomerPage = new AdminAddCustomerPage(this.page);
        this.adminNotificationsPage = new AdminNotificationsPage(this.page);
        this.adminSupportPage = new AdminSupportPage(this.page);
        this.adminActivityLogPage = new AdminActivityLogPage(this.page);
        this.adminRolesPage = new AdminRolesPage(this.page);
        this.adminUsersPage = new AdminUsersPage(this.page);
        this.adminProfilePage = new AdminProfilePage(this.page);
    }

    //===================Methods===================
    getLoginPage() {
        return this.loginPage;
    }

    getMerchantAppPage() {
        return this.merchantAppPage;
    }

    getMerchantReviewPage() {
        return this.merchantReviewPage;
    }

    getMerchantDesignSettingsPage() {
        return this.merchantDesignSettingsPage;
    }

    getMerchantPluginsAdsPage() {
        return this.merchantPluginsAdsPage;
    }

    getMerchantNotificationsPage() {
        return this.merchantNotificationsPage;
    }

    getMerchantSupportPage() {
        return this.merchantSupportPage;
    }

    getMerchantSubscriptionPage() {
        return this.merchantSubscriptionPage;
    }

    getMerchantProfilePage() {
        return this.merchantProfilePage;
    }

    getAdminRequestPage() {
        return this.adminRequestPage;
    }

    getAdminConfigPage() {
        return this.adminConfigPage;
    }

    getAdminNotificationsPage() {
        return this.adminNotificationsPage;
    }

    getAdminProfilePage() {
        return this.adminProfilePage;
    }

    getAdminUsersPage() {
        return this.adminUsersPage;
    }

    getAdminRolesPage() {
        return this.adminRolesPage;
    }

    getAdminActivityLogPage() {
        return this.adminActivityLogPage;
    }

    getAdminSupportPage() {
        return this.adminSupportPage;
    }

    getAdminAddCustomerPage() {
        return this.adminAddCustomerPage;
    }

    getAdminCustomersPage() {
        return this.adminCustomersPage;
    }

    getAdminPublishPage() {
        return this.adminPublishPage;
    }
}
