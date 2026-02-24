import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/auth-context";
import { useMissions } from "@/context/mission-context";

const { width } = Dimensions.get("window");

const CATEGORY_ICONS: Record<string, string> = {
  plomberie: "water",
  electricite: "flash",
  peinture: "color-palette",
  menuiserie: "hammer",
  jardinage: "leaf",
  nettoyage: "sparkles",
  climatisation: "thermometer",
  maconnerie: "construct",
  autre: "build",
};

const QUICK_ACTIONS = [
  { key: "plomberie", label: "Plomberie", icon: "water", color: "#3B82F6" },
  { key: "electricite", label: "Électricité", icon: "flash", color: "#F59E0B" },
  { key: "peinture", label: "Peinture", icon: "color-palette", color: "#EC4899" },
  { key: "menuiserie", label: "Menuiserie", icon: "hammer", color: "#8B5CF6" },
  { key: "jardinage", label: "Jardinage", icon: "leaf", color: "#22C55E" },
  { key: "nettoyage", label: "Nettoyage", icon: "sparkles", color: "#06B6D4" },
];

export default function ClientHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getMissionsByClient } = useMissions();

  const missions = user ? getMissionsByClient(user.id) : [];
  const activeMissions = missions.filter((m) =>
    ["pending", "accepted", "in_progress"].includes(m.status)
  );
  const completedCount = missions.filter((m) => m.status === "completed").length;

  const greeting = getGreeting();

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 100 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={[styles.header, { paddingTop: (insets.top || (Platform.OS === "web" ? 67 : 0)) + 16 }]}
      >
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.name?.split(" ")[0] || "Client"}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.notifBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {}}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreLabel}>Score Logement</Text>
            <Text style={styles.scoreValue}>{user?.housingScore ?? 72}</Text>
            <ScoreBar score={user?.housingScore ?? 72} />
          </View>
          <View style={styles.scoreRight}>
            <View style={styles.scoreStat}>
              <Text style={styles.scoreStatValue}>{missions.length}</Text>
              <Text style={styles.scoreStatLabel}>Missions</Text>
            </View>
            <View style={styles.scoreStatDivider} />
            <View style={styles.scoreStat}>
              <Text style={styles.scoreStatValue}>{completedCount}</Text>
              <Text style={styles.scoreStatLabel}>Terminées</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Pressable
          style={({ pressed }) => [styles.newMissionBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/mission/new");
          }}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentLight]}
            style={styles.newMissionBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add-circle" size={22} color={Colors.primary} />
            <Text style={styles.newMissionBtnText}>Nouvelle demande</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </LinearGradient>
        </Pressable>

        <SectionHeader title="Catégories" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
        >
          {QUICK_ACTIONS.map((action) => (
            <QuickActionBtn
              key={action.key}
              {...action}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({ pathname: "/mission/new", params: { category: action.key } });
              }}
            />
          ))}
        </ScrollView>

        {activeMissions.length > 0 && (
          <>
            <SectionHeader title="Missions en cours" actionLabel="Voir tout" onAction={() => router.push("/(client)/missions")} />
            {activeMissions.slice(0, 3).map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onPress={() => router.push({ pathname: "/mission/[id]", params: { id: mission.id } })}
              />
            ))}
          </>
        )}

        {activeMissions.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="home-outline" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucune mission active</Text>
            <Text style={styles.emptySubtitle}>Créez votre première demande pour trouver un artisan qualifié</Text>
          </View>
        )}

        <SectionHeader title="Nos engagements" />
        <View style={styles.pledgesGrid}>
          <PledgeCard icon="shield-checkmark" title="Artisans vérifiés" text="100% des artisans passent une vérification d'identité" color={Colors.info} />
          <PledgeCard icon="time" title="Réactivité" text="Réponse garantie en moins de 2 heures" color={Colors.success} />
          <PledgeCard icon="card" title="Paiement sécurisé" text="Votre paiement est protégé jusqu'à validation" color={Colors.accent} />
          <PledgeCard icon="star" title="Satisfaction" text="98% de clients satisfaits de nos artisans" color={Colors.warning} />
        </View>
      </View>
    </ScrollView>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = score / 100;
  const color = score >= 80 ? Colors.success : score >= 60 ? Colors.warning : Colors.danger;
  return (
    <View style={styles.scoreBar}>
      <View style={[styles.scoreBarFill, { width: `${score}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function QuickActionBtn({ label, icon, color, onPress }: { label: string; icon: any; color: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.93); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={[styles.quickAction, animStyle]}>
        <View style={[styles.quickActionIcon, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function MissionCard({ mission, onPress }: { mission: any; onPress: () => void }) {
  const statusConfig = getMissionStatusConfig(mission.status);
  return (
    <Pressable
      style={({ pressed }) => [styles.missionCard, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
      onPress={onPress}
    >
      <View style={styles.missionCardRow}>
        <View style={[styles.missionCategoryIcon, { backgroundColor: Colors.accentSoft }]}>
          <Ionicons name={(CATEGORY_ICONS[mission.category] || "build") as any} size={20} color={Colors.accent} />
        </View>
        <View style={styles.missionCardContent}>
          <Text style={styles.missionCardTitle} numberOfLines={1}>{mission.title}</Text>
          <Text style={styles.missionCardSub} numberOfLines={1}>{mission.address}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>
      <View style={styles.missionCardFooter}>
        <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.missionCardDate}>{formatDate(mission.scheduledDate)} à {mission.scheduledTime}</Text>
        {mission.budget && (
          <>
            <View style={styles.dotDivider} />
            <Text style={styles.missionCardBudget}>{mission.budget}€</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

function PledgeCard({ icon, title, text, color }: { icon: any; title: string; text: string; color: string }) {
  return (
    <View style={styles.pledgeCard}>
      <View style={[styles.pledgeIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.pledgeTitle}>{title}</Text>
      <Text style={styles.pledgeText}>{text}</Text>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour,";
  if (h < 18) return "Bon après-midi,";
  return "Bonsoir,";
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function getMissionStatusConfig(status: string) {
  switch (status) {
    case "pending": return { label: "En attente", color: Colors.warning, bg: Colors.warningLight };
    case "accepted": return { label: "Accepté", color: Colors.info, bg: Colors.infoLight };
    case "in_progress": return { label: "En cours", color: Colors.primary, bg: Colors.infoLight };
    case "completed": return { label: "Terminé", color: Colors.success, bg: Colors.successLight };
    case "cancelled": return { label: "Annulé", color: Colors.danger, bg: Colors.dangerLight };
    default: return { label: status, color: Colors.textMuted, bg: Colors.surfaceSecondary };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 24, paddingBottom: 24, position: "relative", overflow: "hidden" },
  headerDecor: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -60,
    right: -60,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  scoreLeft: { flex: 1 },
  scoreLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  scoreValue: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#FFFFFF", lineHeight: 42 },
  scoreBar: { height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 8, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 2 },
  scoreRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  scoreStat: { alignItems: "center" },
  scoreStatValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  scoreStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  scoreStatDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  body: { padding: 20, gap: 4 },
  newMissionBtn: { marginBottom: 8, borderRadius: 18, overflow: "hidden" },
  newMissionBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
  },
  newMissionBtnText: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.primary, marginLeft: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text },
  sectionAction: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.primary },
  quickActionsRow: { gap: 10, paddingVertical: 4 },
  quickAction: { alignItems: "center", gap: 8, width: 72 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.text, textAlign: "center" },
  missionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  missionCardRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  missionCategoryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  missionCardContent: { flex: 1 },
  missionCardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  missionCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  missionCardFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  missionCardDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  dotDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted },
  missionCardBudget: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", maxWidth: 280 },
  pledgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  pledgeCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  pledgeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pledgeTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  pledgeText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 16 },
});
