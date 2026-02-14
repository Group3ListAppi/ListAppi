import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  Divider,
  HelperText,
  RadioButton,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import ScreenLayout from "../components/ScreenLayout";
import {
  filterMeals,
  listFilterValues,
  searchMealsByName,
  type MealDbFilterMode,
  type MealDbListItem,
} from "../api/themealdb";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MEALDB_SEARCH_CACHE_KEY = "themealdb:search:v1";
const TTL_MS = 6 * 60 * 60 * 1000; // 6h
const DEBOUNCE_MS = 450;

type FilterModeUi = MealDbFilterMode | "none";

interface Props {
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
  isPremium?: boolean;
}

const MealDbSearchScreen: React.FC<Props> = ({ activeScreen, onNavigate, onBack }) => {
  const theme = useTheme();
  const mountedRef = useRef(true);

  // Cache gate: estä haku kunnes cache on luettu
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Kaksi hakukenttää
  const [nameQuery, setNameQuery] = useState("");
  const [ingQuery, setIngQuery] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedIng, setDebouncedIng] = useState("");

  // Suodattimet (kategoria/area)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterModeUi>("none");
  const [filterValue, setFilterValue] = useState("");

  // Filter listan haku (dialogissa)
  const [filterSearch, setFilterSearch] = useState("");
  const [filterValues, setFilterValues] = useState<string[]>([]);
  const [filterValuesLoading, setFilterValuesLoading] = useState(false);
  const [filterValuesError, setFilterValuesError] = useState<string | null>(null);

  // Tulokset
  const [results, setResults] = useState<MealDbListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------- CACHE: load on mount ----------
  useEffect(() => {
    const loadCache = async () => {
      try {
        const raw = await AsyncStorage.getItem(MEALDB_SEARCH_CACHE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);

        // 6h TTL
        const fresh = Date.now() - (parsed.ts ?? 0) < TTL_MS;
        if (!fresh) {
          await AsyncStorage.removeItem(MEALDB_SEARCH_CACHE_KEY);
          return;
        }

        setNameQuery(parsed.nameQuery ?? "");
        setIngQuery(parsed.ingQuery ?? "");
        setFilterMode(parsed.filterMode ?? "none");
        setFilterValue(parsed.filterValue ?? "");
        setResults(Array.isArray(parsed.results) ? parsed.results : []);
      } catch (e) {
        console.log("MealDbSearch cache load failed:", e);
      }
    };

    loadCache().finally(() => setCacheLoaded(true));
  }, []);

  // ---------- Debounce ----------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(nameQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [nameQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedIng(ingQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [ingQuery]);

  const activeFilterLabel = useMemo(() => {
    if (filterMode === "none" || !filterValue) return "";
    const title = filterMode === "category" ? "Kategoria" : "Maa";
    return `${title}: ${filterValue}`;
  }, [filterMode, filterValue]);

  const clearFilter = () => {
    setFilterMode("none");
    setFilterValue("");
    setFilterSearch("");
    setFilterValues([]);
    setFilterValuesError(null);
  };

  // ---------- Load filter values (category/area) ----------
  useEffect(() => {
    const load = async () => {
      if (filterMode === "none") {
        setFilterValues([]);
        setFilterValuesError(null);
        return;
      }

      setFilterValuesLoading(true);
      setFilterValuesError(null);
      try {
        const values = await listFilterValues(filterMode);
        if (mountedRef.current) setFilterValues(values);
      } catch (e) {
        console.error(e);
        if (mountedRef.current) setFilterValuesError("Suodatinlistan lataus epäonnistui.");
      } finally {
        if (mountedRef.current) setFilterValuesLoading(false);
      }
    };

    load();
  }, [filterMode]);

  // ---------- Search: name + ingredient + optional category/area (intersection by idMeal) ----------
  useEffect(() => {
    // estä “välähdys” ennen kuin cache on luettu
    if (!cacheLoaded) return;

    const run = async () => {
      setError(null);

      const hasName = debouncedName.length > 0;
      const hasIng = debouncedIng.length > 0;
      const hasOtherFilter = filterMode !== "none" && !!filterValue;

      if (!hasName && !hasIng && !hasOtherFilter) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const byNamePromise = hasName
          ? searchMealsByName(debouncedName)
          : Promise.resolve<MealDbListItem[] | null>(null);

        const byIngPromise = hasIng
          ? filterMeals("ingredient", debouncedIng)
          : Promise.resolve<MealDbListItem[] | null>(null);

        const byOtherPromise = hasOtherFilter
          ? filterMeals(filterMode as MealDbFilterMode, filterValue)
          : Promise.resolve<MealDbListItem[] | null>(null);

        const [byName, byIng, byOther] = await Promise.all([byNamePromise, byIngPromise, byOtherPromise]);

        // base: name > ingredient > other
        let base: MealDbListItem[] = (byName ?? byIng ?? byOther ?? []) as MealDbListItem[];

        // intersection with ingredient if both present
        if (byName && byIng) {
          const ingSet = new Set(byIng.map((m) => m.idMeal));
          base = byName.filter((m) => ingSet.has(m.idMeal));
        }

        // intersection with category/area if present
        if (byOther) {
          const otherSet = new Set(byOther.map((m) => m.idMeal));
          base = base.filter((m) => otherSet.has(m.idMeal));
        }

        // dedupe
        const map = new Map<string, MealDbListItem>();
        for (const m of base) map.set(m.idMeal, m);

        if (mountedRef.current) setResults(Array.from(map.values()));
      } catch (e) {
        console.error(e);
        if (mountedRef.current) setError("Haku epäonnistui. Yritä uudelleen.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    run();
  }, [cacheLoaded, debouncedName, debouncedIng, filterMode, filterValue]);

  // ---------- CACHE: save when state changes ----------
  useEffect(() => {
    if (!cacheLoaded) return; // älä tallenna ennen kuin initial cache load tehty

    const hasAnyCriteria =
      nameQuery.trim().length > 0 ||
      ingQuery.trim().length > 0 ||
      (filterMode !== "none" && !!filterValue);

    // tallenna myös "0 tulosta" jos käyttäjä on tehnyt haun/suodatuksen
    if (!hasAnyCriteria && results.length === 0) return;

    const saveCache = async () => {
      try {
        const payload = {
          nameQuery,
          ingQuery,
          filterMode,
          filterValue,
          results,
          ts: Date.now(),
        };
        await AsyncStorage.setItem(MEALDB_SEARCH_CACHE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.log("MealDbSearch cache save failed:", e);
      }
    };

    saveCache();
  }, [cacheLoaded, nameQuery, ingQuery, filterMode, filterValue, results]);

  const emptyText =
    debouncedName || debouncedIng || activeFilterLabel
      ? "Ei osumia. Kokeile toista hakua tai muuta suodatinta."
      : "Hae reseptin nimellä ja/tai ainesosalla, tai valitse suodatin.";

  const renderItem = useCallback(
    ({ item }: { item: MealDbListItem }) => (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            opacity: pressed ? 0.85 : 1,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        onPress={() =>
          onNavigate("recipe-suggestion-detail", {
            source: "themealdb",
            idMeal: item.idMeal,
          })
        }
      >
        {item.strMealThumb ? (
          <Image source={{ uri: item.strMealThumb }} style={styles.thumb} />
        ) : (
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: theme.colors.surfaceVariant,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Ei kuvaa</Text>
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="titleMedium" numberOfLines={2}>
            {item.strMeal}
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>TheMealDB</Text>
        </View>
      </Pressable>
    ),
    [onNavigate, theme.colors]
  );

  const ListHeader = (
    <View style={{ marginBottom: 8 }}>
      <Searchbar
        placeholder='Hae reseptin nimellä (esim. "chicken")'
        value={nameQuery}
        onChangeText={(t) => {
          setNameQuery(t);
          if (error) setError(null);
        }}
        autoCapitalize="none"
        style={{ marginBottom: 10 }}
      />

      <Searchbar
        placeholder='Hae ainesosalla (englanniksi, esim. "rice")'
        value={ingQuery}
        onChangeText={(t) => {
          setIngQuery(t);
          if (error) setError(null);
        }}
        autoCapitalize="none"
        style={{ marginBottom: 10 }}
      />

      <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10 }}>
        Vinkki: ainesosahaku toimii parhaiten englanniksi.
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Chip icon="tune" onPress={() => setFilterDialogOpen(true)}>
          Suodattimet
        </Chip>

        {activeFilterLabel ? (
          <Chip icon="close" onPress={clearFilter}>
            {activeFilterLabel}
          </Chip>
        ) : null}

        {debouncedName ? (
          <Chip icon="close" onPress={() => setNameQuery("")}>
            Nimi: {debouncedName}
          </Chip>
        ) : null}

        {debouncedIng ? (
          <Chip icon="close" onPress={() => setIngQuery("")}>
            Ainesosa: {debouncedIng}
          </Chip>
        ) : null}
      </View>

      <Divider style={{ marginTop: 12 }} />
    </View>
  );

  // Dialogin listadata
  const filteredFilterValues = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    if (!q) return filterValues.slice(0, 80);
    return filterValues.filter((v) => v.toLowerCase().includes(q)).slice(0, 200);
  }, [filterSearch, filterValues]);

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      showNav={false}
      showBack={true}
      onBack={onBack}
      hideActions={true}
      customTitle="Hae reseptejä (TheMealDB)"
    >
      <View style={styles.container}>
        <FlatList
          data={results}
          keyExtractor={(item) => item.idMeal}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 140 }}
          ListEmptyComponent={
            loading ? null : (
              <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                {emptyText}
              </Text>
            )
          }
          keyboardShouldPersistTaps="handled"
        />

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator animating />
          </View>
        ) : null}

        {error ? (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        ) : null}

        {/* Filters dialog (vain category/area) */}
        <Dialog
          visible={filterDialogOpen}
          onDismiss={() => setFilterDialogOpen(false)}
          style={{ maxHeight: "90%", overflow: "hidden" }}
        >
          <Dialog.Title>Suodattimet</Dialog.Title>

          <Dialog.Content>
            <Text style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
              Valitse suodatustapa (yksi kerrallaan) ja arvo.
            </Text>

            <RadioButton.Group
              onValueChange={(v) => {
                setFilterMode(v as FilterModeUi);
                setFilterValue("");
                setFilterSearch("");
              }}
              value={filterMode}
            >
              <RadioButton.Item label="Ei suodatinta" value="none" />
              <RadioButton.Item label="Kategoria" value="category" />
              <RadioButton.Item label="Maa (Area)" value="area" />
            </RadioButton.Group>

            {filterMode !== "none" ? (
              <>
                <Divider style={{ marginVertical: 8 }} />
                <Searchbar
                  placeholder="Hae suodatinlistasta..."
                  value={filterSearch}
                  onChangeText={setFilterSearch}
                  autoCapitalize="none"
                />
              </>
            ) : null}
          </Dialog.Content>

          {filterMode !== "none" ? (
            <Dialog.ScrollArea style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
              {filterValuesLoading ? (
                <ActivityIndicator animating style={{ marginTop: 12 }} />
              ) : filterValuesError ? (
                <HelperText type="error" visible={true}>
                  {filterValuesError}
                </HelperText>
              ) : (
                <FlatList
                  data={filteredFilterValues}
                  keyExtractor={(v) => v}
                  keyboardShouldPersistTaps="handled"
                  numColumns={2}
                  columnWrapperStyle={{ gap: 8 }}
                  contentContainerStyle={{ paddingTop: 12, paddingBottom: 12, gap: 8 }}
                  style={{ flexGrow: 0 }}
                  removeClippedSubviews
                  windowSize={5}
                  initialNumToRender={30}
                  maxToRenderPerBatch={30}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: v }) => (
                    <Chip
                      selected={filterValue === v}
                      onPress={() => {
                        setFilterValue(v);
                        setFilterDialogOpen(false);
                      }}
                    >
                      {v}
                    </Chip>
                  )}
                />
              )}
            </Dialog.ScrollArea>
          ) : null}

          <Dialog.Actions>
            <Button onPress={() => setFilterDialogOpen(false)}>Sulje</Button>
          </Dialog.Actions>
        </Dialog>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 165,
    right: 16,
  },
});

export default MealDbSearchScreen;