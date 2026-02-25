import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

export default function MissionCompletionScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const [signed, setSigned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSignature = () => {
        setSigned(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const finalizeMission = () => {
        if (!signed) {
            Alert.alert("Signature manquante", "Le client doit signer pour valider la fin des travaux.");
            return;
        }

        setIsProcessing(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
            setIsProcessing(false);
            Alert.alert(
                "Mission Terminée ! 🏁",
                "L'argent a été transféré instantanément sur votre portefeuille Maîtrio. Le client recevra sa facture par email.",
                [{ text: "Retour au Dashboard", onPress: () => router.push("/(artisan)") }]
            );
        }, 2500);
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#0F172A", "#1E293B"]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Fin de Mission</Text>
                </View>
                <Text style={styles.headerDesc}>Mission #{id?.toString().slice(-4).toUpperCase()}</Text>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Récapitulatif Final</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Intervention</Text>
                        <Text style={styles.value}>Réparation Fuite Robinet</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total à régler</Text>
                        <Text style={styles.totalValue}>124.50€</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Signature Électronique (Client)</Text>
                <Text style={styles.sectionDesc}>En signant, vous attestez de la bonne réalisation des travaux et autorisez le déblocage immédiat des fonds.</Text>

                <Pressable
                    style={[styles.signaturePad, signed && styles.signaturePadSigned]}
                    onPress={handleSignature}
                >
                    {signed ? (
                        <View style={styles.signedContainer}>
                            <Ionicons name="checkmark-done" size={60} color={Colors.success} />
                            <Text style={styles.signedText}>Signé par le Client</Text>
                        </View>
                    ) : (
                        <Text style={styles.signPlaceholder}>Signez ici sur l'écran</Text>
                    )}
                </Pressable>

                <View style={styles.infoBox}>
                    <Ionicons name="flash" size={20} color={Colors.accent} />
                    <Text style={styles.infoText}>Instant Payout activé : Fonds transférés en 0.2s après signature.</Text>
                </View>

                <Pressable
                    style={[styles.finishBtn, isProcessing && styles.finishBtnDisabled]}
                    onPress={finalizeMission}
                    disabled={isProcessing}
                >
                    <Text style={styles.finishBtnText}>
                        {isProcessing ? "DÉBLOCAGE DES FONDS..." : "FINALISER ET RECEVOIR LE PAIEMENT"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    header: { paddingHorizontal: 25, paddingBottom: 35, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    headerTitle: { color: "white", fontSize: 20, fontFamily: "Inter_700Bold", marginLeft: 15 },
    headerDesc: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular" },
    content: { flex: 1, padding: 25 },
    summaryCard: { backgroundColor: "white", borderRadius: 24, padding: 20, marginBottom: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    summaryTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 15 },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    label: { fontSize: 14, color: Colors.textMuted },
    value: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
    totalValue: { fontSize: 18, fontFamily: "Inter_800ExtraBold", color: Colors.primary },
    sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 8 },
    sectionDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginBottom: 20 },
    signaturePad: { width: "100%", height: 200, backgroundColor: "white", borderRadius: 20, borderWidth: 2, borderStyle: "dashed", borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
    signaturePadSigned: { borderStyle: "solid", borderColor: Colors.success, backgroundColor: "#F0FDF4" },
    signPlaceholder: { color: Colors.textMuted, fontFamily: "Inter_500Medium" },
    signedContainer: { alignItems: "center" },
    signedText: { marginTop: 10, color: Colors.success, fontFamily: "Inter_700Bold" },
    infoBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", padding: 15, borderRadius: 16, gap: 10, marginVertical: 30 },
    infoText: { flex: 1, fontSize: 12, color: "#92400E", fontFamily: "Inter_600SemiBold" },
    finishBtn: { backgroundColor: Colors.primary, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    finishBtnDisabled: { opacity: 0.6 },
    finishBtnText: { color: "white", fontSize: 16, fontFamily: "Inter_800ExtraBold", letterSpacing: 1 },
});
