import { registerNativeHandlers } from 'react-native-activity-feed-core';
import { launchImageLibrary } from 'react-native-image-picker';
import { Platform } from 'react-native';
registerNativeHandlers({
  pickImage: () =>
    new Promise((resolve, reject) => {
      launchImageLibrary(null, (response) => {
        if (response.error) {
          reject(Error(response.error));
        }
        let { uri } = response;
        if (Platform.OS === 'android') {
          uri = 'file://' + response.path;
        }

        resolve({
          cancelled: response.didCancel,
          uri,
        });
      });
    }),
});

export * from 'react-native-activity-feed-core';
