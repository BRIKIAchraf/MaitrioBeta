import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, FlatList } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "home",
    title: "Bienvenue sur Maison",
    subtitle: "La plateforme premium de services a domicile qui connecte clients et artisans certifies",
    color: Colors.primary,
  },
  {
    icon: "shield-checkmark",
    title: "Artisans verifies",
    subtitle: "Tous nos artisans passent une verification KYC rigoureuse pour garantir votre securite",
    color: Colors.info,
  },
  {
    icon: "location",
    title: "Suivi en temps reel",
    subtitle: "Suivez l'avancement de vos missions avec GPS check-in/check-out et timeline detaillee",
    color: "#22C55E",
  },
  {
    icon: "card",
    title: "Paiement securise",
    subtitle: "Vos paiements sont proteges en sequestre jusqu'a validation des travaux",
    color: Colors.accent,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace("/");
    }
  }

  function handleSkip() {
    router.replace("/");
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.skipRow}>
        {currentIndex < SLIDES.length - 1 ? (
          <Pressable style={({ pressed }) => pressed && { opacity: 0.6 }} onPress={handleSkip}>
            <Text style={styles.skipText}>Passer</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + "18" }]}>
              <View style={[styles.iconInner, { backgroundColor: item.color + "25" }]}>
                <Ionicons name={item.icon as any} size={56} color={item.color} />
              </View>
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom || (Platform.OS === "web" ? 34 : 24) }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={handleNext}
        >
          <LinearGradient
            colors={currentIndex === SLIDES.length - 1 ? [Colors.accent, Colors.accentLight] : [Colors.primary, Colors.primaryLight]}
            style={styles.nextBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.nextBtnText, currentIndex === SLIDES.length - 1 && { color: Colors.primary }]}>
              {currentIndex === SLIDES.length - 1 ? "Commencer" : "Suivant"}
            </Text>
            <Ionicons
              name={currentIndex === SLIDES.length - 1 ? "arrow-forward" : "chevron-forward"}
              size={20}
              color={currentIndex === SLIDES.length - 1 ? Colors.primary : "#fff"}
            />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skipRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 24, paddingVertical: 12 },
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 24 },
  iconCircle: { width: 160, height: 160, borderRadius: 80, alignItems: "center", justifyContent: "center" },
  iconInner: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  slideTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text, textAlign: "center" },
  slideSubtitle: { fontSize: 16, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 24 },
  bottomSection: { paddingHorizontal: 24, gap: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  nextBtn: { borderRadius: 16, overflow: "hidden" },
  nextBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18, borderRadius: 16 },
  nextBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
