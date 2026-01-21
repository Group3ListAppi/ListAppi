import type { MealType, MainIngredient, DietType } from "./RecipeMeta";

export const MEAL_TYPES: MealType[] = [
  "airfryer-ruoat",
  "keitot",
  "salaatit",
  "pastat",
  "hampurilaiset",
  "pihvit",
  "uuniruoat",
  "pataruoat",
  "tacot ja tortillat",
  "muu",
];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  "airfryer-ruoat": "Airfryer-ruoat",
  keitot: "Keitot",
  salaatit: "Salaatit",
  pastat: "Pastat",
  hampurilaiset: "Hampurilaiset",
  pihvit: "Pihvit",
  uuniruoat: "Uuniruoat",
  pataruoat: "Pataruoat",
  "tacot ja tortillat": "Tacot ja tortillat",
  muu: "Muu",
};

export const MAIN_INGREDIENTS: MainIngredient[] = [
  "liha",
  "jauheliha",
  "makkara",
  "broileri",
  "kala",
  "äyriäiset",
  "kananmuna",
  "kasvis",
  "kasviproteiini",
  "muu",
];

export const MAIN_INGREDIENT_LABELS: Record<MainIngredient, string> = {
  liha: "Liha",
  jauheliha: "Jauheliha",
  makkara: "Makkara",
  broileri: "Broileri",
  kala: "Kala",
  äyriäiset: "Äyriäiset",
  kananmuna: "Kananmuna",
  kasvis: "Kasvis",
  kasviproteiini: "Kasviproteiini",
  muu: "Muu",
};

export const DIET_TYPES: DietType[] = [
  "gluteeniton",
  "kananmunaton",
  "kasvis",
  "laktoositon",
  "maidoton",
  "vegaaninen",
];

export const DIET_TYPE_LABELS: Record<DietType, string> = {
  gluteeniton: "Gluteeniton",
  kananmunaton: "Kananmunaton",
  kasvis: "Kasvis",
  laktoositon: "Laktoositon",
  maidoton: "Maidoton",
  vegaaninen: "Vegaaninen",
};
