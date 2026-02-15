import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import Svg, { G, Path, Text as SvgText } from 'react-native-svg'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { 
  MEAL_TYPES, MEAL_TYPE_LABELS, 
  MAIN_INGREDIENTS, MAIN_INGREDIENT_LABELS,
  DIET_TYPES, DIET_TYPE_LABELS 
} from '../types/filterConstants'
import type { MealType, MainIngredient, DietType } from '../types/RecipeMeta'

const MEAL_CHART_COLORS = [
  '#8fb6d6',
  '#e65f70',
  '#f2a65a',
  '#ffd166',
  '#6ec6d3',
  '#9b59b6',
  '#2ecc71',
  '#e67e22',
  '#3498db',
  '#95a5a6',
]

const RECIPE_DATASETS = [
  { key: 'meal', label: 'Ruokalajit' },
  { key: 'main', label: 'Pääraaka-aineet' },
  { key: 'diet', label: 'Ruokavaliot' },
] as const

const SHOPLIST_RANGES = [
  { days: 30, label: '30 pv' },
  { days: 90, label: '90 pv' },
  { days: 365, label: '1 vuosi' },
] as const

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

const describeArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(centerX, centerY, radius, endAngle)
  const end = polarToCartesian(centerX, centerY, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

interface AccountStatsSectionProps {
  chartType: 'pie' | 'bars'
  dataSource: 'recipes' | 'shoplist'
  dietCounts: Record<DietType, number> | null
  loadingMeals: boolean
  loadingShoplistStats: boolean
  mealTypeCounts: Record<MealType, number> | null
  mainIngredientCounts: Record<MainIngredient, number> | null
  recipeDataset: 'meal' | 'diet' | 'main'
  recipeMenuOpen: boolean
  setChartType: Dispatch<SetStateAction<'pie' | 'bars'>>
  setDataSource: Dispatch<SetStateAction<'recipes' | 'shoplist'>>
  setRecipeDataset: Dispatch<SetStateAction<'meal' | 'diet' | 'main'>>
  setRecipeMenuOpen: Dispatch<SetStateAction<boolean>>
  setShoplistChartType: Dispatch<SetStateAction<'pie' | 'bars'>>
  setShoplistRangeDays: Dispatch<SetStateAction<number>>
  setShoplistRangeOpen: Dispatch<SetStateAction<boolean>>
  shoplistChartType: 'pie' | 'bars'
  shoplistItemCounts: Array<{ label: string; count: number }>
  shoplistRangeDays: number
  shoplistRangeOpen: boolean
}

const AccountStatsSection = ({
  chartType,
  dataSource,
  dietCounts,
  loadingMeals,
  loadingShoplistStats,
  mealTypeCounts,
  mainIngredientCounts,
  recipeDataset,
  recipeMenuOpen,
  setChartType,
  setDataSource,
  setRecipeDataset,
  setRecipeMenuOpen,
  setShoplistChartType,
  setShoplistRangeDays,
  setShoplistRangeOpen,
  shoplistChartType,
  shoplistItemCounts,
  shoplistRangeDays,
  shoplistRangeOpen,
}: AccountStatsSectionProps) => {
  const theme = useTheme()

  const totalDiets = dietCounts ? Object.values(dietCounts).reduce((sum, v) => sum + v, 0) : 0
  const dietLegend = DIET_TYPES.map((diet, index) => ({
    dietType: diet,
    label: DIET_TYPE_LABELS[diet],
    count: dietCounts?.[diet] ?? 0,
    color: MEAL_CHART_COLORS[index % MEAL_CHART_COLORS.length],
  }))
  const dietSlices = dietLegend.filter((slice) => slice.count > 0)
  const maxDietCount = dietLegend.reduce((max, slice) => Math.max(max, slice.count), 0)

  const totalMeals = mealTypeCounts ? Object.values(mealTypeCounts).reduce((sum, value) => sum + value, 0) : 0
  const mealLegend = MEAL_TYPES.map((mealType, index) => ({
    mealType,
    label: MEAL_TYPE_LABELS[mealType],
    count: mealTypeCounts?.[mealType] ?? 0,
    color: MEAL_CHART_COLORS[index % MEAL_CHART_COLORS.length],
  }))
  const mealSlices = mealLegend.filter((slice) => slice.count > 0)
  const maxMealCount = mealLegend.reduce((max, slice) => Math.max(max, slice.count), 0)

  const totalMainIngredients = mainIngredientCounts ? Object.values(mainIngredientCounts).reduce((sum, value) => sum + value, 0) : 0
  const mainIngredientLegend = MAIN_INGREDIENTS.map((mainIng, index) => ({
    mainIngredient: mainIng,
    label: MAIN_INGREDIENT_LABELS[mainIng],
    count: mainIngredientCounts?.[mainIng] ?? 0,
    color: MEAL_CHART_COLORS[index % MEAL_CHART_COLORS.length],
  }))
  const mainIngredientSlices = mainIngredientLegend.filter((slice) => slice.count > 0)
  const maxMainIngredientCount = mainIngredientLegend.reduce((max, slice) => Math.max(max, slice.count), 0)

  const recipeDatasetLabel = RECIPE_DATASETS.find((dataset) => dataset.key === recipeDataset)?.label ?? ''
  const maxShoplistCount = shoplistItemCounts.reduce((max, item) => Math.max(max, item.count), 0)
  const totalShoplistItems = shoplistItemCounts.reduce((sum, item) => sum + item.count, 0)
  const shoplistRangeLabel = SHOPLIST_RANGES.find((range) => range.days === shoplistRangeDays)?.label ?? ''
  const recipeDistributionLabel = recipeDataset === 'meal'
    ? 'ruokalajit'
    : recipeDataset === 'main'
      ? 'pääraaka-aineet'
      : 'ruokavaliot'

  return (
    <View style={styles.chartSection}>
      <Text variant="titleMedium" style={styles.chartTitle}>Käyttäjätilastot</Text>
      <View style={[styles.dataSourceRow, { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface }]}>
        <View style={styles.dropdownWrapper}>
          <Pressable
            style={[
              styles.dataSourceButton,
              dataSource === 'recipes'
                ? { backgroundColor: theme.colors.primaryContainer }
                : { backgroundColor: 'transparent' },
            ]}
            onPress={() => {
              setDataSource('recipes')
              setShoplistRangeOpen(false)
              setRecipeMenuOpen((open) => !open)
            }}
          >
            <Text style={styles.dataSourceButtonText}>
              {recipeDatasetLabel ? `Reseptit` : 'Reseptit'}
            </Text>
            <MaterialCommunityIcons
              name={recipeMenuOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.onSurface}
            />
          </Pressable>
          {recipeMenuOpen && dataSource === 'recipes' && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {RECIPE_DATASETS.map((dataset) => {
                const selected = dataset.key === recipeDataset
                return (
                  <Pressable
                    key={dataset.key}
                    onPress={() => {
                      setRecipeDataset(dataset.key)
                      setRecipeMenuOpen(false)
                    }}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      pressed && {
                        backgroundColor:
                          theme.colors.surfaceVariant || theme.colors.surface,
                      },
                      selected && {
                        backgroundColor: theme.colors.secondaryContainer,
                      },
                    ]}
                  >
                    <View style={styles.dropdownItemRow}>
                      {selected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color={theme.colors.onSecondaryContainer}
                        />
                      )}
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && { color: theme.colors.onSecondaryContainer },
                        ]}
                      >
                        {dataset.label}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>
        <View style={[styles.dropdownWrapper, styles.shoplistDropdownWrapper]}>
          <Pressable
            style={[
              styles.dataSourceButton,
              dataSource === 'shoplist'
                ? { backgroundColor: theme.colors.primaryContainer }
                : { backgroundColor: 'transparent' },
            ]}
            onPress={() => {
              setDataSource('shoplist')
              setRecipeMenuOpen(false)
              setShoplistRangeOpen((open) => !open)
            }}
          >
            <Text style={styles.dataSourceButtonText}>
              {shoplistRangeLabel
                ? `Ostoslistat`
                : 'Ostoslistat'}
            </Text>
            <MaterialCommunityIcons
              name={shoplistRangeOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.onSurface}
            />
          </Pressable>
          {shoplistRangeOpen && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {SHOPLIST_RANGES.map((range) => {
                const selected = range.days === shoplistRangeDays
                return (
                  <Pressable
                    key={range.days}
                    onPress={() => {
                      setShoplistRangeDays(range.days)
                      setShoplistRangeOpen(false)
                    }}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      pressed && {
                        backgroundColor:
                          theme.colors.surfaceVariant || theme.colors.surface,
                      },
                      selected && {
                        backgroundColor: theme.colors.secondaryContainer,
                      },
                    ]}
                  >
                    <View style={styles.dropdownItemRow}>
                      {selected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color={theme.colors.onSecondaryContainer}
                        />
                      )}
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && { color: theme.colors.onSecondaryContainer },
                        ]}
                      >
                        {range.label}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>
      </View>
      {dataSource === 'recipes' && (recipeDataset === 'meal' || recipeDataset === 'main' || recipeDataset === 'diet') && (
        <View style={styles.chartToggle}>
          <Pressable
            onPress={() => setChartType('pie')}
            style={[
              styles.chartToggleButton,
              chartType === 'pie'
                ? { backgroundColor: theme.colors.primaryContainer }
                : { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface },
            ]}
          >
            <Text style={styles.chartToggleText}>Piirakkakaavio</Text>
          </Pressable>
          <Pressable
            onPress={() => setChartType('bars')}
            style={[
              styles.chartToggleButton,
              chartType === 'bars'
                ? { backgroundColor: theme.colors.primaryContainer }
                : { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface },
            ]}
          >
            <Text style={styles.chartToggleText}>Vaakapalkkikaavio</Text>
          </Pressable>
        </View>
      )}
      {loadingMeals && (
        <Text style={styles.chartHelper}>Ladataan...</Text>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'meal' && totalMeals === 0 && (
        <Text style={styles.chartHelper}>Ei vielä reseptejä ruokalajeilla.</Text>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'meal' && totalMeals > 0 && chartType === 'pie' && (
        <View style={styles.pieLayout}>
          <View style={styles.legendColumn}>
            <Text style={styles.shoplistTitle}>
              {`Reseptien jakauma (${recipeDistributionLabel})`}
            </Text>
            {mealLegend.map((slice) => (
              <View key={slice.mealType} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text style={styles.legendLabel}>{slice.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.pieChart}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <G>
                {mealSlices.map((slice, index) => {
                  const startAngle = mealSlices
                    .slice(0, index)
                    .reduce((sum, item) => sum + (item.count / totalMeals) * 360, 0)
                  const angle = (slice.count / totalMeals) * 360
                  const endAngle = startAngle + angle
                  const percent = Math.round((slice.count / totalMeals) * 100)
                  const showLabel = percent >= 4
                  const labelAngle = startAngle + angle / 2
                  const labelPos = polarToCartesian(100, 100, 60, labelAngle)

                  return (
                    <G key={slice.mealType}>
                      <Path
                        d={describeArc(100, 100, 90, startAngle, endAngle)}
                        fill={slice.color}
                      />
                      {showLabel && (
                        <SvgText
                          x={labelPos.x}
                          y={labelPos.y}
                          fill="#ffffff"
                          fontSize="16"
                          fontWeight="700"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {`${percent}%`}
                        </SvgText>
                      )}
                    </G>
                  )
                })}
              </G>
            </Svg>
          </View>
        </View>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'meal' && totalMeals > 0 && chartType === 'bars' && (
        <View style={styles.hBarList}>
          <Text style={styles.shoplistTitle}>
            {`Reseptien jakauma (${recipeDistributionLabel})`}
          </Text>
          {mealLegend.map((slice) => {
            const ratio = maxMealCount > 0 ? slice.count / maxMealCount : 0
            const widthPercent = Math.max(ratio * 100, slice.count > 0 ? 6 : 0)
            return (
              <View key={slice.mealType} style={styles.hBarRow}>
                <View style={styles.hBarLabelRow}>
                  <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                  <Text style={styles.hBarLabel}>{slice.label}</Text>
                  <Text style={styles.hBarCount}>{slice.count}</Text>
                </View>
                <View
                  style={[
                    styles.hBarTrack,
                    { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.hBarFill,
                      { width: `${widthPercent}%`, backgroundColor: slice.color },
                    ]}
                  />
                </View>
              </View>
            )
          })}
        </View>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'main' && totalMainIngredients === 0 && (
        <Text style={styles.chartHelper}>Ei vielä reseptejä pääraaka-aineilla.</Text>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'main' && totalMainIngredients > 0 && chartType === 'pie' && (
        <View style={styles.pieLayout}>
          <View style={styles.legendColumn}>
            <Text style={styles.shoplistTitle}>
              {`Reseptien jakauma (${recipeDistributionLabel})`}
            </Text>
            {mainIngredientLegend.map((slice) => (
              <View key={slice.mainIngredient} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text style={styles.legendLabel}>{slice.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.pieChart}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <G>
                {mainIngredientSlices.map((slice, index) => {
                  const startAngle = mainIngredientSlices
                    .slice(0, index)
                    .reduce((sum, item) => sum + (item.count / totalMainIngredients) * 360, 0)
                  const angle = (slice.count / totalMainIngredients) * 360
                  const endAngle = startAngle + angle
                  const percent = Math.round((slice.count / totalMainIngredients) * 100)
                  const showLabel = percent >= 4
                  const labelAngle = startAngle + angle / 2
                  const labelPos = polarToCartesian(100, 100, 60, labelAngle)

                  return (
                    <G key={slice.mainIngredient}>
                      <Path
                        d={describeArc(100, 100, 90, startAngle, endAngle)}
                        fill={slice.color}
                      />
                      {showLabel && (
                        <SvgText
                          x={labelPos.x}
                          y={labelPos.y}
                          fill="#ffffff"
                          fontSize="16"
                          fontWeight="700"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {`${percent}%`}
                        </SvgText>
                      )}
                    </G>
                  )
                })}
              </G>
            </Svg>
          </View>
        </View>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'main' && totalMainIngredients > 0 && chartType === 'bars' && (
        <View style={styles.hBarList}>
          <Text style={styles.shoplistTitle}>
            {`Reseptien jakauma (${recipeDistributionLabel})`}
          </Text>
          {mainIngredientLegend.map((slice) => {
            const ratio = maxMainIngredientCount > 0 ? slice.count / maxMainIngredientCount : 0
            const widthPercent = Math.max(ratio * 100, slice.count > 0 ? 6 : 0)
            return (
              <View key={slice.mainIngredient} style={styles.hBarRow}>
                <View style={styles.hBarLabelRow}>
                  <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                  <Text style={styles.hBarLabel}>{slice.label}</Text>
                  <Text style={styles.hBarCount}>{slice.count}</Text>
                </View>
                <View
                  style={[
                    styles.hBarTrack,
                    { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.hBarFill,
                      { width: `${widthPercent}%`, backgroundColor: slice.color },
                    ]}
                  />
                </View>
              </View>
            )
          })}
        </View>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'diet' && totalDiets === 0 && (
        <Text style={styles.chartHelper}>Ei vielä reseptejä ruokavaliomerkinnöillä.</Text>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'diet' && totalDiets > 0 && chartType === 'pie' && (
        <View style={styles.pieLayout}>
          <View style={styles.legendColumn}>
            <Text style={styles.shoplistTitle}>
              {`Reseptien jakauma (${recipeDistributionLabel})`}
            </Text>
            {dietLegend.map((slice) => (
              <View key={slice.dietType} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text style={styles.legendLabel}>{slice.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pieChart}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <G>
                {dietSlices.map((slice, index) => {
                  const startAngle = dietSlices
                    .slice(0, index)
                    .reduce((sum, item) => sum + (item.count / totalDiets) * 360, 0)
                  const angle = (slice.count / totalDiets) * 360
                  const endAngle = startAngle + angle
                  const percent = Math.round((slice.count / totalDiets) * 100)
                  const showLabel = percent >= 4
                  const labelAngle = startAngle + angle / 2
                  const labelPos = polarToCartesian(100, 100, 60, labelAngle)

                  return (
                    <G key={slice.dietType}>
                      <Path
                        d={describeArc(100, 100, 90, startAngle, endAngle)}
                        fill={slice.color}
                      />
                      {showLabel && (
                        <SvgText
                          x={labelPos.x}
                          y={labelPos.y}
                          fill="#ffffff"
                          fontSize="16"
                          fontWeight="700"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {`${percent}%`}
                        </SvgText>
                      )}
                    </G>
                  )
                })}
              </G>
            </Svg>
          </View>
        </View>
      )}
      {!loadingMeals && dataSource === 'recipes' && recipeDataset === 'diet' && totalDiets > 0 && chartType === 'bars' && (
        <View style={styles.hBarList}>
          <Text style={styles.shoplistTitle}>
            {`Reseptien jakauma (${recipeDistributionLabel})`}
          </Text>

          {dietLegend.map((slice) => {
            const ratio = maxDietCount > 0 ? slice.count / maxDietCount : 0
            const widthPercent = Math.max(ratio * 100, slice.count > 0 ? 6 : 0)

            return (
              <View key={slice.dietType} style={styles.hBarRow}>
                <View style={styles.hBarLabelRow}>
                  <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                  <Text style={styles.hBarLabel}>{slice.label}</Text>
                  <Text style={styles.hBarCount}>{slice.count}</Text>
                </View>

                <View
                  style={[
                    styles.hBarTrack,
                    { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.hBarFill,
                      { width: `${widthPercent}%`, backgroundColor: slice.color },
                    ]}
                  />
                </View>
              </View>
            )
          })}
        </View>
      )}
      {dataSource === 'shoplist' && loadingShoplistStats && (
        <Text style={styles.chartHelper}>Ladataan ostoslistatietoja...</Text>
      )}
      {dataSource === 'shoplist' && !loadingShoplistStats && shoplistItemCounts.length === 0 && (
        <Text style={styles.chartHelper}>Ei ostoksia viimeisen {shoplistRangeLabel} ajalta.</Text>
      )}
      {dataSource === 'shoplist' && !loadingShoplistStats && shoplistItemCounts.length > 0 && (
        <View style={styles.chartToggle}>
          <Pressable
            onPress={() => setShoplistChartType('pie')}
            style={[
              styles.chartToggleButton,
              shoplistChartType === 'pie'
                ? { backgroundColor: theme.colors.primaryContainer }
                : { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface },
            ]}
          >
            <Text style={styles.chartToggleText}>Piirakkakaavio</Text>
          </Pressable>
          <Pressable
            onPress={() => setShoplistChartType('bars')}
            style={[
              styles.chartToggleButton,
              shoplistChartType === 'bars'
                ? { backgroundColor: theme.colors.primaryContainer }
                : { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface },
            ]}
          >
            <Text style={styles.chartToggleText}>Vaakapalkkikaavio</Text>
          </Pressable>
        </View>
      )}
      {dataSource === 'shoplist' && !loadingShoplistStats && shoplistItemCounts.length > 0 && shoplistChartType === 'pie' && (
        <View style={styles.pieLayout}>
          <View style={styles.legendColumn}>
            <Text style={styles.shoplistTitle}>Useimmin ostetut ({shoplistRangeLabel})</Text>
            {shoplistItemCounts.map((item, index) => (
              <View key={`${item.label}-${index}`} style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: MEAL_CHART_COLORS[index % MEAL_CHART_COLORS.length] },
                  ]}
                />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.pieChart}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <G>
                {shoplistItemCounts.map((item, index) => {
                  const startAngle = shoplistItemCounts
                    .slice(0, index)
                    .reduce((sum, current) => sum + (current.count / totalShoplistItems) * 360, 0)
                  const angle = (item.count / totalShoplistItems) * 360
                  const endAngle = startAngle + angle
                  const percent = Math.round((item.count / totalShoplistItems) * 100)
                  const showLabel = percent >= 6
                  const labelAngle = startAngle + angle / 2
                  const labelPos = polarToCartesian(100, 100, 60, labelAngle)
                  const color = MEAL_CHART_COLORS[index % MEAL_CHART_COLORS.length]

                  return (
                    <G key={`${item.label}-${index}`}>
                      <Path
                        d={describeArc(100, 100, 90, startAngle, endAngle)}
                        fill={color}
                      />
                      {showLabel && (
                        <SvgText
                          x={labelPos.x}
                          y={labelPos.y}
                          fill="#ffffff"
                          fontSize="14"
                          fontWeight="700"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {`${percent}%`}
                        </SvgText>
                      )}
                    </G>
                  )
                })}
              </G>
            </Svg>
          </View>
        </View>
      )}
      {dataSource === 'shoplist' && !loadingShoplistStats && shoplistItemCounts.length > 0 && shoplistChartType === 'bars' && (
        <View style={styles.hBarList}>
          <Text style={styles.shoplistTitle}>Useimmin ostetut ({shoplistRangeLabel})</Text>
          {shoplistItemCounts.map((item, index) => {
            const ratio = maxShoplistCount > 0 ? item.count / maxShoplistCount : 0
            const widthPercent = Math.max(ratio * 100, item.count > 0 ? 6 : 0)
            const color = MEAL_CHART_COLORS[index % MEAL_CHART_COLORS.length]

            return (
              <View key={`${item.label}-${index}`} style={styles.hBarRow}>
                <View style={styles.hBarLabelRow}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.hBarLabel}>{item.label}</Text>
                  <Text style={styles.hBarCount}>{item.count}</Text>
                </View>
                <View
                  style={[
                    styles.hBarTrack,
                    { backgroundColor: theme.colors.surfaceVariant || theme.colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.hBarFill,
                      { width: `${widthPercent}%`, backgroundColor: color },
                    ]}
                  />
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  chartSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chartTitle: {
    marginBottom: 8,
  },
  dataSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 6,
    borderRadius: 14,
  },
  dataSourceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataSourceButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownWrapper: {
    flex: 1.15,
    position: 'relative',
  },
  shoplistDropdownWrapper: {
    flex: 0.85,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    padding: 6,
    borderRadius: 12,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  chartHelper: {
    opacity: 0.7,
    marginBottom: 8,
  },
  chartToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chartToggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  chartToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pieLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendColumn: {
    flex: 1,
    gap: 8,
  },
  pieChart: {
    width: 200,
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
  },
  hBarList: {
    gap: 12,
  },
  hBarRow: {
    gap: 6,
  },
  hBarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hBarLabel: {
    flex: 1,
    fontSize: 13,
  },
  hBarCount: {
    fontSize: 12,
    opacity: 0.7,
    fontVariant: ['tabular-nums'],
  },
  hBarTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  hBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  shoplistTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
})

export default AccountStatsSection
