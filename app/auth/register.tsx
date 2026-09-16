import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import TextField from '@/components/ui/TextField';
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
      className="flex-1 bg-canvas"
    >
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Header title="Créer un compte" showBack />

        <TextField
          label="Prénom"
          variant="surface"
          value={name}
          onChangeText={setName}
          placeholder="Camille"
          accessibilityLabel="Prénom"
          containerClassName="mb-3"
        />
        <TextField
          label="Adresse e-mail"
          variant="surface"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="prenom@exemple.fr"
          accessibilityLabel="Adresse e-mail"
          containerClassName="mb-3"
        />
        <TextField
          label="Mot de passe"
          variant="surface"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="6 caractères minimum"
          accessibilityLabel="Mot de passe"
          error={error}
        />

        <Text className="mb-5 mt-4 text-xs leading-5 text-muted">
          Le compte est créé localement sur cet appareil. Le mot de passe sert uniquement à valider
          le formulaire : il n&apos;est ni transmis, ni conservé.
        </Text>

        <PrimaryButton label="Créer mon compte" onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
