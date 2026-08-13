export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isError?: boolean;
  errorMessage?: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ElaraSettings {
  systemPrompt: string;
  userName: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
  includeHistory: boolean;
  theme: 'dark' | 'light';
  portraitScale: number;
  backdropImage: string | null;
  backdropOpacity: number;
  backdropBlur: number;
  timezone: string;
}

export interface RoomLocation {
  id: string;
  name: string;
  description: string;
  objects: string[];
  notes?: string;
}

export interface HouseStructure {
  generalDescription: string;
  rooms: RoomLocation[];
  specialLocations: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  ownership: 'elara' | 'user' | 'shared';
  importance?: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface RoutineEntry {
  id: string;
  timeRange: string;
  daysOfWeek: string;
  activity: string;
  location: string;
  flexibility: 'fixed' | 'flexible' | 'variable';
  notes?: string;
}

export interface LiveState {
  userLocation: string;
  elaraLocation: string;
  currentActivity: string;
  currentClothing: string;
  currentPlans: string;
  objectsInUse: string;
  temporaryConditions: string;
}

export interface TemporaryEvent {
  id: string;
  title: string;
  description: string;
  startTime?: string;
  endTimeOrExpiry?: string;
  participants: string;
  location: string;
  notes?: string;
}

export interface SharedMemory {
  id: string;
  date: string;
  title: string;
  description: string;
  participants: string;
  importance: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface ElaraPersonalLife {
  personalProjects: string[];
  booksReading: string[];
  subjectsResearching: string[];
  curiosities: string[];
  ideasDeveloping: string[];
  thingsToShowUser: string[];
  intendedActivities: string[];
  ongoingGoals: string[];
}

export interface PreferenceEntry {
  id: string;
  category: string;
  detail: string;
  owner: 'elara' | 'user' | 'shared';
}

export interface WorldState {
  house: HouseStructure;
  elaraBelongings: InventoryItem[];
  userBelongings: InventoryItem[];
  sharedPossessions: InventoryItem[];
  elaraRoutine: RoutineEntry[];
  userRoutine: RoutineEntry[];
  liveState: LiveState;
  temporaryEvents: TemporaryEvent[];
  sharedMemories: SharedMemory[];
  elaraPersonalLife: ElaraPersonalLife;
  preferences: PreferenceEntry[];
}

export interface GeminiModelOption {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

// Memory Scratchpad Types
export type MemoryConfidence = 'certain' | 'likely' | 'uncertain';
export type MemoryImportance = 'low' | 'normal' | 'important' | 'core';
export type MemoryCategory =
  | 'User'
  | 'Elara'
  | 'Relationship'
  | 'Home'
  | 'Work'
  | 'Projects'
  | 'Preferences'
  | 'People'
  | 'Places'
  | 'Experiences'
  | 'Observations'
  | 'Plans'
  | 'Other';

export interface MemoryItem {
  id: string;
  content: string;
  confidence: MemoryConfidence;
  importance: MemoryImportance;
  isPrivate: boolean; // true = Elara's private observation; false = Shared history/fact
  category: MemoryCategory;
  createdAt: string;
  updatedAt: string;
  eventDate?: string;
  pinned?: boolean;
  tags?: string[];
  sourceConversationId?: string;
}

export interface MemoryScratchpadState {
  memories: MemoryItem[];
  lastMaintenanceAt?: string;
  autoMaintenanceEnabled: boolean;
}

export type MemoryActionType = 'ADD' | 'UPDATE' | 'MERGE' | 'DELETE' | 'NO_ACTION';

export interface MemoryAction {
  type: MemoryActionType;
  targetId?: string;
  mergeTargetIds?: string[];
  memory?: {
    content: string;
    confidence: MemoryConfidence;
    importance: MemoryImportance;
    isPrivate: boolean;
    category: MemoryCategory;
    eventDate?: string;
    tags?: string[];
  };
  reason?: string;
}

export const AVAILABLE_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    description: 'Fast, intelligent, multimodal model optimized for reasoning & natural conversation.',
    isDefault: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    description: 'Advanced reasoning, deep logic, and complex dialogue capabilities.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Lightweight model designed for speed and rapid responses.',
  },
];

