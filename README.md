# Betaflight Rate Profile Configuration

A web-based tool that replicates Betaflight's rate profile configuration page, allowing you to visualize and adjust FPV drone flight characteristics in real-time.

## Features

- **Actual Rates Support**: Implements Betaflight's Actual Rates algorithm
- **Interactive Rate Curves**: Real-time visualization of roll, pitch, and yaw rate curves
- **Throttle Curve**: Adjustable throttle curve with mid-point and expo control
- **Live Updates**: All changes are reflected immediately in the graphs
- **CLI Import/Export**: Import settings from Betaflight CLI dumps and export your tuned settings
- **Betaflight-style UI**: Dark theme matching the Betaflight Configurator aesthetic

## Parameters

### Rate Settings (Roll/Pitch/Yaw)
- **Center Sensitivity** (0-255): Controls the rate at center stick position
- **Max Rate** (200-2000 deg/s): Maximum rotation rate at full stick deflection
- **Expo** (0-100): Exponential curve for stick feel - higher values make center stick less sensitive

### Throttle Settings
- **Mid Point** (0-1.0): Throttle output at 50% stick position
- **Expo** (0-100): Exponential curve for throttle response

## Usage

1. Open `index.html` in a web browser
2. Adjust the sliders to modify rate parameters
3. Observe the changes in the rate and throttle curves
4. Fine-tune your settings until you find the perfect feel

### Import/Export CLI Settings

**Import:**
1. Copy your Betaflight CLI dump (or just the rate-related settings)
2. Paste into the "Import CLI Dump" text area
3. Click "Import Settings"
4. The app will parse and apply all recognized rate parameters (last value wins if duplicates exist)

**Export:**
1. Adjust your rates using the sliders
2. The export text area automatically updates with CLI commands
3. Click "Copy to Clipboard" to copy the commands
4. Paste into Betaflight CLI and type `save` to apply

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

## Rate Curve Interpretation

- **X-axis**: RC stick input (-1.0 to 1.0)
- **Y-axis**: Rotation rate in degrees per second
- **Roll curve**: Red line
- **Pitch curve**: Green line
- **Yaw curve**: Orange line

The steeper the curve, the more responsive the stick will feel. The Actual Rates algorithm ensures smooth transitions from center stick to full deflection.

## Throttle Curve Interpretation

- **X-axis**: Throttle stick input (0.0 to 1.0)
- **Y-axis**: Throttle output (0.0 to 1.0)
- **Orange dashed line**: Mid-point indicator

Adjust the mid-point to change hover throttle, and use expo to fine-tune throttle sensitivity.

## Technical Details

This application uses:
- Vanilla JavaScript (no frameworks required)
- HTML5 Canvas for graph rendering
- CSS3 for styling

The rate calculation follows Betaflight's Actual Rates formula, providing accurate visualization of how your drone will respond to stick inputs.

## License

MIT
