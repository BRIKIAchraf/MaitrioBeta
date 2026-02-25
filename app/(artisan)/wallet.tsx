import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
    Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const TRANSACTIONS = [
    { id: "1", title: "Mission #882 - Plomberie", amount: "+120.00€", date: "Aujourd'hui, 14:30", status: "Disponible" },
    { id: "2", title: "Mission #879 - Serrurerie", amount: "+95.00€", date: "Hier, 18:15", status: "Transféré" },
    { id: "3", title: "Transfert vers Compte Bancaire", amount: "-250.00€", date: "24 Fév, 09:00", status: "Terminé" },
];

export default function ArtisanWalletScreen() {
    const insets = useSafeAreaInsets();
    const [isTransferring, setIsTransferring] = useState(false);
    const [balance, setBalance] = useState(452.50);

    const handleInstantPayout = () => {
        if (balance <= 0) return;

        Alert.alert(
            "Instant Payout ⚡",
            `Voulez-vous transférer ${balance}€ immédiatement vers votre compte ? (Frais Maîtrio: 0€)`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Transférer maintenant",
                    onPress: () => {
                        setIsTransferring(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setTimeout(() => {
                            setBalance(0);
                            setIsTransferring(false);
                            Alert.alert("Succès", "L'argent a été envoyé vers votre compte bancaire.");
                        }, 2000);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary, "#1E3A8A"]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Portefeuille Maîtrio</Text>
                </View>

                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Solde disponible</Text>
                    <Text style={styles.balanceValue}>{balance.toFixed(2)}€</Text>
                    <View style={styles.statusChip}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Sécurisé par Maîtrio Escrow</Text>
                    </View>
                </View>

                <Pressable
                    style={[styles.payoutBtn, balance === 0 && styles.payoutBtnDisabled]}
                    onPress={handleInstantPayout}
                    disabled={isTransferring || balance === 0}
                >
                    <MaterialCommunityIcons name="flash" size={24} color={Colors.primary} />
                    <Text style={styles.payoutBtnText}>
                        {isTransferring ? "TRANSFERT EN COURS..." : "INSTANT PAYOUT (0s)"}
                    </Text>
                </Pressable>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Activités récentes</Text>
                    <Pressable><Text style={styles.viewAll}>Tout voir</Text></Pressable>
                </View>

                {TRANSACTIONS.map((tx) => (
                    <View key={tx.id} style={styles.txCard}>
                        <View style={[styles.txIcon, { backgroundColor: tx.amount.startsWith("+") ? "#F0FDF4" : "#FFF1F2" }]}>
                            <Ionicons
                                name={tx.amount.startsWith("+") ? "arrow-down" : "arrow-up"}
                                size={20}
                                color={tx.amount.startsWith("+") ? "#16A34A" : "#E11D48"}
                            />
                        </View>
                        <View style={styles.txInfo}>
                            <Text style={styles.txTitle}>{tx.title}</Text>
                            <Text style={styles.txDate}>{tx.date}</Text>
                        </View>
                        <View style={styles.txRight}>
                            <Text style={[styles.txAmount, { color: tx.amount.startsWith("+") ? "#16A34A" : Colors.text }]}>
                                {tx.amount}
                            </Text>
                            <Text style={styles.txStatus}>{tx.status}</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color={Colors.primary} />
                    <Text style={styles.infoText}>
                        En tant qu'artisan Maîtrio, vous recevez vos fonds dès que le client valide la fin de mission. Fini les attentes de 15 jours.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    header: { paddingHorizontal: 25, paddingBottom: 35, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    headerTitle: { color: "white", fontSize: 20, fontFamily: "Inter_700Bold", marginLeft: 15 },
    balanceContainer: { alignItems: "center", marginBottom: 30 },
    balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 16, fontFamily: "Inter_500Medium" },
    balanceValue: { color: "white", fontSize: 48, fontFamily: "Inter_800ExtraBold", marginVertical: 8 },
    statusChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E", marginRight: 8 },
    statusText: { color: "white", fontSize: 12, fontFamily: "Inter_600SemiBold" },
    payoutBtn: { backgroundColor: "white", height: 64, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
    payoutBtnDisabled: { opacity: 0.6 },
    payoutBtnText: { color: Colors.primary, fontSize: 16, fontFamily: "Inter_800ExtraBold", letterSpacing: 1 },
    content: { flex: 1, padding: 25 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
    viewAll: { color: Colors.primary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
    txCard: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 16, borderRadius: 20, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    txIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    txInfo: { flex: 1, marginLeft: 15 },
    txTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
    txDate: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
    txRight: { alignItems: "flex-end" },
    txAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
    txStatus: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    infoCard: { flexDirection: "row", backgroundColor: "#EFF6FF", padding: 20, borderRadius: 24, gap: 15, marginTop: 10, borderWidth: 1, borderColor: "#DBEAFE" },
    infoText: { flex: 1, fontSize: 14, color: "#1E40AF", fontFamily: "Inter_500Medium", lineHeight: 20 },
});
