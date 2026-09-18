# Security Specification & Threat Model

## 1. Data Invariants
- A user document `/users/{userId}` can only be read, created, updated, or deleted by the authenticated user whose `request.auth.uid == userId`.
- The user's UID and email fields inside `/users/{userId}` are immutable post-creation.
- User settings `/users/{userId}/settings/{settingId}` belong strictly to `{userId}` and require `userId == request.auth.uid`.
- Activity logs `/users/{userId}/activityLogs/{logId}` are immutable once written; only the owning user can create, read, or delete them.
- Document IDs must conform to regex `^[a-zA-Z0-9_\-]+$` and be <= 128 characters to prevent path variable poisoning.
- Unauthenticated access to private user data or blanket reads (`allow list: if isSignedIn()`) are strictly forbidden.

## 2. The Dirty Dozen Threat Payloads
1. **Unauthenticated Read of User Profile**: `GET /users/user123` with `auth = null` -> MUST FAIL (PERMISSION_DENIED).
2. **Cross-User Profile Read**: `GET /users/victim456` with `auth.uid = attacker789` -> MUST FAIL (PERMISSION_DENIED).
3. **Cross-User Profile Create**: `POST /users/victim456` with `data: { uid: 'victim456' }` and `auth.uid = attacker789` -> MUST FAIL (PERMISSION_DENIED).
4. **UID Spoofing on Create**: `POST /users/attacker789` with `data: { uid: 'admin_root', email: 'spoof@admin.com' }` -> MUST FAIL (PERMISSION_DENIED).
5. **Junk Document ID Path Poisoning**: `GET /users/../../system` or 2KB string ID -> MUST FAIL (PERMISSION_DENIED).
6. **Immutable Field Modification**: `UPDATE /users/user123` changing `email` or `uid` -> MUST FAIL (PERMISSION_DENIED).
7. **Cross-User Settings List**: `LIST /users/victim456/settings` with `auth.uid = attacker789` -> MUST FAIL (PERMISSION_DENIED).
8. **Cross-User Activity Log Write**: `POST /users/victim456/activityLogs/log1` with `auth.uid = attacker789` -> MUST FAIL (PERMISSION_DENIED).
9. **Log Tampering / Mutation**: `UPDATE /users/user123/activityLogs/log1` with altered history -> MUST FAIL (PERMISSION_DENIED).
10. **Oversized String Payload Attack (Denial of Wallet)**: `POST /users/user123` with 5MB `displayName` -> MUST FAIL (PERMISSION_DENIED).
11. **Blanket Collection Scrape**: `LIST /users` -> MUST FAIL (PERMISSION_DENIED).
12. **Malformed Field Types (Type Injection)**: `POST /users/user123/settings/main` with `notificationsEnabled: "TRUE_STRING"` instead of `bool` -> MUST FAIL (PERMISSION_DENIED).
