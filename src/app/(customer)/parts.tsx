import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useCustomerParts, usePartCategories } from "@/features/customer/use-parts";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { PartItem } from "@/services/customer/parts.service";

function formatPrice(value: number) {
  return "£" + value.toFixed(2);
}

export default function CustomerPartsScreen() {
  const theme = useAppTheme();
  const query = useCustomerParts();
  const categoriesQuery = usePartCategories();

  const [selectedCategory, setSelectedCategory] = useState<string>("All Parts");
  const [search, setSearch] = useState<string>("");

  const allParts = query.data ?? [];
  const categories = categoriesQuery.data ?? ["All Parts"];

  const filteredParts = useMemo(() => {
    return allParts.filter((part) => {
      const matchCat =
        selectedCategory === "All Parts" ||
        part.category.toLowerCase() === selectedCategory.toLowerCase();

      const needle = search.trim().toLowerCase();
      const matchSearch =
        !needle ||
        part.name.toLowerCase().includes(needle) ||
        part.brand.toLowerCase().includes(needle) ||
        part.category.toLowerCase().includes(needle);

      return matchCat && matchSearch;
    });
  }, [allParts, selectedCategory, search]);

  const clearFilters = () => {
    setSelectedCategory("All Parts");
    setSearch("");
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Parts" showBack />

      <FlatList
        data={filteredParts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching || categoriesQuery.isRefetching}
            onRefresh={() => {
              void query.refetch();
              void categoriesQuery.refetch();
            }}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.fitmentBanner,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.fitmentCopy}>
                <View style={styles.fitmentHeader}>
                  <View
                    style={[
                      styles.alertIconBg,
                      { backgroundColor: theme.dangerSoft },
                    ]}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={theme.danger}
                    />
                  </View>

                  <Text style={[styles.fitmentTitle, { color: theme.text }]}>
                    Ensure part fitment
                  </Text>
                </View>

                <Text
                  style={[
                    styles.fitmentSubtitle,
                    { color: theme.textSecondary },
                  ]}
                >
                  Select a vehicle from your garage to only see compatible
                  parts.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(customer)/(tabs)/garage")}
                style={({ pressed }) => [
                  styles.garageButton,
                  { backgroundColor: theme.nav },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.garageButtonText, { color: theme.navText }]}>
                  Go to My Garage
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={theme.textMuted}
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search parts, brands..."
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {search ? (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              ) : null}
            </View>

            <Text style={[styles.categoriesLabel, { color: theme.textMuted }]}>
              CATEGORIES
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((cat) => {
                const active = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <Pressable
                    key={cat}
                    accessibilityRole="button"
                    onPress={() => setSelectedCategory(cat)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      {
                        backgroundColor: active
                          ? theme.action
                          : theme.surface,
                        borderColor: active ? theme.action : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: active ? theme.actionText : theme.textSecondary,
                          fontWeight: active
                            ? fontWeight.bold
                            : fontWeight.medium,
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {query.isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Loading parts…
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <PartCard part={item} onPress={() => {}} />
        )}
        ListEmptyComponent={
          !query.isLoading ? (
            <View style={styles.emptyBox}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={32}
                  color={theme.textMuted}
                />
              </View>

              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No parts found
              </Text>

              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                We couldn't find any active parts matching your current
                selection. If you have a vehicle selected, try clearing it or
                selecting a different category.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={clearFilters}
                style={({ pressed }) => [
                  styles.clearButton,
                  { backgroundColor: theme.nav },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.clearButtonText, { color: theme.navText }]}>
                  Clear filters
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

function PartCard({ part, onPress }: { part: PartItem; onPress: () => void }) {
  const theme = useAppTheme();
  const [imageErr, setImageErr] = useState(false);

  const imageUri = !imageErr && part.imageUrl ? part.imageUrl : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.partCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.imageContainer,
          { backgroundColor: theme.surfaceSecondary },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onError={() => setImageErr(true)}
            style={styles.partImage}
          />
        ) : (
          <Ionicons name="cog-outline" size={48} color={theme.textMuted} />
        )}

        {part.inStock ? (
          <View
            style={[
              styles.stockBadge,
              { backgroundColor: theme.successSoft },
            ]}
          >
            <Text style={[styles.stockText, { color: theme.success }]}>
              In Stock
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.partInfo}>
        <Text style={[styles.partBrand, { color: theme.textMuted }]}>
          {part.brand.toUpperCase()}
        </Text>

        <Text
          numberOfLines={2}
          style={[styles.partName, { color: theme.text }]}
        >
          {part.name}
        </Text>

        <Text style={[styles.partPrice, { color: theme.text }]}>
          {formatPrice(part.price)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.xxl,
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  fitmentBanner: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  fitmentCopy: {
    gap: spacing.xs,
  },
  fitmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  alertIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  fitmentTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  fitmentSubtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  garageButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignSelf: "flex-start",
  },
  garageButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: 8,
  },
  categoriesLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginBottom: -spacing.sm,
  },
  categoriesScroll: {
    gap: spacing.sm,
  },
  categoryChip: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  partCard: {
    width: "48.5%",
    borderWidth: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  partImage: {
    width: "100%",
    height: "100%",
  },
  stockBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  stockText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  partInfo: {
    padding: spacing.md,
    gap: 4,
  },
  partBrand: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  partName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: 19,
  },
  partPrice: {
    marginTop: 4,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  loadingBox: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  emptyBox: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 340,
  },
  clearButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  clearButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.7,
  },
});
