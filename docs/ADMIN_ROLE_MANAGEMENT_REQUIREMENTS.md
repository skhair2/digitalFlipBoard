# Admin Role Management System - Requirements Document

**Status**: MVP Definition Phase  
**Created**: November 22, 2025  
**Version**: 1.0  
**Audience**: Product, Engineering, UX/Design

---

## Executive Summary

As a senior admin, I need to manage user permissions (specifically granting/revoking admin role) with proper audit trails. This requires a lookup system (by email), role assignment interface, and role-based access control (RBAC) foundation.

**MVP Scope**: 
- Email-based user lookup
- Admin role assignment/revocation
- View all admins (with their permissions)
- Audit log of role changes
- Proper admin verification (confirm before granting)

---

## Problem Statement

### Current State
- ✅ User subscription management exists (Free/Pro/Enterprise)
- ✅ Admin panel exists (limited to super-admin user)
- ❌ No granular role management (admin, moderator, support, etc.)
- ❌ No non-super-admin users can have admin privileges
- ❌ No audit trail for permission changes
- ❌ Risk of unauthorized access if super-admin is compromised

### Why This Matters
1. **Scalability**: As team grows, can't rely on single super-admin
2. **Security**: Least privilege principle - admins only get needed permissions
3. **Accountability**: Track who did what and when
4. **Delegation**: Support team, moderators can help without full access
5. **Compliance**: Organizations need to document role changes

---

## User Stories (MVP)

### 1. Find User by Email
**As an** Admin  
**I want to** search/lookup users by email  
**So that** I can assign roles without knowing their user ID  

**Acceptance Criteria**:
- Search box accepts email or partial email (case-insensitive)
- Results show within 500ms
- No results → "User not found" message
- Results display: Email, Full Name, Current Role, Joined Date
- Can click to view detailed user profile

### 2. Grant Admin Role
**As an** Admin  
**I want to** grant the admin role to another user  
**So that** they can help manage the platform  

**Acceptance Criteria**:
- Modal/panel shows "Grant Admin?" with user confirmation
- Admin types user email twice (verification)
- After confirmation, immediate visual feedback "Admin granted"
- Audit log created with timestamp, who granted, who was granted
- User receives email notification (optional in MVP)
- Role takes effect immediately (no session refresh needed)

### 3. Revoke Admin Role
**As an** Admin  
**I want to** revoke admin role from another user  
**So that** I can manage access if someone leaves  

**Acceptance Criteria**:
- Modal shows "Are you sure?" confirmation
- Revocation is audited
- User notified via email (optional in MVP)
- Can only revoke if at least 2 admins exist (prevent lock-out)
- User logged out from admin view if they had active session

### 4. View All Admins
**As an** Admin  
**I want to** see a list of all admins and their permissions  
**So that** I know who has access and what they can do  

**Acceptance Criteria**:
- Table shows: Email, Full Name, Role, Permissions, Granted By, Date Granted
- Mark current user (you) differently
- Can filter by permission level
- Show "Last active" timestamp
- Can't revoke your own role (disabled button)

### 5. View Audit Log (Stretch)
**As an** Admin  
**I want to** see who changed what when  
**So that** we have accountability and compliance tracking  

**Acceptance Criteria**:
- Log shows: Action (Grant/Revoke), User Affected, Admin Who Changed, Timestamp
- Filterable by date range, action type, user
- Exportable as CSV
- Retention: 90 days minimum

---

## Role Hierarchy (MVP Phase 1)

```
┌─────────────────────────────────┐
│  Super Admin (Initial Setup)     │  ← System admin, all permissions
├─────────────────────────────────┤
│  Admin (This MVP Adds)           │  ← Can grant/revoke other admins
├─────────────────────────────────┤
│  Support (Future Phase)          │  ← Can see all users, basic actions
├─────────────────────────────────┤
│  Moderator (Future Phase)        │  ← Can moderate content, limited
└─────────────────────────────────┘
```

### Admin Permissions (MVP)
- ✅ View all users
- ✅ Grant/revoke admin role
- ✅ View audit logs
- ✅ View all admins list
- ✅ Manage coupons (already have)
- ❌ Delete users (future)
- ❌ Force password reset (future)
- ❌ View billing (future)

---

## Technical Requirements

### Database Schema

