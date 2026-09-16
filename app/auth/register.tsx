import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import Header from '@/components/Header';
import PrimaryButton from '@/components/PrimaryButton';
import { useSession } from '@/context/SessionContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { signIn } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (name.trim().length < 2) {
      setError('Indique ton prénom.');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('Saisis une adresse e-mail valide.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setError(null);
    await signIn({ name: name.trim(), email, isGuest: false });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Header title="Créer un compte" showBack />

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Prénom"
          accessibilityLabel="Prénom"
          className="mb-3 h-12 rounded-xl bg-gray-100 px-4"
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          accessibilityLabel="Adresse e-mail"
          className="mb-3 h-12 rounded-xl bg-gray-100 px-4"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mot de passe (6 caractères minimum)"
          accessibilityLabel="Mot de passe"
          className="h-12 rounded-xl bg-gray-100 px-4"
        />

        {error ? <Text className="mt-3 text-sm text-red-500">{error}</Text> : null}

        <Text className="mb-5 mt-4 text-xs leading-5 text-gray-500">
          Le compte est créé localement sur cet appareil. Le mot de passe sert uniquement à valider
          le formulaire : il n&apos;est ni transmis, ni conservé.
        </Text>

        <PrimaryButton label="Créer mon compte" onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
