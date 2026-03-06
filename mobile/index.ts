// ─── Polyfills (must be first, before everything else) ───
import { Platform } from 'react-native';

// Ensure global is set up for socket.io-client
if (typeof global.process === 'undefined') {
    (global as any).process = { env: { NODE_ENV: 'production' }, nextTick: setImmediate };
}
if (typeof global.Buffer === 'undefined') {
    (global as any).Buffer = require('buffer').Buffer;
}

// ─── App Entry ───────────────────────────────────────
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
