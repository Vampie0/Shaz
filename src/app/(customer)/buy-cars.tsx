import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import MarketplaceCarCard from "@/components/customer/MarketplaceCarCard";
import ScreenContainer from "@/components/ui/ScreenContainer";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/theme";
import { useMarketplaceCars } from "@/features/customer/use-marketplace-cars";
import { useAppTheme } from "@/hooks/use-app-theme";

type SortOption =
  | "newest"
  | "price_low"
  | "price_high"
  | "mileage_low";

type SearchFilters = {
  makeModel: string;
  location: string;
  minPrice: string;
  maxPrice: string;
  fuelType: string;
  transmission: string;
  maxMileage: string;
  sortBy: SortOption;
};

type InlineSelectProps = {
  label: string;
  valueLabel: string;
  expanded: boolean;
  options: Array<{
    label: string;
    value: string;
  }>;
  onToggle: () => void;
  onSelect: (
    value: string,
  ) => void;
};

const emptyFilters: SearchFilters = {
  makeModel: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  fuelType: "",
  transmission: "",
  maxMileage: "",
  sortBy: "newest",
};

function normalized(
  value: string | null | undefined,
) {
  return (
    value
      ?.trim()
      .toLowerCase() ??
    ""
  );
}

function parseNumber(
  value: string,
) {
  if (!value.trim()) {
    return null;
  }

  const parsed =
    Number(
      value.replace(
        /[^0-9.]/g,
        "",
      ),
    );

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function titleCase(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function sortLabel(
  value: SortOption,
) {
  switch (value) {
    case "price_low":
      return "Sort by: Price (Low to High)";

    case "price_high":
      return "Sort by: Price (High to Low)";

    case "mileage_low":
      return "Sort by: Lowest Mileage";

    case "newest":
    default:
      return "Sort by: Newest";
  }
}

function newestTime(
  publishedAt: string | null,
  createdAt: string,
) {
  const value =
    publishedAt ??
    createdAt;

  const time =
    new Date(value).getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}

function InlineSelect({
  label,
  valueLabel,
  expanded,
  options,
  onToggle,
  onSelect,
}: InlineSelectProps) {
  const theme =
    useAppTheme();

  return (
    <View style={styles.selectWrap}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [
          styles.selectRow,
          {
            borderBottomColor:
              theme.border,
          },
          pressed &&
            styles.pressed,
        ]}
      >
        <View style={styles.selectCopy}>
          <Text
            style={[
              styles.selectLabel,
              {
                color:
                  theme.textMuted,
              },
            ]}
          >
            {label}
          </Text>

          <Text
            style={[
              styles.selectValue,
              {
                color:
                  theme.text,
              },
            ]}
          >
            {valueLabel}
          </Text>
        </View>

        <Ionicons
          name={
            expanded
              ? "chevron-up"
              : "chevron-down"
          }
          size={18}
          color={
            theme.textMuted
          }
        />
      </Pressable>

      {expanded ? (
        <View
          style={[
            styles.optionList,
            {
              borderBottomColor:
                theme.border,
            },
          ]}
        >
          {options.map(
            (option) => (
              <Pressable
                key={
                  option.value ||
                  "__any__"
                }
                accessibilityRole="button"
                onPress={() =>
                  onSelect(
                    option.value,
                  )
                }
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function CustomerBuyCarsScreen() {
  const theme =
    useAppTheme();

  const query =
    useMarketplaceCars();

  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<SearchFilters>(
      emptyFilters,
    );

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<SearchFilters>(
      emptyFilters,
    );

  const [
    showAdvanced,
    setShowAdvanced,
  ] = useState(false);

  const [
    openSelect,
    setOpenSelect,
  ] =
    useState<
      | "fuel"
      | "transmission"
      | "sort"
      | null
    >(null);

  const allCars =
    query.data ?? [];

  const fuelOptions = [
    {
      label: "Any Fuel Type",
      value: "",
    },
    {
      label: "Petrol",
      value: "petrol",
    },
    {
      label: "Diesel",
      value: "diesel",
    },
    {
      label: "Hybrid",
      value: "hybrid",
    },
    {
      label: "Electric",
      value: "electric",
    },
  ];

  const transmissionOptions = [
    {
      label: "Any Transmission",
      value: "",
    },
    {
      label: "Manual",
      value: "manual",
    },
    {
      label: "Automatic",
      value: "automatic",
    },
  ];

  const sortOptions = [
    {
      label: "Sort by: Newest",
      value: "newest",
    },
    {
      label: "Sort by: Price (Low to High)",
      value: "price_low",
    },
    {
      label: "Sort by: Price (High to Low)",
      value: "price_high",
    },
    {
      label: "Sort by: Lowest Mileage",
      value: "mileage_low",
    },
  ];

  const results =
    useMemo(() => {
      const makeModel =
        normalized(
          appliedFilters.makeModel,
        );

      const location =
        normalized(
          appliedFilters.location,
        );

      const minPrice =
        parseNumber(
          appliedFilters.minPrice,
        );

      const maxPrice =
        parseNumber(
          appliedFilters.maxPrice,
        );

      const maxMileage =
        parseNumber(
          appliedFilters.maxMileage,
        );

      const filtered =
        allCars.filter(
          (car) => {
            const carName =
              normalized(
                [
                  car.make,
                  car.model,
                  car.variant,
                ]
                  .filter(Boolean)
                  .join(" "),
              );

            const carLocation =
              normalized(
                [
                  car.city,
                  car.postcode,
                  car.registrationCity,
                ]
                  .filter(Boolean)
                  .join(" "),
              );

            if (
              makeModel &&
              !carName.includes(
                makeModel,
              )
            ) {
              return false;
            }

            if (
              location &&
              !carLocation.includes(
                location,
              )
            ) {
              return false;
            }

            if (
              minPrice !== null &&
              car.price <
                minPrice
            ) {
              return false;
            }

            if (
              maxPrice !== null &&
              car.price >
                maxPrice
            ) {
              return false;
            }

            if (
              appliedFilters.fuelType &&
              normalized(
                car.fuelType,
              ) !==
                normalized(
                  appliedFilters.fuelType,
                )
            ) {
              return false;
            }

            if (
              appliedFilters.transmission &&
              normalized(
                car.transmission,
              ) !==
                normalized(
                  appliedFilters.transmission,
                )
            ) {
              return false;
            }

            if (
              maxMileage !== null &&
              car.mileage >
                maxMileage
            ) {
              return false;
            }

            return true;
          },
        );

      return [
        ...filtered,
      ].sort(
        (a, b) => {
          switch (
            appliedFilters.sortBy
          ) {
            case "price_low":
              return (
                a.price -
                b.price
              );

            case "price_high":
              return (
                b.price -
                a.price
              );

            case "mileage_low":
              return (
                a.mileage -
                b.mileage
              );

            case "newest":
            default:
              return (
                newestTime(
                  b.publishedAt,
                  b.createdAt,
                ) -
                newestTime(
                  a.publishedAt,
                  a.createdAt,
                )
              );
          }
        },
      );
    }, [
      allCars,
      appliedFilters,
    ]);

  const hasFilters =
    appliedFilters.makeModel ||
    appliedFilters.location ||
    appliedFilters.minPrice ||
    appliedFilters.maxPrice ||
    appliedFilters.fuelType ||
    appliedFilters.transmission ||
    appliedFilters.maxMileage ||
    appliedFilters.sortBy !==
      "newest";

  const updateDraft = <
    K extends keyof SearchFilters,
  >(
    key: K,
    value: SearchFilters[K],
  ) => {
    setDraftFilters(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  };

  const applySearch = () => {
    setAppliedFilters({
      ...draftFilters,
    });
  };

  const clearSearch = () => {
    setDraftFilters({
      ...emptyFilters,
    });

    setAppliedFilters({
      ...emptyFilters,
    });

    setOpenSelect(null);
  };

  return (
    <ScreenContainer
      contentStyle={
        styles.screen
      }
    >
      <CustomerTopBar
        title="Buy Cars"
        showBack
      />

      <FlatList
        data={results}
        keyExtractor={(item) =>
          item.id
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              query.isRefetching
            }
            onRefresh={() =>
              void query.refetch()
            }
            tintColor={
              theme.primary
            }
            colors={[
              theme.primary,
            ]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <Text
                style={[
                  styles.eyebrow,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                USED CARS
              </Text>

              <Text
                style={[
                  styles.title,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Find the right car for your road ahead.
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Browse active listings from sellers across the UK.
              </Text>
            </View>

            <View
              style={[
                styles.sectionDivider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <View style={styles.searchSection}>
              <View style={styles.field}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      color:
                        theme.textMuted,
                    },
                  ]}
                >
                  MAKE OR MODEL
                </Text>

                <View
                  style={[
                    styles.inputLine,
                    {
                      borderBottomColor:
                        theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="car-outline"
                    size={19}
                    color={
                      theme.textMuted
                    }
                  />

                  <TextInput
                    value={
                      draftFilters.makeModel
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateDraft(
                        "makeModel",
                        value,
                      )
                    }
                    placeholder="e.g. BMW"
                    placeholderTextColor={
                      theme.textMuted
                    }
                    returnKeyType="search"
                    onSubmitEditing={
                      applySearch
                    }
                    style={[
                      styles.input,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      color:
                        theme.textMuted,
                    },
                  ]}
                >
                  LOCATION
                </Text>

                <View
                  style={[
                    styles.inputLine,
                    {
                      borderBottomColor:
                        theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={19}
                    color={
                      theme.textMuted
                    }
                  />

                  <TextInput
                    value={
                      draftFilters.location
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateDraft(
                        "location",
                        value,
                      )
                    }
                    placeholder="Postcode or city"
                    placeholderTextColor={
                      theme.textMuted
                    }
                    returnKeyType="search"
                    onSubmitEditing={
                      applySearch
                    }
                    style={[
                      styles.input,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.priceField}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      {
                        color:
                          theme.textMuted,
                      },
                    ]}
                  >
                    MIN PRICE
                  </Text>

                  <View
                    style={[
                      styles.inputLine,
                      {
                        borderBottomColor:
                          theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currency,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      £
                    </Text>

                    <TextInput
                      value={
                        draftFilters.minPrice
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateDraft(
                          "minPrice",
                          value,
                        )
                      }
                      placeholder="No min"
                      placeholderTextColor={
                        theme.textMuted
                      }
                      keyboardType="numeric"
                      style={[
                        styles.input,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.priceField}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      {
                        color:
                          theme.textMuted,
                      },
                    ]}
                  >
                    MAX PRICE
                  </Text>

                  <View
                    style={[
                      styles.inputLine,
                      {
                        borderBottomColor:
                          theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currency,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      £
                    </Text>

                    <TextInput
                      value={
                        draftFilters.maxPrice
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateDraft(
                          "maxPrice",
                          value,
                        )
                      }
                      placeholder="No max"
                      placeholderTextColor={
                        theme.textMuted
                      }
                      keyboardType="numeric"
                      style={[
                        styles.input,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setShowAdvanced(
                    (value) =>
                      !value,
                  )
                }
                style={({ pressed }) => [
                  styles.advancedToggle,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <View style={styles.advancedLeft}>
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={
                      theme.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.advancedText,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    {showAdvanced
                      ? "Hide Advanced Filters"
                      : "Show Advanced Filters"}
                  </Text>
                </View>

                <Ionicons
                  name={
                    showAdvanced
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={18}
                  color={
                    theme.textMuted
                  }
                />
              </Pressable>

              {showAdvanced ? (
                <View style={styles.advancedFields}>
                  <InlineSelect
                    label="FUEL TYPE"
                    valueLabel={
                      draftFilters.fuelType
                        ? titleCase(
                            draftFilters.fuelType,
                          )
                        : "Any Fuel Type"
                    }
                    expanded={
                      openSelect ===
                      "fuel"
                    }
                    options={
                      fuelOptions
                    }
                    onToggle={() =>
                      setOpenSelect(
                        (current) =>
                          current ===
                          "fuel"
                            ? null
                            : "fuel",
                      )
                    }
                    onSelect={(
                      value,
                    ) => {
                      updateDraft(
                        "fuelType",
                        value,
                      );
                      setOpenSelect(
                        null,
                      );
                    }}
                  />

                  <InlineSelect
                    label="TRANSMISSION"
                    valueLabel={
                      draftFilters.transmission
                        ? titleCase(
                            draftFilters.transmission,
                          )
                        : "Any Transmission"
                    }
                    expanded={
                      openSelect ===
                      "transmission"
                    }
                    options={
                      transmissionOptions
                    }
                    onToggle={() =>
                      setOpenSelect(
                        (current) =>
                          current ===
                          "transmission"
                            ? null
                            : "transmission",
                      )
                    }
                    onSelect={(
                      value,
                    ) => {
                      updateDraft(
                        "transmission",
                        value,
                      );
                      setOpenSelect(
                        null,
                      );
                    }}
                  />

                  <View style={styles.field}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      MAX MILEAGE
                    </Text>

                    <View
                      style={[
                        styles.inputLine,
                        {
                          borderBottomColor:
                            theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="speedometer-outline"
                        size={19}
                        color={
                          theme.textMuted
                        }
                      />

                      <TextInput
                        value={
                          draftFilters.maxMileage
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateDraft(
                            "maxMileage",
                            value,
                          )
                        }
                        placeholder="No max mileage"
                        placeholderTextColor={
                          theme.textMuted
                        }
                        keyboardType="numeric"
                        style={[
                          styles.input,
                          {
                            color:
                              theme.text,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <InlineSelect
                    label="SORT BY"
                    valueLabel={
                      sortLabel(
                        draftFilters.sortBy,
                      )
                    }
                    expanded={
                      openSelect ===
                      "sort"
                    }
                    options={
                      sortOptions
                    }
                    onToggle={() =>
                      setOpenSelect(
                        (current) =>
                          current ===
                          "sort"
                            ? null
                            : "sort",
                      )
                    }
                    onSelect={(
                      value,
                    ) => {
                      updateDraft(
                        "sortBy",
                        value as SortOption,
                      );
                      setOpenSelect(
                        null,
                      );
                    }}
                  />
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={
                  applySearch
                }
                style={({ pressed }) => [
                  styles.searchButton,
                  {
                    backgroundColor:
                      theme.primary,
                  },
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.searchButtonText}>
                  Search
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.sectionDivider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <View style={styles.resultsHeader}>
              <Text
                style={[
                  styles.resultCount,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                {results.length}{" "}
                {results.length === 1
                  ? "car"
                  : "cars"}{" "}
                found
              </Text>

              {hasFilters ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={
                    clearSearch
                  }
                  hitSlop={8}
                  style={({ pressed }) => [
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.clearText,
                      {
                        color:
                          theme.primary,
                      },
                    ]}
                  >
                    Clear filters
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {query.isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator
                  color={
                    theme.primary
                  }
                />

                <Text
                  style={[
                    styles.loadingText,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  Loading cars…
                </Text>
              </View>
            ) : null}

            {query.isError ? (
              <View style={styles.errorState}>
                <Text
                  style={[
                    styles.errorTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Couldn&apos;t load cars
                </Text>

                <Text
                  style={[
                    styles.errorText,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  {query.error instanceof Error
                    ? query.error.message
                    : "Check your connection and pull down to try again."}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => (
          <View
            style={
              styles.separator
            }
          />
        )}
        renderItem={({ item }) => (
          <MarketplaceCarCard
            car={item}
            onPress={() =>
              router.push({
                pathname:
                  "/(customer)/car/[carId]",
                params: {
                  carId:
                    item.id,
                },
              })
            }
          />
        )}
        ListEmptyComponent={
          !query.isLoading &&
          !query.isError ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={28}
                color={
                  theme.textMuted
                }
              />

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                No cars match your search
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                Try changing or clearing the filters.
              </Text>
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      paddingHorizontal: 0,
    },

    content: {
      flexGrow: 1,
      paddingHorizontal:
        spacing.xl,
      paddingBottom:
        spacing.xxxl,
    },

    header: {
      paddingTop:
        spacing.xxl,
    },

    hero: {
      gap: spacing.md,
    },

    eyebrow: {
      fontSize:
        fontSize.xs,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1.5,
    },

    title: {
      maxWidth: 560,
      fontSize: 32,
      lineHeight: 38,
      fontWeight:
        fontWeight.bold,
      letterSpacing: -0.9,
    },

    subtitle: {
      maxWidth: 560,
      fontSize:
        fontSize.md,
      lineHeight: 24,
    },

    sectionDivider: {
      height:
        StyleSheet.hairlineWidth,
      marginVertical:
        spacing.xxl,
    },

    searchSection: {
      gap: spacing.xl,
    },

    field: {
      gap: 6,
    },

    fieldLabel: {
      fontSize: 11,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 0.8,
    },

    inputLine: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderBottomWidth: 1,
    },

    input: {
      flex: 1,
      paddingVertical: 10,
      fontSize:
        fontSize.md,
    },

    priceRow: {
      flexDirection: "row",
      gap: spacing.xl,
    },

    priceField: {
      flex: 1,
      gap: 6,
    },

    currency: {
      fontSize:
        fontSize.md,
      fontWeight:
        fontWeight.semibold,
    },

    advancedToggle: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    advancedLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },

    advancedText: {
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.semibold,
    },

    advancedFields: {
      gap: spacing.xl,
    },

    selectWrap: {
      gap: spacing.sm,
    },

    selectRow: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: spacing.md,
      borderBottomWidth: 1,
    },

    selectCopy: {
      flex: 1,
      gap: 4,
    },

    selectLabel: {
      fontSize: 11,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 0.8,
    },

    selectValue: {
      fontSize:
        fontSize.md,
      fontWeight:
        fontWeight.semibold,
    },

    optionList: {
      borderBottomWidth: 1,
      paddingBottom:
        spacing.sm,
    },

    optionRow: {
      minHeight: 42,
      justifyContent:
        "center",
      paddingVertical:
        spacing.sm,
    },

    optionText: {
      fontSize:
        fontSize.sm,
    },

    searchButton: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      borderRadius:
        radius.md,
    },

    searchButtonText: {
      color: "#FFFFFF",
      fontSize:
        fontSize.md,
      fontWeight:
        fontWeight.bold,
    },

    resultsHeader: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: spacing.md,
      marginBottom:
        spacing.lg,
    },

    resultCount: {
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.semibold,
    },

    clearText: {
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.bold,
    },

    loading: {
      paddingVertical:
        spacing.xxl,
      alignItems: "center",
      justifyContent:
        "center",
      gap: spacing.md,
    },

    loadingText: {
      fontSize:
        fontSize.sm,
    },

    errorState: {
      paddingVertical:
        spacing.xxl,
      gap: spacing.sm,
    },

    errorTitle: {
      fontSize:
        fontSize.lg,
      fontWeight:
        fontWeight.bold,
    },

    errorText: {
      fontSize:
        fontSize.sm,
      lineHeight: 21,
    },

    separator: {
      height: spacing.lg,
    },

    emptyState: {
      minHeight: 220,
      alignItems: "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      paddingHorizontal:
        spacing.xl,
    },

    emptyTitle: {
      fontSize:
        fontSize.lg,
      fontWeight:
        fontWeight.bold,
      textAlign: "center",
    },

    emptyText: {
      fontSize:
        fontSize.sm,
      lineHeight: 21,
      textAlign: "center",
    },

    pressed: {
      opacity: 0.64,
    },
  });

