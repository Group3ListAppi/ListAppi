import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import { ListButton } from '../components/ListButton';
import { RecipeButton } from '../components/RecipeButton';
import { AdBanner } from '../components/AdBanner';
import { useAuth } from '../auth/useAuth';
import { getUserShoplists, type Shoplist } from '../firebase/shoplistUtils';
import { getUserRecipes, type Recipe } from '../firebase/recipeUtils';
import { getUserMenuLists, type MenuList } from '../firebase/menuUtils';
import { getUserProfiles } from '../firebase/userProfileUtils';

interface HomeScreenProps {
  activeScreen: string;
  onNavigate: (screen: string, data?: any) => void;
  isPremium?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ activeScreen, onNavigate, isPremium }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shoplists, setShoplists] = useState<Shoplist[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menus, setMenus] = useState<MenuList[]>([]);

  useEffect(() => {
    if (user?.uid && activeScreen === 'home') {
      loadData();
    }
  }, [user?.uid, activeScreen]);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);

      const lists = await getUserShoplists(user.uid);
      const sortedLists = lists.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestShoplists = sortedLists.slice(0, 6);

      const allRecipes = await getUserRecipes(user.uid);
      const sortedRecipes = allRecipes.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const newestRecipes = sortedRecipes.slice(0, 6);

      const allMenus = await getUserMenuLists(user.uid);
      const sortedMenus = allMenus.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestMenus = sortedMenus.slice(0, 6);

      const allIds = [
        ...new Set([
          ...latestShoplists.map((l) => l.userId),
          ...newestRecipes.map((r) => r.userId),
          ...latestMenus.map((m) => m.userId),
        ]),
      ];
      const profiles = await getUserProfiles(allIds);

      const enrichedShoplists = latestShoplists.map((list) => ({
        ...list,
        ownerName: profiles.get(list.userId)?.displayName,
        ownerAvatar: profiles.get(list.userId)?.photoURL,
      }));

      const enrichedRecipes = newestRecipes.map((recipe) => ({
        ...recipe,
        ownerName: profiles.get(recipe.userId)?.displayName,
        ownerAvatar: profiles.get(recipe.userId)?.photoURL,
      }));

      const enrichedMenus = latestMenus.map((menu) => ({
        ...menu,
        ownerName: profiles.get(menu.userId)?.displayName,
        ownerAvatar: profiles.get(menu.userId)?.photoURL,
      }));

      setShoplists(enrichedShoplists);
      setRecipes(enrichedRecipes);
      setMenus(enrichedMenus);
    } catch (error) {
      console.error('Error loading home screen data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout activeScreen={activeScreen} onNavigate={onNavigate}>
      <AdBanner onPress={() => onNavigate('premium')} isPremium={isPremium} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Image
              source={require('../assets/PikkuKokki2.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text variant="headlineMedium" style={styles.title}>
              Tervetuloa ListAppiin!
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              variant="titleLarge"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Viimeaikaiset ostoslistat
            </Text>
            {shoplists.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {shoplists.map((list) => (
                  <View key={list.id} style={styles.itemContainer}>
                    <ListButton
                      listName={list.name}
                      createdAt={list.createdAt}
                      ownerAvatar={list.ownerAvatar}
                      ownerInitials={list.ownerName?.charAt(0).toUpperCase() || '?'}
                      ownerName={list.ownerName}
                      isOwnedByUser={list.userId === user?.uid}
                      onPress={() => onNavigate('shoplist-detail', list)}
                      disableSwipe={true}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                Et ole vielä lisännyt ostoslistoja
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text
              variant="titleLarge"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Viimeaikaiset ruokalistat
            </Text>
            {menus.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {menus.map((menu) => (
                  <View key={menu.id} style={styles.itemContainer}>
                    <ListButton
                      listName={menu.name}
                      createdAt={menu.createdAt}
                      ownerAvatar={menu.ownerAvatar}
                      ownerInitials={menu.ownerName?.charAt(0).toUpperCase() || '?'}
                      ownerName={menu.ownerName}
                      isOwnedByUser={menu.userId === user?.uid}
                      onPress={() => onNavigate('menu-detail', menu)}
                      disableSwipe={true}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                Et ole vielä lisännyt ruokalistoja
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text
              variant="titleLarge"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Uusimmat reseptit
            </Text>
            {recipes.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {recipes.map((recipe) => (
                  <View key={recipe.id} style={styles.recipeItemContainer}>
                    <RecipeButton
                      title={recipe.title}
                      imageUrl={recipe.image}
                      onPress={() => onNavigate('recipe-detail', recipe)}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                Et ole vielä lisännyt reseptejä
              </Text>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerImage: {
    width: 250,
    height: 250,
    marginBottom: 5,
  },
  title: {
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  itemContainer: {
    marginRight: 12,
    width: 280,
  },
  recipeItemContainer: {
    marginRight: 16,
    width: 200,
  },
  emptyStateText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