**New Table: `admin_roles`**
```sql
id (UUID) - Primary key
user_id (FK to auth.users)
role (VARCHAR: admin, support, moderator)
permissions (JSONB) - Array of permission codes
granted_by (FK to auth.users) - Which admin granted this
granted_at (TIMESTAMP)
revoked_at (TIMESTAMP, nullable) - Soft delete
status (VARCHAR: active, inactive)
```

**New Table: `role_change_audit_log`**
```sql
id (UUID)
action (VARCHAR: GRANT, REVOKE)
user_id (FK) - User whose role changed
admin_id (FK) - Admin who made change
old_role (VARCHAR, nullable)
new_role (VARCHAR)
permissions (JSONB)
timestamp (TIMESTAMP)
ip_address (VARCHAR)
reason (TEXT, nullable)
```

### Validation Rules

1. **Email Lookup**
   - Must be valid email format
   - Case-insensitive matching
   - Fuzzy matching optional (nice-to-have)

2. **Grant Admin**
   - Can only grant to existing users
   - Can't grant to self
   - Requires email verification (type twice)
   - At most 10 admins (configurable limit, prevents access explosion)

3. **Revoke Admin**
   - Can't revoke if it's the last admin
   - Can't revoke yourself
   - Requires confirmation
   - Must log reason

