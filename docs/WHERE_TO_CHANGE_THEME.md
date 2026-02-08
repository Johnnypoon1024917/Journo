# Where to Change Your Personal Theme Color

## Important: Two Different Settings Pages

There are **TWO different settings pages** in the app:

### 1. 🎨 **User Settings** (Personal Theme)
**URL**: `http://localhost:3000/settings`

**What's here:**
- ✅ Personal theme color picker (6 presets + custom color)
- ✅ Language settings
- ✅ Account settings (profile, password, logout)
- ✅ Animation settings

**This is where you change YOUR personal theme color!**

**How to get there:**
1. Click your profile icon (top right)
2. Click "Settings" from the dropdown menu
3. OR navigate directly to: `http://localhost:3000/settings`

---

### 2. 🗺️ **Trip Settings** (Trip-Specific Theme)
**URL**: `http://localhost:3000/trips/:id/settings`

**What's here:**
- Trip theme customization (only affects this specific trip)
- Trip information
- Delete trip button (owner only)

**This is for trip-specific settings, NOT your personal theme!**

**How to get there:**
1. Go to a trip detail page
2. Click the settings/gear icon
3. OR navigate to: `http://localhost:3000/trips/[trip-id]/settings`

---

## How to Change Your Personal Theme Color

### Step 1: Go to User Settings
Navigate to: `http://localhost:3000/settings`

### Step 2: Scroll to "Theme Customization"
You'll see:
- **Preset Colors**: 6 colored circles (Pink, Orange, Blue, Teal, Purple, Yellow)
- **Custom Color**: A color picker button with a paint brush icon

### Step 3: Choose Your Color
**Option A - Use a Preset:**
- Click any of the 6 colored circles
- Theme changes immediately

**Option B - Use Custom Color:**
- Click the color picker button (with paint brush icon)
- A color picker will appear
- Choose any color you want
- Type a hex code or use the color selector
- Theme changes immediately

### Step 4: Verify It Saved
- Check browser console for "✅ User theme saved successfully"
- Refresh the page - your color should persist
- Logout and login - your color should still be there

---

## Troubleshooting

### "I'm on /trips/:id/settings and don't see the color picker"
- That's the **trip settings** page, not user settings
- Go to `/settings` instead (click your profile icon → Settings)

### "Colors are showing but theme doesn't change"
- Make sure you're logged in
- Check browser console for errors
- Try refreshing the page after selecting a color

### "I see 401 Unauthorized error"
- You need to be logged in to save theme preferences
- Theme will still work locally, but won't persist

### "Custom color picker doesn't appear"
- Click the square button with the paint brush icon
- It should expand to show the color picker

---

## Quick Links

- **User Settings (Personal Theme)**: http://localhost:3000/settings
- **Trip Settings (Trip Theme)**: http://localhost:3000/trips/[trip-id]/settings

Remember: Use `/settings` for your personal theme, not `/trips/:id/settings`!
