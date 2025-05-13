import { Provider } from 'react-redux';
import store from './services/store';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';

import MainLayout from './MainLayout/MainLayout';
import Login from './login/login';
import AppText from './Forms/AppText';

export default function HomeScreen() { 

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
  });

  if (!fontsLoaded) {
    return <AppText>Loading</AppText>; // or a custom loading screen
  }

  return (
    <Provider store={store}>
      <Stack.Screen options={{ headerBackVisible: false, headerStyle: StyleSheet.create({ header: { backgroundColor: '#fff', color: '#fff' } }).header, headerShown: false }} />
      <MainLayout><Login /></MainLayout>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
