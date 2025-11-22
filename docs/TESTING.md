# 📋 Testing Guide

**6 Test Scenarios** - Complete Procedures  
**Status**: ✅ Ready to Test

---

## Overview

Total testing time: **30 minutes**  
All 6 scenarios must pass before production deployment.

---

## Test 1: Basic Grant (5 minutes)

**Objective**: Verify grant admin succeeds

```
SETUP:
1. Open Control page
2. Click "Admin" tab
3. Click "Grant Access" tab

ACTION:
4. Enter email: test1@example.com
5. Enter reason: Testing grant
6. Click "Grant Admin Role"

VERIFY:
✅ Green message appears: "✅ Granted admin role to test1@example.com"
✅ Form fields clear
✅ No errors shown
✅ Admin appears in "Current Admins" tab
✅ Entry appears in "Audit Log" tab with action "GRANT"

RESULT: PASS ✅ / FAIL ❌
```

---

## Test 2: Basic Revoke (5 minutes)

**Objective**: Verify revoke admin succeeds

```
SETUP:
1. From previous test, admin exists
2. Click "Revoke Access" tab

ACTION:
3. Enter email: test1@example.com
4. Enter reason: Testing revoke
5. Click "Revoke Admin Role"
6. Click "OK" in confirmation dialog

VERIFY:
✅ Green message: "✅ Revoked admin role from test1@example.com"
✅ Form fields clear
✅ No errors shown
✅ Admin removed from "Current Admins" tab
✅ Entry in "Audit Log" shows action "REVOKE"

RESULT: PASS ✅ / FAIL ❌
```

---

## Test 3: Rate Limiting (10 minutes)

**Objective**: Verify rate limit kicks in at 6th operation

```
SETUP:
1. Click "Grant Access" tab
2. Have 6 different test emails ready:
   - test2@example.com
   - test3@example.com
   - test4@example.com
   - test5@example.com
   - test6@example.com
   - test7@example.com

ACTION - ATTEMPT 1:
3. Enter test2@example.com
4. Click "Grant Admin Role"
5. Wait for success
VERIFY: ✅ Success message, admin added

ACTION - ATTEMPT 2:
6. Enter test3@example.com
7. Click "Grant Admin Role"
8. Wait for success
VERIFY: ✅ Success message, admin added

ACTION - ATTEMPT 3:
9. Repeat with test4@example.com
VERIFY: ✅ Success message

ACTION - ATTEMPT 4:
10. Repeat with test5@example.com
VERIFY: ✅ Success message

ACTION - ATTEMPT 5:
11. Repeat with test6@example.com
VERIFY: ✅ Success message

ACTION - ATTEMPT 6 (RATE LIMIT):
12. Quickly enter test7@example.com
13. Click "Grant Admin Role"
VERIFY: ⚠️ Yellow warning appears
VERIFY: ⚠️ Message: "Rate limited. Try again in X seconds"
VERIFY: 🔒 Form disabled
VERIFY: ⏱️ Countdown timer visible
VERIFY: ⏱️ Countdown decrements each second

WAIT:
14. Watch countdown reach 0 (~45 seconds)
VERIFY: ✅ Form re-enabled
VERIFY: ✅ Button shows "Grant Admin Role" again

TRY AGAIN:
15. Form now enabled
16. Click "Grant Admin Role" (should succeed now)
VERIFY: ✅ Success message

RESULT: PASS ✅ / FAIL ❌
```

---

## Test 4: CSRF Token (5 minutes)

**Objective**: Verify CSRF token expires and resets

```
SETUP:
1. Click "Grant Access" tab
2. Have email ready: test8@example.com

PART A - IMMEDIATE GRANT:
3. Enter email: test8@example.com
4. Click "Grant Admin Role"
VERIFY: ✅ Succeeds (token auto-generated)

PART B - TOKEN EXPIRY:
5. Prepare form with:
   - Email: test9@example.com
   - Reason: Testing expiry
6. Wait 10+ minutes (don't submit yet)
7. Click "Grant Admin Role"
VERIFY: ❌ Error message appears
VERIFY: ❌ Message says token invalid/expired
VERIFY: ❌ Admin NOT added

PART C - NEW TOKEN:
8. Now submit again (new token generated)
VERIFY: ✅ Succeeds (new token worked)
VERIFY: ✅ Admin added

RESULT: PASS ✅ / FAIL ❌
```

---

## Test 5: Error Handling (5 minutes)

**Objective**: Verify clear error messages

