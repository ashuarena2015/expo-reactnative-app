export default ({ config }) => {
    return {
      ...config,
      extra: {
        API_URL: process.env.API_URL || 'https://default.api.com',
        PHOTO_URL: process.env.PHOTO_URL || 'default-key',
      },
      expo: {
        ios: {
          infoPlist: {
            NSFaceIDUsageDescription: "This app uses Face ID to authenticate the user."
          }
        }
      }
    };
  };
  