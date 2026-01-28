  import React, { useState, useEffect } from "react";
  import { StyleSheet, View, ScrollView } from "react-native";
  import { Text, ActivityIndicator, useTheme } from "react-native-paper";
  import AppBar from "../components/AppBar";
  import { ListButton } from "../components/ListButton";
  import { useAuth } from "../auth/useAuth";
  import { getTrashItems, permanentlyDeleteTrashItem, restoreRecipeFromTrash } from "../firebase/recipeUtils";
  import { restoreShoplistFromTrash, permanentlyDeleteShoplist } from "../firebase/shoplistUtils";
  import { restoreMenuListFromTrash, permanentlyDeleteMenuList } from "../firebase/menuUtils";import { restoreRecipeCollectionFromTrash, permanentlyDeleteRecipeCollection } from "../firebase/recipeCollectionUtils";  import type { DeletedItem } from "../firebase/recipeUtils";
  import ScreenLayout from "../components/ScreenLayout";

  type Props = {
    activeScreen: string;
    onBack: () => void;
    onNavigate: (screen: string) => void;
  };

  const TRASH_RETENTION_DAYS = 30;

  export default function TrashScreen({ activeScreen, onBack, onNavigate }: Props) {
    const { user } = useAuth();
    const theme = useTheme();
    const [trashItems, setTrashItems] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (user?.uid) {
        loadTrashItems();
      }
    }, [user?.uid]);

    const loadTrashItems = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const items = await getTrashItems(user.uid);
        setTrashItems(items);
      } catch (error) {
        console.error("Error loading trash items:", error);
      } finally {
        setLoading(false);
      }
    };

    const getDaysUntilPermanentDelete = (deletedAt: Date) => {
      const now = new Date();
      const deletedDate = new Date(deletedAt);
      const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, TRASH_RETENTION_DAYS - diffDays);
    };

    const handleRestore = async (item: DeletedItem) => {
    try {
      const targetId = getTargetId(item)

      if (item.type === 'recipe') {
        await restoreRecipeFromTrash(targetId, item.data, item.collectionId)
        onNavigate('recipes')
      } else if (item.type === 'shoplist') {
        await restoreShoplistFromTrash(targetId, item.data)
        onNavigate('shoplist')
      } else if (item.type === 'menu') {
        await restoreMenuListFromTrash(targetId, item.data)
        onNavigate('menu')
      } else if (item.type === 'recipe-collection') {
        await restoreRecipeCollectionFromTrash(targetId, item.data)
        onNavigate('recipes')
      }

      setTrashItems(prev => prev.filter(x => x.id !== item.id))
    } catch (error) {
      console.error('Error restoring item:', error)
    }
  }

    const getTargetId = (item: DeletedItem): string => {
      if (item.type === 'recipe') return item.recipeId || item.data?.id
      if (item.type === 'shoplist') return item.shoplistId || item.data?.id
      if (item.type === 'menu') return item.menuListId || item.data?.id
      if (item.type === 'recipe-collection') return item.collectionId || item.data?.id
      return item.data?.id
    }
  /*  const handleRestore = async (trashId: string, recipeId: string, recipeData?: any) => {
      try {
        await restoreRecipeFromTrash(recipeId, recipeData);
        setTrashItems(trashItems.filter(item => item.id !== trashId));
        onNavigate('recipes');
      } catch (error) {
        console.error("Error restoring item:", error);
      }
    };
  */
    const handlePermanentlyDelete = async (item: DeletedItem) => {
      if (!user?.uid) return;
      
      try {
        const targetId = getTargetId(item);
        
        if (item.type === 'recipe') {
          await permanentlyDeleteTrashItem(item.id, targetId, user.uid);
        } else if (item.type === 'shoplist') {
          await permanentlyDeleteShoplist(item.id, targetId, user.uid);
        } else if (item.type === 'menu') {
          await permanentlyDeleteMenuList(item.id, targetId, user.uid);
        } else if (item.type === 'recipe-collection') {
          await permanentlyDeleteRecipeCollection(item.id, targetId, user.uid);
        }
        
        setTrashItems(trashItems.filter(i => i.id !== item.id));
      } catch (error) {
        console.error("Error permanently deleting item:", error);
      }
    };

    const getItemName = (item: DeletedItem): string => {
      if (item.type === 'recipe') return item.data?.title ?? '(Nimetön resepti)'
      if (item.type === 'shoplist') return item.data?.name ?? '(Nimetön ostoslista)'
      if (item.type === 'menu') return item.data?.name ?? '(Nimetön valikko)'
      if (item.type === 'recipe-collection') return item.data?.name ?? '(Nimetön kokoelma)'
      if (item.type === 'foodlist') return item.data?.name ?? item.data?.title ?? '(Nimetön)'
      return '(Nimetön)'
    }

    const getRestoreLabel = (item: DeletedItem) => {
      if (item.type === 'recipe') return 'Palauta resepti'
      if (item.type === 'shoplist') return 'Palauta ostoslista'
      if (item.type === 'menu') return 'Palauta valikko'
      if (item.type === 'recipe-collection') return 'Palauta kokoelma'
      if (item.type === 'foodlist') return 'Palauta ruokalista'
      return 'Palauta'
    }

    const recipeItems = trashItems.filter(item => item.type === "recipe");
    const shoplistItems = trashItems.filter(item => item.type === "shoplist");
    const menuItems = trashItems.filter(item => item.type === "menu");
    const collectionItems = trashItems.filter(item => item.type === "recipe-collection");
    const foodlistItems = trashItems.filter(item => item.type === "foodlist");

    const renderCategory = (title: string, items: DeletedItem[]) => {
      if (items.length === 0) return null;

      return (
        <View key={title} style={styles.categoryContainer}>
          <Text variant="titleMedium" style={[styles.categoryTitle, { color: '#FFFFFF' }]}>
            {title}
          </Text>
          {items.map((item) => (
            <View key={item.id}>
              <ListButton
                //listName={item.data.title}
                listName={getItemName(item)}
                imageUrl={item.data.image}
                ownerAvatar={user?.photoURL || undefined}
                ownerInitials={user?.displayName?.charAt(0).toUpperCase() || "U"}
                customActionIds={['restore', 'deletePermanent']}
                restoreLabel={getRestoreLabel(item)}
                onRestore={() => handleRestore(item)}
                //onRestore={() => handleRestore(item.id, item.recipeId || item.data.id, item.data)}
                onPermanentlyDelete={() => handlePermanentlyDelete(item)}
              />
              <Text style={[styles.retentionText, { color: theme.colors.outline }]}>
                Poistetaan pysyvästi {getDaysUntilPermanentDelete(item.deletedAt)} päivän kuluttua
              </Text>
            </View>
          ))}
        </View>
      );
    };

    return (
      <ScreenLayout 
        activeScreen={activeScreen} 
        onNavigate={onNavigate} 
        showNav={false}
        showBack={true}
        onBack={onBack}
        customTitle="Roskakori"
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" />
          </View>
        ) : trashItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="headlineMedium">Roskakori</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Roskakori on tyhjä
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.container}>
            {renderCategory("Reseptit", recipeItems)}
            {renderCategory("Kokoelmat", collectionItems)}
            {renderCategory("Ruokalistat", menuItems)}
            {renderCategory("Ostoslistat", shoplistItems)}
            {renderCategory("Ruokalistat", foodlistItems)}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </ScreenLayout>
    );
  }

  const styles = StyleSheet.create({
    root: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingTop: 16,
    },
    categoryContainer: {
      marginBottom: 24,
    },
    categoryTitle: {
      paddingHorizontal: 16,
      marginBottom: 12,
      fontWeight: "600",
    },
    retentionText: {
      textAlign: "center",
      fontSize: 12,
      marginTop: 8,
      marginHorizontal: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      marginTop: 8,
      textAlign: "center",
    },
  });
