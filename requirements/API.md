# Trujena API (Swagger / OpenAPI 3.0.3)

Server: `https://server.stg.trujena.com/` — Auth: `Authorization: Bearer <access_token>` (JWT)

Every response: `{ success, message, data }` — errors: `{ success: false, message, errors }`

## User — Auth / Profile
| Method | Endpoint | Notes |
|---|---|---|
| POST | /api/v2/users/auth/login/ | email + password → `data.user` + `data.tokens.access_token / refresh_token`. 401 wrong data, 403 suspended, 429 locked |
| POST | /api/v2/users/auth/refresh/ | `{ refresh }` → `{ access }` |
| POST | /api/v2/users/auth/logout/ | `{ refresh_token }`. 400 invalid token, 401 no access token |
| GET | /api/v2/users/profile/ | admin: role + permissions / merchant: store_name, dashboard_locked |
| PATCH | /api/v2/users/profile/update/ | name 2-30 chars (422), admin can change email (409 duplicate) |
| POST | /api/v2/users/password/change/ | 401 wrong current, 422 weak, 400 same as old |
| GET | /api/v2/users/list-users/ | `account_type` admin / merchant, `search` |

## Admin
| Method | Endpoint | Notes |
|---|---|---|
| GET | /api/v2/admin/activity-logs/ | filters: action_type (add, delete, edit, login, save_hidden_elements, status_change), admin_user_id, date, last_id (cursor). 401 / 403 |
| GET | /api/v2/admin/activity-logs/action-types/ | |
| GET | /api/v2/admin/activity-logs/dashboard/ , /dashboard/{user_id}/ | |
| GET / PATCH | /api/v2/admin/app-config/hidden-elements | X-Impersonation-Token |
| GET | /api/v2/admin/app-requests/ | page_size 10, status, search |
| GET | /api/v2/admin/app-requests/statuses/ | |
| GET | /api/v2/admin/app-requests/{serial}/ | 404 not found |
| POST | /app-requests/{serial}/under-review/ , accept/ , reject/ , setup-config/ , apk/ , in-progress/ , publishing/ , publish-failed/ , store-urls/ , webmail/ | 404 not found, 409 wrong status |
| POST | /api/v2/admin/merchants/ | create merchant |
| GET / PATCH / DELETE | /api/v2/admin/merchants/{id}/ | 404 |
| PATCH | /merchants/{id}/change-password/ | |
| POST | /merchants/{id}/dashboard-lock/ , impersonate/ , /merchants/impersonate/revoke/ | |
| GET | /api/v2/admin/merchants/active/ | search, package_name, subscription_status (active, cancelled, expired), app_status, page |
| GET | /api/v2/admin/merchants/leads/ | connection_status (connected, new) |
| GET / POST | /api/v2/admin/notifications/ | recipient_type (admin, merchant), search. POST: 429 = 1 every 30 seconds |
| GET / DELETE | /api/v2/admin/notifications/{id}/ | 404 |
| GET | /api/v2/admin/payments/dashboard/revenue/ | period |
| GET / POST | /api/v2/admin/roles/ | POST 201, 409 duplicate name, 422 bad permissions |
| GET / PATCH / DELETE | /api/v2/admin/roles/{id}/ | 404, 409 role has active users |
| GET | /api/v2/admin/roles/permissions/ | grouped by module |
| GET | /api/v2/admin/support/messages/support/ , contact-us/ | message_type (inquiry, problem), status (new, viewed), search |
| GET / PATCH | /support/messages/{serial}/detail/ , toggle-status/ | |
| GET / POST | /api/v2/admin/users/ | is_active, role_id, search. POST 409 email exists |
| GET / PATCH / DELETE | /api/v2/admin/users/{id}/ | 404, 422 business rules |
| POST | /api/v2/admin/users/{id}/reset-password/ | |
| GET | /api/v2/admin/users/dashboard/stats/ , newest-merchants/ , app-requests/ | |

## Merchant
| Method | Endpoint | Notes |
|---|---|---|
| GET / POST | /api/v2/merchant/app-request/ | POST 409 active request exists |
| GET | /api/v2/merchant/app-request/{serial}/ | 404 |
| POST | /app-request/{serial}/approve/ , request-revision/ | |
| GET / PATCH | /api/v2/merchant/app-config/ | PATCH saved after 5 minutes |
| GET | /api/v2/merchant/app-config/icons/ | category filter |
| GET / PATCH | /app-config/privacy-policy/ , whatsapp-settings/ | |
| GET / POST | /api/v2/merchant/advertisements/ | |
| GET / PATCH | /advertisements/{id}/ , toggle-status/ | 404, max 3 active |
| POST | /advertisements/bulk-delete/ | |
| POST | /api/v2/merchant/push-notifications/ | |
| GET / PATCH / DELETE | /push-notifications/{serial}/ | 404 |
| GET | /push-notifications/drafts/ , sent/ | |
| GET | /api/v2/merchant/subscription/details/ , packages/ | |
| GET | /api/v2/merchant/auth/dashboard/stats/ , app-users/ , app-downloads/ | |
| POST | /api/v2/merchant/support/ | 429 = 1 every 5 minutes |
| POST | /merchant/auth/register/ , password/forget/ , verify-otp/ , reset/ , whatsapp/send-otp/ , verify-otp/ | |

## Shared notifications
| GET | /api/v2/notifications/ , unread-count/ | |
| POST / DELETE | /notifications/{id}/read/ , /notifications/{id}/ | 404 |
