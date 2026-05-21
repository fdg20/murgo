import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSignIn, useSignUp, useOAuth, useAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { RolePicker } from '../../components/RolePicker';
import { SignupRole } from '../../constants/roles';
import { setAuthToken } from '../../api/client';
import { usersApi } from '../../api/services';
import { deriveUsernameFromEmail, isValidUsername } from '../../utils/auth';

WebBrowser.maybeCompleteAuthSession();

type AuthStep = 'credentials' | 'verify-email';

interface Props {
  onAuthenticated: () => void;
}

type SignUpAttempt = NonNullable<ReturnType<typeof useSignUp>['signUp']>;

const PHONE_REQUIRED_MESSAGE =
  'Clerk still requires a phone number for sign-up. In Clerk Dashboard go to User & authentication → Phone, then disable phone or set it to optional.';

export function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<AuthStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupRole, setSignupRole] = useState<SignupRole>('CUSTOMER');

  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { getToken } = useAuth();

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  useEffect(() => {
    if (mode !== 'signup' || username.trim()) return;
    if (!email.includes('@')) return;
    setUsername(deriveUsernameFromEmail(email));
  }, [email, mode, username]);

  const clerkReady =
    signInLoaded && signUpLoaded && signIn !== undefined && signUp !== undefined;

  const applySignupRole = async (roleForClerk: SignupRole) => {
    try {
      const token = await getToken();
      if (!token) return;
      setAuthToken(token);
      await usersApi.setRole(roleForClerk);
    } catch {
      // Backend may be unreachable; App.tsx can set role after load.
    }
  };

  const finishSession = async (
    sessionId: string | null,
    setActive: typeof setSignInActive,
    roleForClerk?: SignupRole,
  ) => {
    if (!sessionId || !setActive) {
      throw new Error('Could not create a session. Please try again.');
    }
    await setActive({ session: sessionId });

    if (roleForClerk) {
      await applySignupRole(roleForClerk);
    }

    onAuthenticated();
  };

  const assertNoPhoneRequirement = (attempt: SignUpAttempt) => {
    const missing = attempt.missingFields ?? [];
    const unverified = attempt.unverifiedFields ?? [];

    if (missing.includes('phone_number') || unverified.includes('phone_number')) {
      throw new Error(PHONE_REQUIRED_MESSAGE);
    }
  };

  const buildSignupPatch = (missing: string[]) => {
    const patch: {
      legalAccepted?: boolean;
      password?: string;
      emailAddress?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
    } = {};

    if (missing.includes('legal_accepted')) {
      patch.legalAccepted = true;
    }
    if (missing.includes('password') && password) {
      patch.password = password;
    }
    if (missing.includes('email_address') && email) {
      patch.emailAddress = email.trim();
    }
    if (missing.includes('username') && username.trim()) {
      patch.username = username.trim();
    }
    if (missing.includes('first_name')) {
      patch.firstName = username.trim() || email.split('@')[0] || 'MurGo';
    }
    if (missing.includes('last_name')) {
      patch.lastName = 'User';
    }

    return patch;
  };

  const completeSignUp = async (
    roleForClerk: SignupRole,
    initialAttempt: SignUpAttempt,
  ) => {
    if (!signUp) {
      throw new Error('Sign up session expired. Please start again.');
    }

    let attempt = initialAttempt;
    assertNoPhoneRequirement(attempt);

    for (let i = 0; i < 3; i += 1) {
      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await finishSession(attempt.createdSessionId, setSignUpActive, roleForClerk);
        return;
      }

      if (attempt.status !== 'missing_requirements') {
        break;
      }

      assertNoPhoneRequirement(attempt);

      const missing = attempt.missingFields ?? [];
      const patch = buildSignupPatch(missing);

      if (Object.keys(patch).length > 0) {
        attempt = await signUp.update(patch);
        continue;
      }

      if (attempt.unverifiedFields?.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify-email');
        Alert.alert('Verify your email', 'Enter the verification code sent to your email.');
        return;
      }

      break;
    }

    assertNoPhoneRequirement(attempt);

    const stillMissing = attempt.missingFields?.join(', ') || 'unknown fields';
    const stillUnverified = attempt.unverifiedFields?.join(', ') || 'none';
    throw new Error(
      `Sign up is not finished yet. Missing: ${stillMissing}. Unverified: ${stillUnverified}.`,
    );
  };

  const validateSignupFields = () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return false;
    }
    if (!username.trim() || !isValidUsername(username.trim())) {
      Alert.alert(
        'Error',
        'Choose a username with 3–24 letters, numbers, or underscores.',
      );
      return false;
    }
    return true;
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    if (!clerkReady) {
      Alert.alert('Error', 'Authentication is still loading. Please wait a moment.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const result = await signIn.create({
          identifier: email.trim(),
          password,
        });

        if (result.status === 'complete') {
          await finishSession(result.createdSessionId, setSignInActive);
          return;
        }

        if (result.status === 'needs_second_factor') {
          Alert.alert(
            'Verification required',
            'Complete two-factor authentication in your email app.',
          );
          return;
        }

        Alert.alert('Sign in incomplete', 'Additional verification is required for this account.');
        return;
      }

      if (!validateSignupFields()) {
        return;
      }

      const created = await signUp.create({
        emailAddress: email.trim(),
        password,
        username: username.trim(),
        legalAccepted: true,
        unsafeMetadata: { role: signupRole },
      });

      assertNoPhoneRequirement(created);

      if (created.status === 'complete' && created.createdSessionId) {
        await finishSession(created.createdSessionId, setSignUpActive, signupRole);
        return;
      }

      if (created.unverifiedFields?.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify-email');
        Alert.alert('Check your email', 'Enter the 6-digit verification code we sent you.');
        return;
      }

      await completeSignUp(signupRole, created);
    } catch (err: unknown) {
      const clerkError = (err as { errors?: { message: string; code?: string }[] })
        ?.errors?.[0];
      const message =
        clerkError?.code === 'native_api_disabled'
          ? 'Clerk Native API is disabled. In Clerk Dashboard go to Configure → Native applications and enable it.'
          : clerkError?.message ??
            (err as Error).message ??
            'Authentication failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Enter the verification code from your email');
      return;
    }
    if (!signUp) {
      Alert.alert('Error', 'Sign up session expired. Please start again.');
      setStep('credentials');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await finishSession(result.createdSessionId, setSignUpActive, signupRole);
        return;
      }

      await completeSignUp(signupRole, result);
    } catch (err: unknown) {
      const message =
        (err as { errors?: { message: string }[] })?.errors?.[0]?.message ??
        (err as Error).message ??
        'Invalid verification code';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailCode = async () => {
    if (!signUp) return;
    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code sent', 'A new verification code was sent to your email.');
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        if (mode === 'signup') {
          await applySignupRole(signupRole);
        }
        onAuthenticated();
      }
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  const resetToCredentials = () => {
    setStep('credentials');
    setVerificationCode('');
  };

  return (
    <ScrollView className="flex-1 bg-secondary">
      <View className="flex-1 px-6 pt-20 pb-10">
        <Image
          source={require('../../../assets/murgo-logo.png')}
          className="w-20 h-20 mb-4 rounded-2xl"
          resizeMode="contain"
        />
        <Text className="text-white text-3xl font-bold mb-2">MurGo</Text>
        <Text className="text-gray-300 text-base mb-10">
          Food delivery in Murcia, Negros Occidental
        </Text>

        <View className="bg-white rounded-2xl p-6 shadow-lg">
          {step === 'verify-email' ? (
            <>
              <Text className="text-secondary text-xl font-semibold mb-2">
                Verify your email
              </Text>
              <Text className="text-gray-500 text-sm mb-6">
                We sent a code to {email}
              </Text>

              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base text-center tracking-widest"
                placeholder="6-digit code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
              />

              <TouchableOpacity
                className="bg-primary rounded-xl py-4 mb-3"
                onPress={handleVerifyEmail}
                disabled={loading}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mb-4"
                onPress={handleResendEmailCode}
                disabled={loading}
              >
                <Text className="text-primary text-center">Resend code</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={resetToCredentials}>
                <Text className="text-gray-500 text-center">Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-secondary text-xl font-semibold mb-6">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>

              {mode === 'signup' ? (
                <>
                  <RolePicker value={signupRole} onChange={setSignupRole} compact />
                  <Text className="text-gray-500 text-xs mb-4">
                    By signing up, you agree to MurGo&apos;s Terms of Service.
                  </Text>
                </>
              ) : null}

              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              {mode === 'signup' ? (
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base"
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              ) : null}

              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 mb-6 text-base"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'signin' ? 'password' : 'new-password'}
              />

              <TouchableOpacity
                className="bg-primary rounded-xl py-4 mb-4"
                onPress={handleEmailAuth}
                disabled={loading || !clerkReady}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {loading
                    ? 'Please wait...'
                    : mode === 'signin'
                      ? 'Sign In'
                      : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="border border-gray-200 rounded-xl py-4 mb-4"
                onPress={handleGoogle}
              >
                <Text className="text-secondary text-center font-medium">
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setStep('credentials');
                }}
              >
                <Text className="text-primary text-center">
                  {mode === 'signin'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text className="text-gray-400 text-center text-xs mt-8">
          Service available only within Murcia, Negros Occidental
        </Text>
      </View>
    </ScrollView>
  );
}
