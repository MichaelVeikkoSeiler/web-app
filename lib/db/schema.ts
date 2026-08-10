import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  unique,
  jsonb,
  real,
} from "drizzle-orm/pg-core";
import type { PlantDocAnswers, PlantDocContext } from "@/lib/plant-doc-types";
import type { SoilCheckAnswers } from "@/lib/soil-check-types";

export const lightConditionEnum = pgEnum("light_condition", [
  "schattig",
  "halbschattig",
  "sonnig",
]);

export const orientationEnum = pgEnum("orientation", ["N", "O", "S", "W"]);

export const enrichmentStatusEnum = pgEnum("enrichment_status", [
  "pending",
  "done",
  "failed",
]);

export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  light: lightConditionEnum("light").notNull(),
  orientation: orientationEnum("orientation").notNull(),
  soilType: text("soil_type"),
  notes: text("notes"),
  imageUrl: text("image_url"),
  conflictStatus: enrichmentStatusEnum("conflict_status").notNull().default("pending"),
  conflictLabel: text("conflict_label"),
  conflictText: text("conflict_text"),
  conflictCheckedAt: timestamp("conflict_checked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  scientificName: text("scientific_name").notNull().unique(),
  germanName: text("german_name"),
  commonName: text("common_name"),
  factsText: text("facts_text"),

  isFruitOrBerry: boolean("is_fruit_or_berry").notNull().default(false),

  bloomPeriodText: text("bloom_period_text"),
  bloomStartMonth: integer("bloom_start_month"),
  bloomEndMonth: integer("bloom_end_month"),

  harvestPeriodText: text("harvest_period_text"),
  harvestStartMonth: integer("harvest_start_month"),
  harvestEndMonth: integer("harvest_end_month"),

  pruningPeriodText: text("pruning_period_text"),
  pruningStartMonth: integer("pruning_start_month"),
  pruningEndMonth: integer("pruning_end_month"),
  lastPrunedAt: timestamp("last_pruned_at"),

  fertilizingPeriodText: text("fertilizing_period_text"),
  fertilizingStartMonth: integer("fertilizing_start_month"),
  fertilizingEndMonth: integer("fertilizing_end_month"),
  lastFertilizedAt: timestamp("last_fertilized_at"),

  wateringRhythmDays: integer("watering_rhythm_days"),
  wateringNotes: text("watering_notes"),
  lastWateredAt: timestamp("last_watered_at"),

  /** Pflegeaufwand 1 (sehr pflegeleicht) bis 10 (sehr anspruchsvoll), via Websearch ermittelt. */
  careDifficulty: integer("care_difficulty"),

  enrichmentStatus: enrichmentStatusEnum("enrichment_status")
    .notNull()
    .default("pending"),
  enrichmentError: text("enrichment_error"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const plantZoneAssignments = pgTable(
  "plant_zone_assignments",
  {
    id: serial("id").primaryKey(),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    zoneId: integer("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.plantId, table.zoneId)],
);

export const plantPhotos = pgTable("plant_photos", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id")
    .notNull()
    .references(() => plants.id, { onDelete: "cascade" }),
  blobUrl: text("blob_url").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  heroImageUrl: text("hero_image_url"),
  logoUrl: text("logo_url"),
  plantsHeroImageUrl: text("plants_hero_image_url"),
  zonesHeroImageUrl: text("zones_hero_image_url"),
  besonderheitenHeroImageUrl: text("besonderheiten_hero_image_url"),
  wetterHeroImageUrl: text("wetter_hero_image_url"),
  plantDocHeroImageUrl: text("plant_doc_hero_image_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const heroImages = pgTable("hero_images", {
  id: serial("id").primaryKey(),
  blobUrl: text("blob_url").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plantNotes = pgTable("plant_notes", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id")
    .notNull()
    .references(() => plants.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plantDocCaseStatusEnum = pgEnum("plant_doc_case_status", [
  "open",
  "watching",
  "improved",
  "unchanged",
  "worsened",
  "resolved",
]);

export const plantDocCases = pgTable("plant_doc_cases", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id")
    .notNull()
    .references(() => plants.id, { onDelete: "cascade" }),

  answers: jsonb("answers").$type<PlantDocAnswers>().notNull(),
  contextSnapshot: jsonb("context_snapshot").$type<PlantDocContext>(),

  analysisStatus: enrichmentStatusEnum("analysis_status").notNull().default("pending"),
  analysisError: text("analysis_error"),

  primaryCause: text("primary_cause"),
  primaryCauseCategory: text("primary_cause_category"),
  confidence: text("confidence"),
  reasoning: text("reasoning"),
  otherCauses: jsonb("other_causes").$type<string[]>(),
  recommendations: jsonb("recommendations").$type<string[]>(),
  recheckAfterDays: integer("recheck_after_days"),
  needsMoreInfo: boolean("needs_more_info").notNull().default(false),
  missingInfoSuggestions: jsonb("missing_info_suggestions").$type<string[]>(),
  usedWebSearch: boolean("used_web_search").notNull().default(false),

  status: plantDocCaseStatusEnum("status").notNull().default("open"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const plantDocPhotos = pgTable("plant_doc_photos", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => plantDocCases.id, { onDelete: "cascade" }),
  blobUrl: text("blob_url").notNull(),
  role: text("role"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Historie der BodenChecks pro Zone. Jeder Durchlauf erzeugt eine neue Zeile
 * (nie ein Überschreiben) – die Zonen-Detailseite zeigt jeweils die neueste.
 * Die Auswertung (Bodenart, pH-Klasse, Drainage, ...) erfolgt deterministisch
 * über lib/soil-check-logic.ts, nicht über OpenAI.
 */
export const zoneSoilChecks = pgTable("zone_soil_checks", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id")
    .notNull()
    .references(() => zones.id, { onDelete: "cascade" }),

  /** Vollständige Rohantworten aller Screens – Grundlage, um die Auswertungslogik später zu verbessern, ohne den Check erneut durchführen zu lassen. */
  answers: jsonb("answers").$type<SoilCheckAnswers>().notNull(),

  soilTexture: text("soil_texture").notNull(),
  phValue: real("ph_value").notNull(),
  phClassification: text("ph_classification").notNull(),
  drainageClass: text("drainage_class").notNull(),
  infiltrationCmPerHour: real("infiltration_cm_per_hour"),
  waterRetentionClass: text("water_retention_class").notNull(),
  stoneContentClass: text("stone_content_class").notNull(),
  organicMatterIndicator: text("organic_matter_indicator").notNull(),
  summaryText: text("summary_text").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});
