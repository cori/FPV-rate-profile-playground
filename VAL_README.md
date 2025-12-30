# Val.town Deployment

This branch contains a single-file version of the FPV Rate Profile Comparison Tool optimized for [Val.town](https://val.town).

## Quick Deploy to Val.town

1. **Sign up** for Val.town at https://val.town
2. **Create a new HTTP Val**
3. **Copy the contents** of `val.ts`
4. **Paste** into your new Val
5. **Save** - Your tool will be live immediately!

Your Val will be accessible at: `https://yourusername-yourvalname.web.val.run`

## What's Different?

This Val.town version:
- ✅ **Single file** - All HTML, CSS, and JavaScript bundled together
- ✅ **Zero dependencies** - Runs entirely in the browser
- ✅ **Instant deploy** - No build step required
- ✅ **All features included** - Complete functionality of the original tool
- ✅ **localStorage works** - Profile history saves in your browser

## Features

Everything from the original tool:
- Dual profile comparison with real-time visualization
- Import/export Betaflight CLI commands
- Named profiles with history
- Visibility controls for profiles and attitudes
- Throttle curve comparison
- Dark theme with accessibility support

## File Structure

```
val.ts          # Single-file Val.town version (THIS IS WHAT YOU NEED)
VAL_README.md   # This file - deployment instructions
```

## Customization

You can customize the Val by editing `val.ts`:

### Change Colors
Find the color definitions in the CSS section:
```typescript
--color-roll: #ff3366;
--color-pitch: #33ff66;
--color-yaw: #ffaa00;
```

### Adjust Canvas Size
Find the canvas elements and change width/height:
```typescript
<canvas id="rate-canvas" width="900" height="500"></canvas>
```

### Modify Default Values
Find the `createDefaultProfile` function:
```typescript
rates: {
  roll: { center: 70, maxRate: 670, expo: 0 },
  // Change these defaults
}
```

## Comparison: Val.town vs GitHub

| Feature | Val.town | GitHub Pages |
|---------|----------|--------------|
| Deploy speed | Instant | ~1 minute |
| Editing | In-browser | Git workflow |
| Version control | Val history | Git commits |
| Custom domain | Via Val.town | Free with GitHub |
| Collaboration | Share Val | Fork repo |
| Best for | Quick experiments | Production apps |

## Troubleshooting

### Val doesn't load
- Check browser console for errors
- Ensure the entire `val.ts` file was copied
- Try refreshing the page

### localStorage not working
- Check browser settings allow localStorage
- Try incognito/private mode
- Different browsers have different localStorage

### Canvas not rendering
- Ensure canvas dimensions are reasonable for your screen
- Check that JavaScript is enabled
- Try a different browser

## Next Steps

After deploying to Val.town:
1. **Test all features** to ensure everything works
2. **Share your Val** with others
3. **Customize** colors, defaults, or layout
4. **Fork** the original repo for more advanced modifications

## Original Repo

Full source with tests and documentation:
https://github.com/cori/FPV-rate-profile-playground

## License

MIT - Feel free to fork, modify, and share!
