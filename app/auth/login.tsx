import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import PrimaryButton from '@/components/PrimaryButton';
import { useSession } from '@/context/SessionContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { signIn, signInAsGuest } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!EMAIL_PATTERN.test(email)) {
      setError('Saisis une adresse e-mail valide.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setError(null);
    await signIn({ name: email.split('@')[0], email, isGuest: false });
    router.replace('/(tabs)');
  };

  const continueAsGuest = async () => {
    await signInAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text className="text-3xl font-bold text-gray-900">Bon retour 👋</Text>
        <Text className="mb-8 mt-2 text-gray-500">
          Ton profil reste sur cet appareil : aucune donnée n&apos;est envoyée à un serveur.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          accessibilityLabel="Adresse e-mail"
          className="mb-3 h-12 rounded-xl bg-gray-100 px-4"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mot de passe"
          accessibilityLabel="Mot de passe"
          className="h-12 rounded-xl bg-gray-100 px-4"
        />

        {error ? <Text className="mt-3 text-sm text-red-500">{error}</Text> : null}

        <PrimaryButton label="Se connecter" onPress={submit} className="mt-5" />
        <PrimaryButton label="Continuer en invité" onPress={continueAsGuest} variant="ghost" />

        <Pressable onPress={() => router.push('/auth/register')} accessibilityRole="button">
          <Text className="mt-4 text-center text-gray-500">
            Pas de compte ? <Text className="text-indigo-600">S&apos;inscrire</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
