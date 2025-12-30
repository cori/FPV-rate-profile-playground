# FPV Rate Profile Comparison Tool

A web-based tool for comparing and analyzing Betaflight rate profiles side-by-side. Built with vanilla JavaScript for maximum compatibility and performance.

## Features

### Core Functionality
- **Dual Profile Comparison**: Compare two rate profiles simultaneously on large, clear graphs
- **Real-time Visualization**: See changes instantly as you adjust sliders
- **Attitude Rate Curves**: Visualize roll, pitch, and yaw rate curves using Betaflight's Actual Rates algorithm
- **Throttle Curves**: Compare throttle curves with mid-point and expo settings

### Profile Management
- **Import/Export**: Copy and paste Betaflight CLI commands to import or export profiles
- **Named Profiles**: Give your profiles meaningful names for easy identification
- **Profile History**: All saved profiles are stored in your browser's localStorage
- **History Export/Import**: Export your entire profile history as JSON for backup or sharing
- **Timeline Navigation**: Load any saved profile into either comparison slot

### Visualization Controls
- **Profile Visibility**: Toggle between Profile A (solid lines) and Profile B (dashed lines)
- **Attitude Filtering**: Show/hide individual attitudes (roll, pitch, yaw)
- **Color Coding**:
  - Roll: Red (#ff3366)
  - Pitch: Green (#33ff66)
  - Yaw: Orange (#ffaa00)
  - Throttle: Blue (#00aaff)

### Accessibility
- Dark theme optimized for extended viewing sessions
- Keyboard navigation support
- High contrast mode support
- Reduced motion support for accessibility preferences
- Clear visual differentiation between profiles and attitudes

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FPV-rate-profile-playground
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html in your browser
   open index.html
   # or
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

3. **Run tests**
   ```bash
   npm install
   npm test
   ```

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t fpv-rate-comparison .
   ```

2. **Run the container**
   ```bash
   docker run -p 8080:80 fpv-rate-comparison
   ```

3. **Access the application**
   ```
   Open http://localhost:8080 in your browser
   ```

## Usage Guide

### Comparing Rate Profiles

1. **Adjust Profile A and B** using the sliders in the respective editor panels
2. **View real-time comparison** in the rate and throttle curve graphs
3. **Toggle visibility** using the checkboxes to focus on specific profiles or attitudes

### Importing from Betaflight

1. Connect to your flight controller in Betaflight Configurator
2. Go to CLI tab and type `dump` or `diff` to get your settings
3. Copy the relevant rate settings (or the entire dump)
4. Paste into the "Import from CLI" textarea in Profile A or B
5. Click "Import" - the tool will extract and apply all recognized rate parameters

Example CLI format:
```
set rates_type = ACTUAL
set roll_rc_rate = 70
set pitch_rc_rate = 70
set yaw_rc_rate = 70
set roll_rate = 670
set pitch_rate = 670
set yaw_rate = 670
set roll_expo = 0
set pitch_expo = 0
set yaw_expo = 0
set thr_mid = 50
set thr_expo = 0
```

### Exporting to Betaflight

1. Adjust your rates using the sliders
2. The export textarea automatically updates with CLI commands
3. Click "Copy" to copy the commands to clipboard
4. Paste into Betaflight CLI and type `save`

### Saving Profiles

1. **Name your profile** using the text input at the top of each editor
2. **Click "Save Profile"** to add it to your history
3. **Auto-save**: Profiles with custom names are automatically saved 2 seconds after you stop adjusting sliders

### Managing History

- **Load to A/B**: Click to load a saved profile into either comparison slot
- **Delete**: Remove a profile from history
- **Export History**: Download your entire history as a JSON file
- **Import History**: Upload a previously exported history file
- **Clear All**: Remove all saved profiles (with confirmation)

### Filtering View

Use the visibility controls to focus on specific comparisons:
- Toggle Profile A or B to see one at a time
- Toggle individual attitudes (roll/pitch/yaw) to reduce visual clutter
- All combinations are supported for flexible analysis

## Rate Parameters

### Attitude Rates (Roll/Pitch/Yaw)
- **Center Sensitivity (0-255)**: Controls the rate at center stick position
  - Higher values = more responsive at center
  - Affects the slope of the curve when expo is applied

- **Max Rate (200-2000 deg/s)**: Maximum rotation rate at full stick deflection
  - Higher values = faster maximum rotation
  - Typical range: 600-800 deg/s

- **Expo (0-100)**: Exponential curve for stick feel
  - 0 = Linear response
  - Higher values = less sensitive at center, more sensitive at edges
  - Smooths the transition between center and max rate

### Throttle Settings
- **Mid Point (0-100)**: Throttle output at 50% stick position
  - Adjust for hover throttle
  - Typical value: 40-60

- **Expo (0-100)**: Exponential curve for throttle response
  - 0 = Linear throttle response
  - Higher values = finer control at lower throttle
  - Useful for precise altitude control

## Technical Details

### Architecture
- **Vanilla JavaScript**: No frameworks required - fast and lightweight
- **ES6 Modules**: Clean, modular code organization
- **HTML5 Canvas**: High-performance graph rendering
- **LocalStorage**: Client-side profile persistence
- **TDD Approach**: Comprehensive test coverage using Vitest

### File Structure
```
├── index.html              # Main application page
├── styles.css              # Styling and theme
├── src/
│   ├── app.js             # Main application controller
│   ├── rate-calculator.js # Betaflight rate calculations
│   ├── graph-renderer.js  # Canvas-based graph rendering
│   ├── profile-manager.js # Profile storage and history
│   └── cli-parser.js      # CLI import/export parsing
├── tests/
│   ├── rate-calculator.test.js
│   ├── cli-parser.test.js
│   └── profile-manager.test.js
├── Dockerfile             # Container configuration
└── package.json          # Development dependencies
```

### Browser Compatibility
- Modern browsers with ES6 module support
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

### Rate Calculation Algorithm
This tool implements Betaflight's Actual Rates algorithm:
```javascript
rate = rcCommandAbs * centerSensitivity + expof * (maxRate - centerSensitivity)
```

Where:
- `rcCommandAbs` is the absolute RC stick input (0 to 1)
- `centerSensitivity = center * 10` (converts 0-255 to deg/s)
- `expof` is the expo-processed stick input
- `maxRate` is the maximum rate in deg/s

## Development

### Running Tests
```bash
npm install
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

### Project Goals
Built following Test-Driven Development (TDD) principles:
- Good coverage of features
- Fair coverage of functions
- Red-Green-Refactor workflow

## License

MIT
