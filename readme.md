# Figlytics Client

[![NPM Version](https://img.shields.io/npm/v/figlytics.svg)](https://www.npmjs.com/package/figlytics) <!-- Placeholder: Update package name if different -->
[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

A simple client library for sending analytics data from your Figma plugin to the Figlytics service.

## Installation

```bash
npm install figlytics 
# or
yarn add figlytics
```

## Initalizing & tracking usage

Here's how to get started using Figlytics in your Figma plugin's `code.ts` (or similar):

```typescript

import { Figlytics } from "figlytics"; // Placeholder: Update package name if different

// Initialize Figlytics when your plugin starts in your plugin/server code, not UI code.
const figlytics = new Figlytics(figma, {
  projectPublicKey: "YOUR_PROJECT_PUBLIC_KEY",
  onInitialize: () => {
    console.log("Figlytics initialized!");
  },
});

// Track a custom event (e.g., a feature being used)
figma.ui.onmessage = async (params: any) => {
  figlytics.onEvent("feature_used", {
    message: "RELEVANT MESSAGE HERE",
  });
};
```

## Configuration

When initializing `Figlytics`, you can pass a configuration object:

- `projectPublicKey` (string, **required**): Your unique project key from the Figlytics dashboard.
- `onInitialize` (function, optional): A callback function that runs after Figlytics has successfully initialized.


## Events

Figlytics automatically tracks:

- `plugin_started`: When the plugin is launched.
- `plugin_closed`: When the plugin is closed.
- `error_occurred`: Attempts to catch unhandled errors (requires window context).

You can track custom events using the `onEvent(eventName: string, eventData: any)` method. Some predefined event names are suggested (but you can use any string):

- `api_call`
- `ui_interaction`
- `payment_completed`
- `payment_initialized`
- `payment_failed`
- `feature_used`

## License

This library is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

You are free to:

- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:

- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
- **NonCommercial** — You may not use the material for commercial purposes.

[View License Deed](https://creativecommons.org/licenses/by-nc/4.0/) | [View Legal Code](https://creativecommons.org/licenses/by-nc/4.0/legalcode)
