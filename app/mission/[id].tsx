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
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/auth-context";
import { useMissions, RatingCriteria } from "@/context/mission-context";
import { useChat } from "@/context/chat-context";

const STATUS_STEPS = ["pending", "accepted", "en_route", "arrived", "in_progress", "completed", "validated"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Demande publiee",
  accepted: "Artisan assigne",
  en_route: "En route",
  arrived: "Arrive sur place",
  in_progress: "Travaux en cours",
  completed: "Travaux termines",
  validated: "Mission validee",
};

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
  const {
    missions, acceptMission, setEnRoute, checkIn, startMission,
    completeMission, validateMission, rateMission, disputeMission,
    escrowPayment, releasePayment,
  } = useMissions();
  const { getOrCreateConversation } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const [ratingData, setRatingData] = useState<RatingCriteria>({ quality: 0, punctuality: 0, communication: 0, overall: 0, comment: "" });
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [reportText, setReportText] = useState("");
  const [showReport, setShowReport] = useState(false);

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
    Alert.alert("Accepter la mission ?", "Vous vous engagez a realiser cette mission.", [
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

  async function handleEnRoute() {
    setIsLoading(true);
    await setEnRoute(mission.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(false);
  }

  async function handleCheckIn() {
    Alert.alert("Confirmer l'arrivee ?", "Vous confirmez votre presence sur le chantier.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Confirmer",
        onPress: async () => {
          setIsLoading(true);
          await checkIn(mission.id, { lat: 48.8566, lng: 2.3522 }, []);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsLoading(false);
        },
      },
    ]);
  }

  async function handleStart() {
    Alert.alert("Demarrer les travaux ?", "Confirmez le debut de l'intervention.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Demarrer",
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
    if (!reportText.trim()) {
      setShowReport(true);
      return;
    }
    Alert.alert("Terminer la mission ?", "Confirmer la fin des travaux et envoyer le rapport au client.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Terminer",
        onPress: async () => {
          setIsLoading(true);
          await completeMission(mission.id, reportText, []);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsLoading(false);
          setShowReport(false);
        },
      },
    ]);
  }

  async function handleValidate() {
    Alert.alert("Valider la mission ?", "Vous confirmez que les travaux sont conformes. Le paiement sera libere.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Valider et payer",
        onPress: async () => {
          setIsLoading(true);
          if (!mission.payment) {
            await escrowPayment(mission.id, mission.budget || 0);
          }
          await validateMission(mission.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsLoading(false);
        },
      },
    ]);
  }

  async function handleDispute() {
    Alert.alert("Signaler un litige ?", "Notre equipe examinera votre reclamation dans les plus brefs delais.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Signaler",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          await disputeMission(mission.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setIsLoading(false);
        },
      },
    ]);
  }

  function handleRatingChange(key: keyof RatingCriteria, value: number) {
    Haptics.selectionAsync();
    const updated = { ...ratingData, [key]: value };
    if (key !== "overall" && key !== "comment") {
      updated.overall = Math.round((updated.quality + updated.punctuality + updated.communication) / 3);
    }
    setRatingData(updated);
  }

  async function submitRating() {
    if (ratingData.overall === 0) return;
    setIsLoading(true);
    await rateMission(mission.id, ratingData);
    setRatingSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(false);
  }

  async function handleChat() {
    if (!mission.artisanId || !mission.artisanName || !user) return;
    setIsLoading(true);
    const conv = await getOrCreateConversation(
      mission.id, mission.title,
      mission.clientId, mission.clientName,
      mission.artisanId, mission.artisanName
    );
    setIsLoading(false);
    router.push({ pathname: "/chat/[id]", params: { id: conv.id } });
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    pending: { label: "En attente d'un artisan", color: Colors.warning, bg: Colors.warningLight, icon: "time-outline" },
    accepted: { label: "Artisan assigne", color: Colors.info, bg: Colors.infoLight, icon: "person-circle-outline" },
    en_route: { label: "Artisan en route", color: Colors.info, bg: Colors.infoLight, icon: "navigate-outline" },
    arrived: { label: "Artisan arrive", color: Colors.info, bg: Colors.infoLight, icon: "location-outline" },
    in_progress: { label: "Travaux en cours", color: Colors.primary, bg: Colors.infoLight, icon: "construct-outline" },
    completed: { label: "Travaux termines", color: Colors.success, bg: Colors.successLight, icon: "checkmark-circle-outline" },
    validated: { label: "Mission validee", color: Colors.success, bg: Colors.successLight, icon: "shield-checkmark-outline" },
    disputed: { label: "Litige en cours", color: Colors.danger, bg: Colors.dangerLight, icon: "warning-outline" },
    cancelled: { label: "Annule", color: Colors.danger, bg: Colors.dangerLight, icon: "close-circle-outline" },
  };

  const sc = statusConfig[mission.status] || { label: mission.status, color: Colors.textMuted, bg: Colors.surfaceSecondary, icon: "help-outline" };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={[styles.headerGrad, { paddingTop: (insets.top || (Platform.OS === "web" ? 67 : 0)) + 8 }]}
      >
        <View style={styles.headerBar}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{mission.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.categoryRow}>
          <View style={styles.catIconBox}>
            <Ionicons name={(CATEGORY_ICONS[mission.category] || "build") as any} size={24} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.categoryLabel}>{mission.category}</Text>
            <Text style={styles.clientLabel}>
              {isArtisan ? `Client: ${mission.clientName}` : mission.artisanName ? `Artisan: ${mission.artisanName}` : "Votre demande"}
            </Text>
          </View>
          {mission.urgency && mission.urgency !== "normal" && (
            <View style={[styles.urgencyBadge, mission.urgency === "tres_urgent" && { backgroundColor: Colors.dangerLight }]}>
              <Ionicons name="flash" size={12} color={mission.urgency === "tres_urgent" ? Colors.danger : Colors.warning} />
              <Text style={[styles.urgencyText, { color: mission.urgency === "tres_urgent" ? Colors.danger : Colors.warning }]}>
                {mission.urgency === "tres_urgent" ? "Tres urgent" : "Urgent"}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
          <Ionicons name={sc.icon as any} size={18} color={sc.color} />
          <Text style={[styles.statusBannerText, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Progression</Text>
          <View style={styles.timeline}>
            {STATUS_STEPS.map((s, idx) => {
              const done = idx <= statusIdx;
              return (
                <View key={s} style={styles.timelineItem}>
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                      {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                    {idx < STATUS_STEPS.length - 1 && (
                      <View style={[styles.timelineConnector, done && idx < statusIdx && styles.timelineConnectorDone]} />
                    )}
                  </View>
                  <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>{STATUS_LABELS[s]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <InfoCard title="Description" icon="document-text-outline" content={mission.description} />
        <InfoCard title="Adresse" icon="location-outline" content={mission.address} />
        <InfoCard title="Planification" icon="calendar-outline" content={`${formatDate(mission.scheduledDate)} a ${mission.scheduledTime}`} />

        {mission.estimatedDuration && (
          <InfoCard title="Duree estimee" icon="time-outline" content={mission.estimatedDuration} />
        )}

        {mission.budget && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetRow}>
              <View>
                <Text style={styles.budgetLabel}>Budget</Text>
                <Text style={styles.budgetValue}>{mission.budget}EUR</Text>
              </View>
              {mission.estimatedPrice && (
                <View style={styles.budgetEstimate}>
                  <Text style={styles.budgetEstLabel}>Estimation</Text>
                  <Text style={styles.budgetEstValue}>{mission.estimatedPrice.min} - {mission.estimatedPrice.max}EUR</Text>
                </View>
              )}
            </View>
            {mission.payment && (
              <View style={[styles.paymentStatus, { backgroundColor: mission.payment.status === "released" ? Colors.successLight : Colors.warningLight }]}>
                <Ionicons
                  name={mission.payment.status === "released" ? "checkmark-circle" : "lock-closed"}
                  size={14}
                  color={mission.payment.status === "released" ? Colors.success : Colors.warning}
                />
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: mission.payment.status === "released" ? Colors.success : Colors.warning }}>
                  {mission.payment.status === "escrowed" ? "Paiement en sequestre" : mission.payment.status === "released" ? "Paiement libere" : mission.payment.status}
                </Text>
              </View>
            )}
          </View>
        )}

        {mission.artisanName && (
          <Pressable style={styles.artisanCard} onPress={handleChat}>
            <View style={styles.artisanCardHeader}>
              <View style={styles.artisanAvatar}>
                <Ionicons name="construct" size={24} color={Colors.primary} />
              </View>
              <View style={styles.artisanInfo}>
                <Text style={styles.artisanCardLabel}>Artisan assigne</Text>
                <Text style={styles.artisanCardName}>{mission.artisanName}</Text>
              </View>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
            </View>
          </Pressable>
        )}

        {mission.checkInTime && (
          <View style={styles.checkCard}>
            <View style={styles.checkRow}>
              <Ionicons name="log-in-outline" size={18} color={Colors.success} />
              <View>
                <Text style={styles.checkLabel}>Check-in</Text>
                <Text style={styles.checkTime}>{new Date(mission.checkInTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</Text>
              </View>
            </View>
            {mission.checkOutTime && (
              <View style={styles.checkRow}>
                <Ionicons name="log-out-outline" size={18} color={Colors.info} />
                <View>
                  <Text style={styles.checkLabel}>Check-out</Text>
                  <Text style={styles.checkTime}>{new Date(mission.checkOutTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {mission.completionReport && (
          <InfoCard title="Rapport de fin" icon="document-text-outline" content={mission.completionReport} />
        )}

        {showReport && isArtisan && mission.status === "in_progress" && (
          <View style={styles.reportSection}>
            <Text style={styles.sectionTitle}>Rapport de fin de mission</Text>
            <TextInput
              style={styles.reportInput}
              value={reportText}
              onChangeText={setReportText}
              placeholder="Decrivez les travaux realises..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {(mission.status === "completed" || mission.status === "validated") && isClient && !mission.rating && !ratingSubmitted && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Evaluer la mission</Text>
            <RatingRow label="Qualite" value={ratingData.quality} onChange={(v) => handleRatingChange("quality", v)} />
            <RatingRow label="Ponctualite" value={ratingData.punctuality} onChange={(v) => handleRatingChange("punctuality", v)} />
            <RatingRow label="Communication" value={ratingData.communication} onChange={(v) => handleRatingChange("communication", v)} />
            <View style={styles.ratingOverall}>
              <Text style={styles.ratingOverallLabel}>Note globale</Text>
              <Text style={styles.ratingOverallValue}>{ratingData.overall > 0 ? `${ratingData.overall}/5` : "-"}</Text>
            </View>
            <TextInput
              style={styles.ratingComment}
              value={ratingData.comment}
              onChangeText={(t) => setRatingData((prev) => ({ ...prev, comment: t }))}
              placeholder="Commentaire (optionnel)..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <Pressable
              style={({ pressed }) => [styles.submitRatingBtn, pressed && { opacity: 0.9 }, ratingData.overall === 0 && { opacity: 0.5 }]}
              onPress={submitRating}
              disabled={ratingData.overall === 0 || isLoading}
            >
              <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.submitRatingBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="star" size={18} color={Colors.primary} />
                <Text style={styles.submitRatingBtnText}>Envoyer l'evaluation</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {mission.rating && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Evaluation</Text>
            <RatingDisplay label="Qualite" value={mission.rating.quality} />
            <RatingDisplay label="Ponctualite" value={mission.rating.punctuality} />
            <RatingDisplay label="Communication" value={mission.rating.communication} />
            <View style={styles.ratingOverall}>
              <Text style={styles.ratingOverallLabel}>Note globale</Text>
              <Text style={styles.ratingOverallValue}>{mission.rating.overall}/5</Text>
            </View>
            {mission.rating.comment ? <Text style={styles.ratingCommentText}>{mission.rating.comment}</Text> : null}
          </View>
        )}
      </ScrollView>

      {mission.status !== "cancelled" && mission.status !== "disputed" && (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom || (Platform.OS === "web" ? 34 : 16) }]}>
          {isArtisan && !mission.artisanId && mission.status === "pending" && (
            <ActionButton label="Accepter la mission" icon="checkmark-circle" onPress={handleAccept} isLoading={isLoading} gold />
          )}
          {isArtisan && mission.artisanId === user?.id && mission.status === "accepted" && (
            <ActionButton label="En route vers le chantier" icon="navigate" onPress={handleEnRoute} isLoading={isLoading} />
          )}
          {isArtisan && mission.artisanId === user?.id && mission.status === "en_route" && (
            <ActionButton label="Confirmer l'arrivee (Check-in)" icon="location" onPress={handleCheckIn} isLoading={isLoading} gold />
          )}
          {isArtisan && mission.artisanId === user?.id && mission.status === "arrived" && (
            <ActionButton label="Demarrer les travaux" icon="play-circle" onPress={handleStart} isLoading={isLoading} />
          )}
          {isArtisan && mission.artisanId === user?.id && mission.status === "in_progress" && (
            <ActionButton label={showReport && reportText.trim() ? "Envoyer le rapport" : "Terminer la mission"} icon="checkmark-done-circle" onPress={handleComplete} isLoading={isLoading} gold />
          )}
          {isClient && mission.status === "completed" && (
            <>
              <ActionButton label="Valider et liberer le paiement" icon="shield-checkmark" onPress={handleValidate} isLoading={isLoading} gold />
              <Pressable style={({ pressed }) => [styles.disputeBtn, pressed && { opacity: 0.8 }]} onPress={handleDispute}>
                <Ionicons name="warning-outline" size={18} color={Colors.danger} />
                <Text style={styles.disputeBtnText}>Signaler un litige</Text>
              </Pressable>
            </>
          )}
          {mission.artisanId && (
            <Pressable style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.9 }]} onPress={handleChat}>
              <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.chatBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                <Text style={styles.chatBtnText}>{isClient ? "Contacter l'artisan" : "Contacter le client"}</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingRowLabel}>{label}</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Pressable key={s} onPress={() => onChange(s)} hitSlop={4}>
            <Ionicons name={s <= value ? "star" : "star-outline"} size={24} color={Colors.accent} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RatingDisplay({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingRowLabel}>{label}</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Ionicons key={s} name={s <= value ? "star" : "star-outline"} size={20} color={Colors.accent} />
        ))}
      </View>
    </View>
  );
}

function InfoCard({ title, icon, content }: { title: string; icon: any; content: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoCardHeader}>
        <Ionicons name={icon} size={16} color={Colors.textMuted} />
        <Text style={styles.infoCardTitle}>{title}</Text>
      </View>
      <Text style={styles.infoCardContent}>{content}</Text>
    </View>
  );
}

function ActionButton({ label, icon, onPress, isLoading, gold }: { label: string; icon: any; onPress: () => void; isLoading: boolean; gold?: boolean }) {
  return (
    <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]} onPress={onPress} disabled={isLoading}>
      <LinearGradient colors={gold ? [Colors.accent, Colors.accentLight] : [Colors.primary, Colors.primaryLight]} style={styles.actionBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {isLoading ? <ActivityIndicator color={gold ? Colors.primary : "#fff"} /> : (
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
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  catIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(201,168,76,0.2)", alignItems: "center", justifyContent: "center" },
  categoryLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", textTransform: "capitalize" },
  clientLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 2 },
  urgencyBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.warningLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  urgencyText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  statusBannerText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 4 },
  timelineSection: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, gap: 8 },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 36 },
  timelineLine: { alignItems: "center", width: 20 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.surfaceSecondary, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center", zIndex: 1 },
  timelineDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineConnector: { width: 2, flex: 1, minHeight: 16, backgroundColor: Colors.border, marginTop: 2 },
  timelineConnectorDone: { backgroundColor: Colors.primary },
  timelineLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, paddingTop: 2 },
  timelineLabelDone: { color: Colors.text, fontFamily: "Inter_500Medium" },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 8, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  infoCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoCardTitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  infoCardContent: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 22 },
  budgetCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.accent + "30" },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  budgetLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  budgetValue: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.accent },
  budgetEstimate: { alignItems: "flex-end" },
  budgetEstLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  budgetEstValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  paymentStatus: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  artisanCard: { backgroundColor: Colors.infoLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.info + "30" },
  artisanCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  artisanAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  artisanInfo: { flex: 1 },
  artisanCardLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.info },
  artisanCardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  checkCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 14, flexDirection: "row", justifyContent: "space-around" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  checkTime: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  reportSection: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10 },
  reportInput: { backgroundColor: Colors.surfaceSecondary, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text, minHeight: 100, borderWidth: 1, borderColor: Colors.border },
  ratingSection: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, gap: 14 },
  ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ratingRowLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  starsRow: { flexDirection: "row", gap: 6 },
  ratingOverall: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  ratingOverallLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  ratingOverallValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.accent },
  ratingComment: { backgroundColor: Colors.surfaceSecondary, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text, minHeight: 60, borderWidth: 1, borderColor: Colors.border },
  ratingCommentText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, fontStyle: "italic" },
  submitRatingBtn: { borderRadius: 14, overflow: "hidden" },
  submitRatingBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  submitRatingBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  actionBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: 10 },
  actionBtn: { borderRadius: 16, overflow: "hidden" },
  actionBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  disputeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  disputeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.danger },
  chatBtn: { borderRadius: 16, overflow: "hidden" },
  chatBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  chatBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});
