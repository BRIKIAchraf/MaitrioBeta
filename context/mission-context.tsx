import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export type MissionStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

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
  budget?: number;
  rating?: number;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: { lat: number; lng: number };
  completionReport?: string;
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
  startMission: (missionId: string) => Promise<void>;
  completeMission: (missionId: string, report: string) => Promise<void>;
  rateMission: (missionId: string, rating: number) => Promise<void>;
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
}

const MissionContext = createContext<MissionContextValue | null>(null);
const STORAGE_KEY = "@maison_missions";

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
      budget: 150,
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
      budget: 200,
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
      budget: 350,
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
    const mission: Mission = {
      ...data,
      id: Crypto.randomUUID(),
      status: "pending",
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

  async function startMission(missionId: string) {
    await updateMission(missionId, {
      status: "in_progress",
      checkInTime: new Date().toISOString(),
    });
  }

  async function completeMission(missionId: string, report: string) {
    await updateMission(missionId, {
      status: "completed",
      checkOutTime: new Date().toISOString(),
      completionReport: report,
    });
  }

  async function rateMission(missionId: string, rating: number) {
    await updateMission(missionId, { rating });
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
      startMission,
      completeMission,
      rateMission,
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