4. **Audit Trail**
   - All role changes logged immediately
   - Log includes: who, what, when, from where (IP)
   - Immutable (can't edit log)
   - Retention policy: 90 days

---

## UI/UX Specifications

### Layout: Role Management (New Admin Page)

```
┌─────────────────────────────────────────────────┐
│ 🔐 ROLE MANAGEMENT                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ SEARCH USER BY EMAIL                     │   │
│ │ ┌─────────────────────────────────┐      │   │
│ │ │ [Type email...] [🔍 Search]    │      │   │
│ │ └─────────────────────────────────┘      │   │
│ │ └─ Found: jane@example.com (Pro User)   │   │
│ │    Grant Admin Role? [Grant] [Cancel]  │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ ALL ADMINS (3)                           │   │
│ ├──────────────────────────────────────────┤   │
│ │ Email              │ Role  │ Since       │   │
│ │ admin@company.com  │ Admin │ Oct 1, 2025 │   │
│ │ you@company.com    │ Admin │ You!       │   │
│ │ jane@example.com   │ Admin │ Nov 22, 25 │   │
│ └──────────────────────────────────────────┘   │
│ [Revoke] [View Permissions] buttons per row   │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ RECENT ROLE CHANGES (Audit Log)          │   │
│ │ Nov 22, 10:30 - admin granted jane admin │   │
│ │ Nov 20, 14:15 - admin granted bob admin  │   │
│ └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Component Hierarchy

```
AdminLayout
├── AdminSidebar (add 🔐 Role Management)
└── RoleManagement (NEW COMPONENT)
    ├── UserLookupPanel
    │   ├── SearchInput
    │   ├── SearchResults
    │   └── GrantAdminModal
    ├── AdminsList
    │   ├── AdminsTable
    │   ├── RevokeConfirmModal
    │   └── PermissionsModal
    └── AuditLog
        ├── LogTable
        ├── FilterPanel
        └── ExportButton
```

### States & Interactions

**Search States**:
1. Empty → "Search for a user by email"
2. Typing → Debounced search
3. Loading → Spinner, "Searching..."
4. Found → Show user card, "Grant?" button
5. Not Found → Red message "No user found with that email"
6. Error → Red banner with retry

**Grant States**:
1. Initial → Show 2-step verification modal
2. Verifying → "Confirm: Type email again"
3. Confirming → "Are you sure?" with user details
4. Loading → "Granting admin role..." spinner
5. Success → Green checkmark "Jane is now an admin!"
6. Error → "Failed to grant: [reason]"

**Revoke States**:
1. Hover → Show revoke button (red)
2. Click → "Are you sure?" confirmation
3. Double-check → Show permissions they'll lose
4. Executing → "Revoking..." spinner
5. Complete → Remove from list, show audit entry
6. Error → Restore row, show error message

---

## MVP vs Future Phases

### ✅ MVP (Phase 1) - This Implementation
- [ ] Email-based user lookup
- [ ] Grant admin role (with 2x verification)
- [ ] Revoke admin role (with guard rails)
- [ ] View all admins
- [ ] Audit log (basic - last 30 days)
- [ ] Role table in DB
- [ ] Admin permissions service

### 🔮 Phase 2 (Q1 2026)
- [ ] Support role (read-only, limited actions)
- [ ] Moderator role (approve content, limited bans)
- [ ] Bulk role assignment (CSV import)
- [ ] Permission customization (choose specific perms)
- [ ] Role templates (pre-configured role sets)
- [ ] Email notifications on role change
- [ ] 2FA requirement for role changes

### 🚀 Phase 3 (Future)
- [ ] Expiring admin roles (e.g., temp 30-day admin)
- [ ] Department/team based roles
- [ ] Resource-level permissions (board-specific admin)
- [ ] OAuth integration (SSO admin provisioning)
- [ ] Machine learning: detect suspicious role patterns

---

## Success Metrics

### Adoption
- % of orgs with 2+ admins within 30 days
- % reduction in single-point-of-failure support tickets

### Security
- 100% audit trail coverage (no missing logs)
- 0 unauthorized role escalations
- Avg time to revoke compromised admin: < 5 minutes

### UX
- Task completion rate: > 95% (users can grant/revoke without help)
- Error rate: < 2% (validation catches issues before execution)
- Time to grant admin: < 2 minutes

---

## Design System Notes

### Colors
- **Role/Permission Actions**: Teal (primary), Red (danger - revoke), Amber (warning)
- **Admin State**: Indigo badge
- **Audit Log**: Slate background with timestamp accents

### Icons
- 🔐 Lock - Role/Permission concept
- 👤 User - Person/admin selection
- 🔍 Search - User lookup
- ✓ Check - Permission grant
- ✕ Close - Permission revoke
- 📋 Log - Audit trail

### Spacing & Sizing
- Search box: Full width on mobile, 400px desktop
- Admin table: Responsive (cards on mobile, table on desktop)
- Modals: Max 500px width, centered

### Accessibility
- All buttons have keyboard shortcuts (?, ?, Tab)
- Search results keyboard navigable
- Color not only indicator (icons + text)
- Screen reader friendly role descriptions
- High contrast: Dark mode optimized

---

## Implementation Plan

### Phase 1A: Database & Service
1. Create database migration (tables, RLS policies)
2. Build permissionService.js (grant, revoke, check)
3. Create admin role store (Zustand)

### Phase 1B: UI Components
1. UserLookupPanel (search by email)
2. RoleManagement main component
3. AdminsList table with actions
4. Grant/Revoke confirmation modals
5. AuditLog display

### Phase 1C: Integration
1. Add to AdminSidebar navigation
2. Add route in AdminLayout
3. Test access controls
4. Deploy to staging

### Phase 1D: Polish & Documentation
1. Create UI/UX specs (with Figma if needed)
2. Write admin guide
3. Add inline help text
4. QA testing

---

## Non-Functional Requirements

### Performance
- User lookup: < 500ms response
- Render admin list: < 1s (even with 100 admins)
- Audit log load: paginated, 50 records per page

### Security
- Only logged-in admins can access role management
- RLS policies prevent non-admins from seeing roles
- IP logging for audit trail
- Rate limiting: 10 grant attempts per hour per admin
- Require password confirmation for role changes

### Reliability
- Graceful error handling (show message, allow retry)
- Optimistic updates (show UI change, confirm server)
- Undo capability? (revoke takes effect immediately, no undo)

### Scalability
- Works with 100+ users
- Works with 10+ admins
- Audit log grows indefinitely (archive old logs)

---

## Questions for UX/Design Review

1. **2-step verification**: Should users type email twice, or use checkbox "I confirm this is intentional"?
2. **Revoke confirmation**: Show list of permissions they'll lose?
3. **Email notification**: Critical for this MVP or nice-to-have?
4. **Audit log visibility**: Only admins can see, or also show to the affected user?
5. **Mobile experience**: Cards instead of table? Modal instead of side panel?
6. **Keyboard shortcuts**: Should we support ? (Grant), R (Revoke), S (Search)?

---

## Appendix: Role Permission Matrix (Phase 1 MVP)

| Permission | Admin | Support | Moderator | User |
|-----------|-------|---------|-----------|------|
| View all users | ✅ | ✅ | ❌ | ❌ |
| Grant/revoke admin | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |
| Manage coupons | ✅ | ❌ | ❌ | ❌ |
| View system health | ✅ | ✅ | ❌ | ❌ |
| Ban users (future) | ✅ | ❌ | ✅ | ❌ |
| Edit content (future) | ❌ | ❌ | ✅ | ❌ |

---

**Document Owner**: Product Manager  
**Last Updated**: November 22, 2025  
**Next Review**: November 29, 2025
