import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export type MissionStatus =
  | "pending"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "validated"
  | "cancelled"
  | "disputed";

export type MissionCategory =
  | "plomberie"
  | "electricite"
  | "peinture"
  | "menuiserie"
  | "jardinage"
  | "nettoyage"
  | "climatisation"
  | "maconnerie"
  | "autre";

export type UrgencyLevel = "normal" | "urgent" | "tres_urgent";

export interface RatingCriteria {
  quality: number;
  punctuality: number;
  communication: number;
  overall: number;
  comment?: string;
}

export interface PaymentInfo {
  amount: number;
  status: "pending" | "escrowed" | "released" | "refunded";
  paidAt?: string;
  releasedAt?: string;
  method: string;
}

export interface Mission {
  id: string;
  clientId: string;
  clientName: string;
  artisanId?: string;
  artisanName?: string;
  category: MissionCategory;
  title: string;
  description: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  status: MissionStatus;
  photos: string[];
  checkInPhotos: string[];
  checkOutPhotos: string[];
  budget?: number;
  estimatedPrice?: { min: number; max: number };
  estimatedDuration?: string;
  urgency: UrgencyLevel;
  rating?: RatingCriteria;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: { lat: number; lng: number };
  checkOutLocation?: { lat: number; lng: number };
  completionReport?: string;
  clientSignature?: boolean;
  payment?: PaymentInfo;
  createdAt: string;
  updatedAt: string;
}

interface MissionContextValue {
  missions: Mission[];
  isLoading: boolean;
  createMission: (data: CreateMissionData) => Promise<Mission>;
  updateMission: (id: string, data: Partial<Mission>) => Promise<void>;
  getMissionsByClient: (clientId: string) => Mission[];
  getAvailableMissions: () => Mission[];
  getArtisanMissions: (artisanId: string) => Mission[];
  acceptMission: (missionId: string, artisanId: string, artisanName: string) => Promise<void>;
  setEnRoute: (missionId: string) => Promise<void>;
  checkIn: (missionId: string, location: { lat: number; lng: number }, photos: string[]) => Promise<void>;
  startMission: (missionId: string) => Promise<void>;
  completeMission: (missionId: string, report: string, photos: string[]) => Promise<void>;
  validateMission: (missionId: string) => Promise<void>;
  rateMission: (missionId: string, rating: RatingCriteria) => Promise<void>;
  disputeMission: (missionId: string) => Promise<void>;
  escrowPayment: (missionId: string, amount: number) => Promise<void>;
  releasePayment: (missionId: string) => Promise<void>;
}

export interface CreateMissionData {
  clientId: string;
  clientName: string;
  category: MissionCategory;
  title: string;
  description: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  photos: string[];
  budget?: number;
  urgency?: UrgencyLevel;
}

const MissionContext = createContext<MissionContextValue | null>(null);
const STORAGE_KEY = "@maison_missions";

function estimateDuration(category: MissionCategory): string {
  const durations: Record<MissionCategory, string> = {
    plomberie: "1-3h",
    electricite: "2-4h",
    peinture: "4-8h",
    menuiserie: "3-6h",
    jardinage: "2-4h",
    nettoyage: "2-4h",
    climatisation: "2-4h",
    maconnerie: "4-8h",
    autre: "2-4h",
  };
  return durations[category] || "2-4h";
}