```
TEST CASE A - MISSING EMAIL:
1. Click "Grant Access" tab
2. Leave email blank
3. Click "Grant Admin Role"
VERIFY: ❌ Error message (not form submission)

TEST CASE B - INVALID EMAIL:
4. Enter: notanemail
5. Click "Grant Admin Role"
VERIFY: ❌ HTML5 validation prevents submission

TEST CASE C - NON-EXISTENT USER:
6. Enter: nonexistent@fakeemail.com
7. Click "Grant Admin Role"
VERIFY: ❌ Error message: "User not found"

TEST CASE D - ALREADY ADMIN:
8. Enter: test2@example.com (from test 3, already admin)
9. Click "Grant Admin Role"
VERIFY: ❌ Error message: "User is already an admin"

TEST CASE E - REASON SANITIZATION:
10. Try to grant with special chars: <script>alert('xss')</script>
11. Check "Audit Log" after success
VERIFY: ✅ Audit shows sanitized reason (no script tags)

RESULT: PASS ✅ / FAIL ❌
```

---

## Test 6: Audit Trail (5 minutes)

**Objective**: Verify all operations logged

```
SETUP:
1. Click "Audit Log" tab

VERIFY ENTRIES:
2. Scroll through recent entries
3. Should see entries from previous tests:
   ✅ "GRANT" entries (test 1, 3)
   ✅ "REVOKE" entries (test 2)
   ✅ "GRANT_FAILED" entries (test 5)

VERIFY ENTRY DETAILS:
4. Each entry should have:
   ✅ Action (GRANT, REVOKE, GRANT_FAILED, REVOKE_FAILED)
   ✅ Timestamp (date/time)
   ✅ Reason field (if provided)
   ✅ Status indicator (green for success, red for failure)

VERIFY SORTING:
5. Entries sorted newest first
VERIFY: ✅ Most recent at top

VERIFY PAGINATION:
6. Shows "last 50 entries"
VERIFY: ✅ Displays correctly

RESULT: PASS ✅ / FAIL ❌
```

---

## Quick Checklist

### Before Testing
- [ ] Code deployed to test environment
- [ ] Database migration 006 applied
- [ ] All 6 test emails prepared
- [ ] Time blocked for 30 min
- [ ] Browser console open (for any errors)
- [ ] Mixpanel dashboard ready (optional)

### During Testing
- [ ] Test 1: Basic Grant ✅
- [ ] Test 2: Basic Revoke ✅
- [ ] Test 3: Rate Limiting ✅
- [ ] Test 4: CSRF Token ✅
- [ ] Test 5: Error Handling ✅
- [ ] Test 6: Audit Trail ✅

### After Testing
- [ ] All 6 tests passed
- [ ] No console errors
- [ ] Mixpanel events tracked
- [ ] Screenshots taken (optional)
- [ ] Sign off on testing
- [ ] Approve for production

---

## Expected Results Summary

| Test | Duration | Expected Outcome |
|------|----------|------------------|
| 1. Grant | 5 min | ✅ Role granted |
| 2. Revoke | 5 min | ✅ Role revoked |
| 3. Rate Limit | 10 min | ⚠️ 6th blocked, countdown shown |
| 4. CSRF Token | 5 min | ❌ Expired token fails, new works |
| 5. Error Handling | 5 min | ❌ Clear error messages |
| 6. Audit Trail | 5 min | ✅ All ops logged |
| **Total** | **30 min** | **All pass = Ready** |

---

## Troubleshooting During Tests

### "Token expired" on immediate grant
**Solution**: This shouldn't happen. New token generated automatically. Refresh page and try again.

### "Rate limit" appears too early
**Solution**: May have attempted operations before. Wait 60 seconds for quota reset.

### Audit log not showing entries
**Solution**: Click refresh or navigate to another tab and back. May need page refresh.

### Form won't submit
**Solution**: Check browser console for errors. Ensure email field valid.

### "User not found" error
**Solution**: Check email spelling. Verify user exists in system.

---

## Sign-Off

When all 6 tests pass:

```
Tester Name: _______________
Date: _______________
Time Spent: _______________

All 6 tests: ✅ PASS / ❌ FAIL

Comments:
_________________________________
_________________________________

Approved for Production: ✅ YES / ❌ NO
```

---

## Success Criteria

✅ All 6 test scenarios pass  
✅ No console errors during testing  
✅ Audit log shows all operations  
✅ Rate limiting works as expected  
✅ Error messages clear and helpful  
✅ CSRF tokens working (generation + expiry)  

**Overall Result**: Ready for production deployment 🚀

---

**Last Updated**: November 22, 2025  
**Testing Duration**: 30 minutes  
**Pass/Fail**: All must pass for deployment

See also: [SECURITY.md](./SECURITY.md) for feature details
