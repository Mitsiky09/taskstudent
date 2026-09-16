import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import TextField from '@/components/ui/TextField';
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
      className="flex-1 bg-canvas"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <Text className="text-[28px] font-bold tracking-tight text-ink">Bon retour 👋</Text>
        <Text className="mb-8 mt-2 text-sm text-muted">
          Ton profil reste sur cet appareil : aucune donnée n&apos;est envoyée à un serveur.
        </Text>

        <TextField
          label="Adresse e-mail"
          variant="surface"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
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
          placeholder="••••••"
          accessibilityLabel="Mot de passe"
          error={error}
        />

        <PrimaryButton label="Se connecter" onPress={submit} className="mt-5" />
        <PrimaryButton label="Continuer en invité" onPress={continueAsGuest} variant="ghost" />

        <Pressable onPress={() => router.push('/auth/register')} accessibilityRole="button">
          <Text className="mt-4 text-center text-sm text-muted">
            Pas de compte ? <Text className="font-semibold text-primary">S&apos;inscrire</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
