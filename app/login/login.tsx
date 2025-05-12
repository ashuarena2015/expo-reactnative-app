/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { FC, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Button,
} from 'react-native';
import AppText from '../Forms/AppText';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../services/store';
import InputText from '../Forms/InputText';

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Icons
import Icon from 'react-native-vector-icons/FontAwesome5';


interface PageProps {
  navigation?: any;
}

const Login:FC<PageProps> = ({ navigation }) => {
  
  const [isScreenLoading, setIsScreenLoading] = useState(false);
  const [isEmailScreen, setIsEmailScreen] = useState(true);
  const [isOtpScreen, setIsOtpScreen] = useState(false);
  const [isPasswordScreen, setIsPasswordScreen] = useState(false);
  const [isAccountVerified, setIsAccountVerified] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const [formInput, setFormInput] = useState({
      email: '',
      password: '',
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
  
  const saveTokenSecurely = async (key, value) => {
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
              password: formInput?.password,
            }
          }
        },
      }) as unknown as { isLogin: boolean, isOtpSent: boolean, isVerified: boolean };
      if(response?.isOtpSent) {
        setIsOtpScreen(true);
        setIsEmailScreen(false);
      }
      if(response?.isVerified) {
        if (Platform.OS !== 'web') {
          alert('password saved for mobile authentication')
          await saveTokenSecurely('password', formInput?.password);
        }
        setIsPasswordScreen(true);
        setIsEmailScreen(false);
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
          password: formInput?.password
        }
      },
    }) as unknown as { isLogin: boolean, isVerified: boolean };
    if(response?.isVerified) {
      // Store credentials securely
      alert('Your account has been verified. Thankyou!');
      if (Platform.OS !== 'web') {
        await saveTokenSecurely('email', formInput?.email);
      }
      setIsScreenLoading(false);
      setIsAccountVerified(true);
      setIsOtpScreen(false);
      setIsEmailScreen(false);
    }
    setIsScreenLoading(false);
  };
  
  // PIN Authentication logic
  // const [fallbackVisible, setFallbackVisible] = useState(false);
  // const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handleBiometricAuth = async () => {

    // only If fallback integrate
    // const compatible = await LocalAuthentication.hasHardwareAsync();
    // if (!compatible) {
    //   alert('Error, Your device does not support biometrics.');
    //   return setFallbackVisible(true);
    // }

    // const enrolled = await LocalAuthentication.isEnrolledAsync();
    // if (!enrolled) {
    //   alert('No biometrics are enrolled.');
    //   return setFallbackVisible(true);
    // }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate',
      fallbackLabel: 'Use Passcode',
    });
    if (result.success) {
      setAuthenticated(true);
      alert('Authenticated with biometrics!');
      const responseEmailSecure = await SecureStore.getItemAsync('email');
      alert(JSON.stringify(responseEmailSecure));
      const responsePasswordSecure = await SecureStore.getItemAsync('password');
      alert(JSON.stringify(responsePasswordSecure));
    } else {
      alert('Please use valid pin');
    }
  };

  // const handlePINLogin = () => {
  //   const correctPIN = '1234'; // Replace with your actual logic (e.g. secure storage or backend)
  //   if (pin === correctPIN) {
  //     setAuthenticated(true);
  //     alert('Success, Authenticated with PIN!');
  //   } else {
  //     alert('Error, Incorrect PIN.');
  //   }
  // };
  
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
                {(isEmailScreen || isAccountVerified) ? <View>
                  {isAccountVerified ? <AppText>Your account has been created, you can login now.</AppText> : null}
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
                {isPasswordScreen ? <View>
                  <InputText
                    placeholderText="Enter your password"
                    handleChange={handlChange}
                    label={'Password'}
                    name={'password'}
                    style={{ marginBottom: 8 }}
                  />
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleVerify}
                      activeOpacity={0.8}
                    >
                      <AppText style={styles.buttonText}>Continue</AppText>
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
            <View onTouchStart={handleBiometricAuth} style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
              <Icon name="user-lock" size={50} color="#27548A" />
            </View>
            {/* In case of pin authentication failed */}
            {/* {fallbackVisible ?
              <>
                  <View style={{ marginTop: 20 }}>
                    <AppText>Or enter your PIN:</AppText>
                    <TextInput
                      secureTextEntry
                      keyboardType="numeric"
                      value={pin}
                      onChangeText={setPin}
                      placeholder="Enter PIN"
                      style={{
                        borderWidth: 1,
                        borderColor: '#ccc',
                        padding: 10,
                        marginTop: 10,
                        borderRadius: 5,
                      }}
                    />
                    <Button title="Login with PIN" onPress={handlePINLogin} />
                  </View>
              </>
              : null
            } */}
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
