import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useGlobalStyles } from '@/styles/globalStyles';
import  Button from '@/components/Button';

export default function FourOhFour() {
  const styles = useGlobalStyles();
  const router = useRouter();

  return (
    <View style={[styles.container, {
      justifyContent: 'center',
      alignItems: 'center',
    }]}>
      <Button label="Go Home " onPress={() => router.push('/')} />
    </View>
  );
}
