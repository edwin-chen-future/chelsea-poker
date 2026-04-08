import * as Haptics from 'expo-haptics';

export async function impact() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
