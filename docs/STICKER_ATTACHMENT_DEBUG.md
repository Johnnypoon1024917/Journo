# Sticker Attachment Debugging Guide

## Current Status
The sticker attachment is failing with a foreign key constraint error. The backend has been updated with proper NULL handling and debug logging.

## To Debug

### 1. Restart Backend (Already Done)
The backend has been restarted with the new code that includes debug logging.

### 2. Try Attaching a Sticker
1. Go to Schedule screen
2. Click "貼上貼紙" button
3. Select an emoji sticker (like 🎒)
4. Try to attach it

### 3. Check Backend Logs
After attempting to attach, run this command to see the logs:
```bash
cd backend
# Check the running process logs
```

The logs should show:
- "Attach sticker request:" with the received data
- "Processing sticker type:" showing if it's detected as emoji
- "Using emoji sticker:" or "Using custom sticker:"
- "Inserting sticker attachment:" with the actual values being inserted

### 4. What to Look For

**Expected for Emoji Stickers:**
```
Processing sticker type: { stickerId: 'emoji-1', isEmojiSticker: true }
Using emoji sticker: { emojiCharacter: '🎒', actualStickerId: null }
Inserting sticker attachment: {
  actualStickerId: null,
  emojiCharacter: '🎒',
  userId: '...',
  entityType: 'trip_day',
  entityId: '...'
}
```

**If you see this instead:**
```
actualStickerId: '' (empty string)
actualStickerId: undefined
actualStickerId: 'emoji-1' (should be null for emoji!)
```

Then we know the issue.

## Possible Issues

### Issue 1: Old Code Still Running
**Solution:** Backend has been restarted with new code

### Issue 2: Empty String Instead of NULL
**Solution:** Code uses `|| null` to convert falsy values to null

### Issue 3: TypeScript/JavaScript Type Coercion
**Solution:** Explicitly initialize variables to `null`

### Issue 4: Database Constraint
**Solution:** Verified constraint allows NULL, test insert works

## Manual Test
You can also test the endpoint directly:

```bash
# Get your auth token from browser DevTools (localStorage)
TOKEN="your-token-here"

# Test attaching emoji sticker
curl -X POST http://localhost:5000/api/stickers/attach \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "stickerId": "emoji-1",
    "entityType": "trip_day",
    "entityId": "your-day-id-here",
    "positionX": 50,
    "positionY": 50
  }'
```

## Next Steps

1. Try attaching a sticker from the UI
2. Check backend logs for debug output
3. Share the log output so we can see what's actually being sent
4. Based on logs, we'll know exactly where the issue is

## Files Modified
- `backend/src/controllers/stickerController.ts` - Added debug logging and NULL handling
- Backend restarted with new code
