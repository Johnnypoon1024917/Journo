# Quick Testing Guide

## Test 1: Add Activity to New Day
1. Go to Schedule Screen
2. Select empty date
3. Click "+" button
4. Fill form and submit
5. ✅ Activity appears, no "day exists" error

## Test 2: Add Multiple Activities
1. Add 3 activities to same day
2. ✅ All appear, no duplicate errors

## Test 3: Stickers
1. Click sticker button
2. ✅ Modal opens with stickers
3. Select and attach
4. ✅ Sticker appears, no errors

## Errors That Should NOT Appear
- ❌ "Cannot read properties of undefined (reading 'length')"
- ❌ "createStickerPlacement is not a function"
- ❌ "Day number already exists"
- ❌ "Invalid date parts"

## API Calls to Check
- POST /days/get-or-create (200/201)
- POST /places (201)
- GET /stickers (200)

## Console Should Show
```
Day ready: xxx
Activity created successfully
```