function generateSeedMissions(): Mission[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  return [
    {
      id: "seed-1",
      clientId: "demo-client",
      clientName: "Marie Dupont",
      category: "plomberie",
      title: "Fuite robinet cuisine",
      description: "Robinet qui goutte depuis 2 semaines, besoin d'un remplacement",
      address: "12 Rue de la Paix, Paris 75001",
      scheduledDate: tomorrow.toISOString().split("T")[0],
      scheduledTime: "09:00",
      status: "pending",
      photos: [],
      checkInPhotos: [],
      checkOutPhotos: [],
      urgency: "normal" as UrgencyLevel,
      budget: 150,
      estimatedPrice: { min: 120, max: 180 },
      estimatedDuration: "1-2h",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "seed-2",
      clientId: "demo-client2",
      clientName: "Pierre Martin",
      category: "electricite",
      title: "Installation prises électriques",
      description: "Installation de 3 nouvelles prises dans le salon",
      address: "45 Avenue Victor Hugo, Lyon 69006",
      scheduledDate: nextWeek.toISOString().split("T")[0],
      scheduledTime: "14:00",
      status: "pending",
      photos: [],
      checkInPhotos: [],
      checkOutPhotos: [],
      urgency: "normal" as UrgencyLevel,
      budget: 200,
      estimatedPrice: { min: 150, max: 250 },
      estimatedDuration: "2-3h",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "seed-3",
      clientId: "demo-client3",
      clientName: "Sophie Bernard",
      category: "peinture",
      title: "Peinture chambre 12m²",
      description: "Peinture complète d'une chambre, murs et plafond blanc",
      address: "8 Boulevard Gambetta, Marseille 13001",
      scheduledDate: nextWeek.toISOString().split("T")[0],
      scheduledTime: "08:30",
      status: "pending",
      photos: [],
      checkInPhotos: [],
      checkOutPhotos: [],
      urgency: "urgent" as UrgencyLevel,
      budget: 350,
      estimatedPrice: { min: 280, max: 400 },
      estimatedDuration: "4-6h",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function MissionProvider({ children }: { children: ReactNode }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, []);

  async function loadMissions() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMissions(JSON.parse(stored));
      } else {
        const seeds = generateSeedMissions();
        setMissions(seeds);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      }
    } catch {}
    setIsLoading(false);
  }

  async function saveMissions(updated: Mission[]) {
    setMissions(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function createMission(data: CreateMissionData): Promise<Mission> {
    const budget = data.budget || 0;
    const mission: Mission = {
      ...data,
      id: Crypto.randomUUID(),
      status: "pending",
      checkInPhotos: [],
      checkOutPhotos: [],
      urgency: data.urgency || "normal",
      estimatedPrice: budget ? { min: Math.round(budget * 0.8), max: Math.round(budget * 1.2) } : undefined,
      estimatedDuration: estimateDuration(data.category),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [mission, ...missions];
    await saveMissions(updated);
    return mission;
  }

  async function updateMission(id: string, data: Partial<Mission>) {
    const updated = missions.map((m) =>
      m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
    );
    await saveMissions(updated);
  }

  const getMissionsByClient = useCallback(
    (clientId: string) => missions.filter((m) => m.clientId === clientId),
    [missions]
  );

  const getAvailableMissions = useCallback(
    () => missions.filter((m) => m.status === "pending" && !m.artisanId),
    [missions]
  );

  const getArtisanMissions = useCallback(
    (artisanId: string) => missions.filter((m) => m.artisanId === artisanId),
    [missions]
  );

  async function acceptMission(missionId: string, artisanId: string, artisanName: string) {
    await updateMission(missionId, { artisanId, artisanName, status: "accepted" });
  }

  async function setEnRoute(missionId: string) {
    await updateMission(missionId, { status: "en_route" });
  }

  async function checkIn(missionId: string, location: { lat: number; lng: number }, photos: string[]) {
    await updateMission(missionId, {
      status: "arrived",
      checkInTime: new Date().toISOString(),
      checkInLocation: location,
      checkInPhotos: photos,
    });
  }

  async function startMission(missionId: string) {
    await updateMission(missionId, { status: "in_progress" });
  }

  async function completeMission(missionId: string, report: string, photos: string[]) {
    await updateMission(missionId, {
      status: "completed",
      checkOutTime: new Date().toISOString(),
      completionReport: report,
      checkOutPhotos: photos,
    });
  }

  async function validateMission(missionId: string) {
    const mission = missions.find((m) => m.id === missionId);
    await updateMission(missionId, {
      status: "validated",
      clientSignature: true,
      payment: mission?.payment ? { ...mission.payment, status: "released", releasedAt: new Date().toISOString() } : undefined,
    });
  }

  async function rateMission(missionId: string, rating: RatingCriteria) {
    await updateMission(missionId, { rating });
  }

  async function disputeMission(missionId: string) {
    await updateMission(missionId, { status: "disputed" });
  }

  async function escrowPayment(missionId: string, amount: number) {
    await updateMission(missionId, {
      payment: { amount, status: "escrowed", paidAt: new Date().toISOString(), method: "card" },
    });
  }

  async function releasePayment(missionId: string) {
    const mission = missions.find((m) => m.id === missionId);
    if (mission?.payment) {
      await updateMission(missionId, {
        payment: { ...mission.payment, status: "released", releasedAt: new Date().toISOString() },
      });
    }
  }

  const value = useMemo<MissionContextValue>(
    () => ({
      missions,
      isLoading,
      createMission,
      updateMission,
      getMissionsByClient,
      getAvailableMissions,
      getArtisanMissions,
      acceptMission,
      setEnRoute,
      checkIn,
      startMission,
      completeMission,
      validateMission,
      rateMission,
      disputeMission,
      escrowPayment,
      releasePayment,
    }),
    [missions, isLoading]
  );

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMissions() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMissions must be used within MissionProvider");
  return ctx;
}
