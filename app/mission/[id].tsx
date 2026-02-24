import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/auth-context";
import { useMissions } from "@/context/mission-context";
import { useChat } from "@/context/chat-context";

const STATUS_STEPS = ["pending", "accepted", "in_progress", "completed"];

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

export default function MissionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { missions, acceptMission, startMission, completeMission, rateMission } = useMissions();
  const { getOrCreateConversation } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [report, setReport] = useState("");

  const mission = missions.find((m) => m.id === id);

  if (!mission) {
    return (
      <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
        <View style={styles.headerBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.notFoundText}>Mission introuvable</Text>
        </View>
      </View>
    );
  }

  const isClient = user?.role === "client";
  const isArtisan = user?.role === "artisan";
  const isMyMission = isClient ? mission.clientId === user?.id : mission.artisanId === user?.id;
  const statusIdx = STATUS_STEPS.indexOf(mission.status);

  async function handleAccept() {
    if (!user) return;
    Alert.alert("Accepter la mission ?", "Vous vous engagez à réaliser cette mission.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Accepter",
        onPress: async () => {
          setIsLoading(true);
          await acceptMission(mission.id, user.id, user.name);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsLoading(false);
        },
      },
    ]);
  }

  async function handleStart() {
    Alert.alert("Démarrer la mission ?", "Confirmez votre arrivée sur le chantier.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Démarrer",
        onPress: async () => {
          setIsLoading(true);
          await startMission(mission.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsLoading(false);
        },
      },
    ]);
  }

  async function handleComplete() {
    Alert.alert("Terminer la mission ?", "Confirmer la fin des travaux et envoyer le rapport au client.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Terminer",
        onPress: async () => {
          setIsLoading(true);
          await completeMission(mission.id, "Travaux réalisés avec succès conformément au devis.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsLoading(false);
        },
      },
    ]);
  }

  async function handleRate(r: number) {
    setRating(r);
    Haptics.selectionAsync();
    await rateMission(mission.id, r);
  }

  async function handleChat() {
    if (!mission.artisanId || !mission.artisanName || !user) return;
    setIsLoading(true);
    const conv = await getOrCreateConversation(
      mission.id,
      mission.title,
      mission.clientId,
      mission.clientName,
      mission.artisanId,
      mission.artisanName
    );
    setIsLoading(false);
    router.push({ pathname: "/chat/[id]", params: { id: conv.id } });
  }

  const statusConfig = {
    pending: { label: "En attente d'un artisan", color: Colors.warning, bg: Colors.warningLight, icon: "time-outline" },
    accepted: { label: "Artisan assigné", color: Colors.info, bg: Colors.infoLight, icon: "person-circle-outline" },
    in_progress: { label: "Travaux en cours", color: Colors.primary, bg: Colors.infoLight, icon: "construct-outline" },
    completed: { label: "Terminé", color: Colors.success, bg: Colors.successLight, icon: "checkmark-circle-outline" },
    cancelled: { label: "Annulé", color: Colors.danger, bg: Colors.dangerLight, icon: "close-circle-outline" },
  }[mission.status] || { label: mission.status, color: Colors.textMuted, bg: Colors.surfaceSecondary, icon: "help-outline" };

  return (
    <View style={[styles.container]}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={[styles.headerGrad, { paddingTop: (insets.top || (Platform.OS === "web" ? 67 : 0)) + 8 }]}
      >
        <View style={styles.headerBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{mission.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.categoryRow}>
          <View style={styles.catIconBox}>
            <Ionicons name={(CATEGORY_ICONS[mission.category] || "build") as any} size={24} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.categoryLabel}>{mission.category}</Text>
            <Text style={styles.clientLabel}>
              {isArtisan ? `Client: ${mission.clientName}` : `Votre demande`}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon as any} size={18} color={statusConfig.color} />
          <Text style={[styles.statusBannerText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Progression</Text>
          <View style={styles.timeline}>
            {STATUS_STEPS.map((s, idx) => {
              const done = idx <= statusIdx;
              const labels: Record<string, string> = {
                pending: "Demande publiée",
                accepted: "Artisan assigné",
                in_progress: "Travaux démarrés",
                completed: "Mission terminée",
              };
              return (
                <View key={s} style={styles.timelineItem}>
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                      {done ? (
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      ) : null}
                    </View>
                    {idx < STATUS_STEPS.length - 1 && (
                      <View style={[styles.timelineConnector, done && idx < statusIdx && styles.timelineConnectorDone]} />
                    )}
                  </View>
                  <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>{labels[s]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <InfoCard
          title="Description"
          icon="document-text-outline"
          content={mission.description}
        />

        <InfoCard
          title="Adresse"
          icon="location-outline"
          content={mission.address}
        />

        <InfoCard
          title="Planification"
          icon="calendar-outline"
          content={`${formatDate(mission.scheduledDate)} à ${mission.scheduledTime}`}
        />

        {mission.budget && (
          <InfoCard
            title="Budget"
            icon="cash-outline"
            content={`${mission.budget}€`}
            accent
          />
        )}

        {mission.artisanName && (
          <View style={styles.artisanCard}>
            <View style={styles.artisanCardHeader}>
              <View style={styles.artisanAvatar}>
                <Ionicons name="construct" size={24} color={Colors.primary} />
              </View>
              <View style={styles.artisanInfo}>
                <Text style={styles.artisanCardLabel}>Artisan assigné</Text>
                <Text style={styles.artisanCardName}>{mission.artisanName}</Text>
              </View>
              <View style={styles.starsSmall}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={12} color={Colors.accent} />
                ))}
              </View>
            </View>
          </View>
        )}

        {mission.status === "completed" && isClient && !mission.rating && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Évaluer la mission</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => handleRate(s)}>
                  <Ionicons
                    name={s <= rating ? "star" : "star-outline"}
                    size={36}
                    color={Colors.accent}
                  />
                </Pressable>
              ))}
            </View>
            {rating > 0 && (
              <View style={styles.ratingConfirm}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.ratingConfirmText}>Note envoyée !</Text>
              </View>
            )}
          </View>
        )}

        {mission.rating && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Note de la mission</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name={s <= mission.rating! ? "star" : "star-outline"} size={28} color={Colors.accent} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {mission.status !== "cancelled" && (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom || (Platform.OS === "web" ? 34 : 16) }]}>
          {isArtisan && !mission.artisanId && (
            <ActionButton label="Accepter la mission" icon="checkmark-circle" onPress={handleAccept} isLoading={isLoading} gold />
          )}
          {isArtisan && mission.artisanId === user?.id && mission.status === "accepted" && (
            <ActionButton label="Démarrer les travaux (Check-in)" icon="play-circle" onPress={handleStart} isLoading={isLoading} />
          )}
          {isArtisan && mission.status === "in_progress" && (
            <ActionButton label="Terminer la mission" icon="checkmark-done-circle" onPress={handleComplete} isLoading={isLoading} gold />
          )}
          {mission.artisanId && isClient && mission.status !== "pending" && (
            <Pressable
              style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.9 }]}
              onPress={handleChat}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                style={styles.chatBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                <Text style={styles.chatBtnText}>Contacter l'artisan</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function InfoCard({ title, icon, content, accent }: { title: string; icon: any; content: string; accent?: boolean }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoCardHeader}>
        <Ionicons name={icon} size={16} color={accent ? Colors.accent : Colors.textMuted} />
        <Text style={[styles.infoCardTitle, accent && { color: Colors.accent }]}>{title}</Text>
      </View>
      <Text style={[styles.infoCardContent, accent && { color: Colors.accent, fontFamily: "Inter_700Bold", fontSize: 20 }]}>
        {content}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  isLoading,
  gold,
}: {
  label: string;
  icon: any;
  onPress: () => void;
  isLoading: boolean;
  gold?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
      disabled={isLoading}
    >
      <LinearGradient
        colors={gold ? [Colors.accent, Colors.accentLight] : [Colors.primary, Colors.primaryLight]}
        style={styles.actionBtnGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {isLoading ? (
          <ActivityIndicator color={gold ? Colors.primary : "#fff"} />
        ) : (
          <>
            <Ionicons name={icon as any} size={20} color={gold ? Colors.primary : "#fff"} />
            <Text style={[styles.actionBtnText, gold && { color: Colors.primary }]}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 20 },
  headerBar: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  catIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(201,168,76,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", textTransform: "capitalize" },
  clientLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 2 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusBannerText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 4 },
  timelineSection: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, gap: 8 },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 40 },
  timelineLine: { alignItems: "center", width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  timelineDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineConnector: { width: 2, flex: 1, minHeight: 20, backgroundColor: Colors.border, marginTop: 2 },
  timelineConnectorDone: { backgroundColor: Colors.primary },
  timelineLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, paddingTop: 2 },
  timelineLabelDone: { color: Colors.text, fontFamily: "Inter_500Medium" },
  infoCard: {
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
  infoCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoCardTitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  infoCardContent: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 22 },
  artisanCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.info + "30",
  },
  artisanCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  artisanAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  artisanInfo: { flex: 1 },
  artisanCardLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.info },
  artisanCardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  starsSmall: { flexDirection: "row", gap: 2 },
  ratingSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    alignItems: "center",
  },
  starsRow: { flexDirection: "row", gap: 8 },
  ratingConfirm: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingConfirmText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.success },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  actionBtn: { borderRadius: 16, overflow: "hidden" },
  actionBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  chatBtn: { borderRadius: 16, overflow: "hidden" },
  chatBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  chatBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});
