import { Stack } from 'expo-router';

import { LinkRow, Screen, Txt } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';

export default function NotFound() {
  const c = usePalette();
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Nem található' }} />
      <Txt v="title">Ez az oldal nem létezik</Txt>
      <Txt color={c.textSecondary}>Lehet, hogy átneveztük a témát. A kezdőlapról vagy a keresőből biztosan megtalálod.</Txt>
      <LinkRow href="/">
        <Txt color={c.brand}>← Vissza a kezdőlapra</Txt>
      </LinkRow>
    </Screen>
  );
}
