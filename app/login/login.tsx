/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { FC, useEffect, useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Button,
  Pressable
} from 'react-native';
import AppText from '../Forms/AppText';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../services/store';
import InputText from '../Forms/InputText';
import { useRouter } from 'expo-router';

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Icons
import Icon from 'react-native-vector-icons/FontAwesome5';


interface PageProps {
  navigation?: any;
}

const Login:FC<PageProps> = () => {

  const router = useRouter();
  
  const [isScreenLoading, setIsScreenLoading] = useState(false);
  const [isEmailScreen, setIsEmailScreen] = useState(true);
  const [isOtpScreen, setIsOtpScreen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setIsEmailScreen(true);
      setIsOtpScreen(false);
    }, 2000);
  }, []);

  const [formInput, setFormInput] = useState({
      email: '',
      otp: ''
  });

  const handlChange = (name: string, value: string) => {
      setFormInput((prevState) => ({
          ...prevState,
          [name]: value,
      }));
  };

  const dispatch = useDispatch<AppDispatch>();

  // Form Input validation
  const [error, setError] = useState('');
  const validate = () => {
    if (!formInput?.email.includes('@')) {
      setError('Invalid email address');
      return false;
    }
    setError('');
    return true;
  };
  
  const saveTokenSecurely = async (key: string, value: string) => {
    return await SecureStore.setItemAsync(key, value);
  }

  const handleCreate = async () => {
    if(validate()) {
      setIsScreenLoading(true);
      const response = await dispatch({
        type: 'apiRequest',
        payload: {
          url: `/api/account/create`,
          method: 'POST',
          onError: 'GLOBAL_MESSAGE',
          dispatchType: 'accountCreation',
          body: {
            userInfo: {
              email: formInput?.email,
            }
          }
        },
      }) as unknown as { isLogin: boolean, isOtpSent: boolean, isLoginOtpSent: boolean };
      if(response?.isOtpSent) {
        setIsOtpScreen(true);
        setIsEmailScreen(false);
        setIsScreenLoading(false);
        return;
      }
      setIsScreenLoading(false);
    }
  }

  const handleVerify = async () => {
    setIsScreenLoading(true);

    const response = await dispatch({
      type: 'apiRequest',
      payload: {
        url: `api/account/verify`,
        method: 'POST',
        onError: 'GLOBAL_MESSAGE',
        dispatchType: 'accountCreation',
        body: {
          otp: formInput?.otp,
          email: formInput?.email,
        }
      },
    }) as unknown as { isLogin: boolean, isVerified: boolean, token: string };

    if (response?.token) {
      setFormInput((prevState) => ({
        ...prevState,
        otp: ''
      }));
      if (Platform.OS !== 'web') {
        await saveTokenSecurely('isUserVerified', 'true');
      }
      setAuthenticated(false);
      setIsScreenLoading(false);
      setIsOtpScreen(false);
      setIsEmailScreen(false);
      router.push('two');
    }

    setIsScreenLoading(false);
  };

  // Biometrics Authentication logic
  const handleBiometricAuth = async () => {
    setAuthenticated(false);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });
    if (result.success) {
      setAuthenticated(true);
    } else {
      alert('Please use a valid pin');
    }

  };

  const authLogin = async () => {
    const response = await dispatch({
      type: 'apiRequest',
      payload: {
        url: `api/account/auth`,
        method: 'GET',
        onError: 'GLOBAL_MESSAGE',
        dispatchType: 'authLogin',
      },
    }) as unknown as { isAuthLogin: boolean };
    if(response?.isAuthLogin) {
      router.push('one');
    }
  }

  useEffect(() => {
    authLogin();
  }, []);

  useEffect(() => {
    if(authenticated) {
      authLogin();
    }
  }, [authenticated]);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        style={styles.mainWrpper}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.formContainer}>
          <View style={styles.loginContainer}>
            <AppText style={{ fontSize: 32, lineHeight: 36 }}>Sign in or create an account.</AppText>
            {isScreenLoading ? 
              <View style={styles.activityContainer}>
                <ActivityIndicator color="#999" />
              </View> :
              <View>
                {isEmailScreen ? <View>
                  <InputText
                    placeholderText="Enter your email"
                    handleChange={handlChange}
                    label={'Email'}
                    name={'email'}
                    style={{ marginBottom: 8 }}
                    errorMessage={error}
                  />
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleCreate}
                    activeOpacity={0.8}
                  >
                    <AppText style={styles.buttonText}>Continue</AppText>
                  </TouchableOpacity>
                </View> : null }
                {isOtpScreen ? <View>
                  <InputText
                    placeholderText="Enter your OTP"
                    handleChange={handlChange}
                    label={'OTP'}
                    name={'otp'}
                    style={{ marginBottom: 8 }}
                  />
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleVerify}
                    activeOpacity={0.8}
                  >
                    <AppText style={styles.buttonText}>Verify your email</AppText>
                  </TouchableOpacity>
                </View> : null}
              </View>
            }
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleCreate}
              activeOpacity={0.8}
            >
              <AppText style={styles.buttonText}>Continue with Google</AppText>
            </TouchableOpacity>
            <Pressable
              onPress={handleBiometricAuth}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: 20,
                  opacity: pressed ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Icon name="user-lock" size={50} color="#27548A" />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <AppText>Try login with authentication</AppText>
            </View>
          </View>
          <AppText style={{ color: '#fff' }}>By continuing you agree to Terms of Services and Privacy Policy</AppText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainWrpper: {
    height: '100%',
    width: '100%',
    padding: 32
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 58,
  },
  heading1: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 20,
  },
  activityContainer: {
    display: 'flex',
    justifyContent: 'center',
    height: 150,
    alignItems: 'center'
  },
  loginContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#999',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    paddingTop: 32,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 32,
    gap: 16
  },
  formContainer: {
    flex: 1,
    minHeight: '100%',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#A4B465',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    color: '#fff',
  },
  secondaryBtn: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderColor: '#cacaca',
    borderWidth: 1,
    color: '#999'
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonText: {
    fontSize: 16,
    display: 'flex',
    justifyContent: 'center'
  },
});

export default Login;
