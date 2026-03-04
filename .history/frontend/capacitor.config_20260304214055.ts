import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.autotrainer.app',
  appName: 'Auto Trainer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;