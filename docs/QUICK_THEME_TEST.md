# Quick Theme Test Guide

## Test the User Theme Feature in 2 Minutes

### Step 1: Login
- Go to http://localhost:3000
- Login with your account

### Step 2: Change Theme Color
- Click on your profile icon (top right)
- Click "Settings"
- Scroll to "Theme Customization" section
- Click on any color preset OR use the color picker
- Watch the UI update immediately

### Step 3: Verify Persistence
- Refresh the page (F5 or Cmd+R)
- Your color should still be there ✅

### Step 4: Test Cross-Session
- Logout
- Login again
- Your color should still be there ✅

### Step 5: Test Cross-Device (Optional)
- Open the app in a different browser or device
- Login with the same account
- Your color should appear there too ✅

## What to Look For

✅ Color changes immediately when selected
✅ Color persists after page refresh
✅ Color persists after logout/login
✅ Color syncs across devices
✅ No errors in browser console

## Troubleshooting

If color doesn't save:
1. Check browser console for errors
2. Verify backend is running (http://localhost:5000)
3. Check that you're logged in
4. Try a different color

If color doesn't load:
1. Check browser console for API errors
2. Verify database migration ran successfully
3. Check that `theme_color` column exists in `users` table

## Technical Notes

- Colors are saved to the `users.theme_color` column
- API endpoint: `PUT /api/theme/user`
- Colors are in hex format: `#RRGGBB`
- Each user has their own personal theme
- No admin permissions required
