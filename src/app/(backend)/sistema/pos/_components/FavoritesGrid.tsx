"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Plus,
  Settings,
  Trash2,
  Edit3,
  GripVertical,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FavoriteType } from "@/types/pos";
import { ItemType } from "@/types/items";
import Image from "next/image";

interface FavoritesGridProps {
  favorites: FavoriteType[];
  items: ItemType[];
  onAddToCart: (itemId: string) => void;
  onUpdateFavorites?: (favorites: FavoriteType[]) => void;
  isManageMode?: boolean;
  onToggleManageMode?: () => void;
}

export default function FavoritesGrid({
  favorites,
  items,
  onAddToCart,
  onUpdateFavorites,
  isManageMode = false,
  onToggleManageMode,
}: FavoritesGridProps) {
  const [editingFavorite, setEditingFavorite] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get item details for a favorite
  const getItemDetails = useCallback(
    (favorite: FavoriteType) => {
      return items.find((item) => item.id === favorite.itemId);
    },
    [items]
  );

  // Filter items for adding to favorites
  const availableItems = React.useMemo(() => {
    const favoriteItemIds = new Set(favorites.map((f) => f.itemId));
    return items
      .filter((item) => !favoriteItemIds.has(item.id))
      .filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [items, favorites, searchTerm]);

  // Handle adding item to favorites
  const handleAddFavorite = useCallback(
    (item: ItemType) => {
      if (!onUpdateFavorites) return;

      const newFavorite: FavoriteType = {
        id: `fav_${Date.now()}_${item.id}`,
        itemId: item.id,
        name: item.name,
        price: item.price,
        image: item.mainImage,
        position: favorites.length,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onUpdateFavorites([...favorites, newFavorite]);
      setShowAddModal(false);
      setSearchTerm("");
    },
    [favorites, onUpdateFavorites]
  );

  // Handle removing favorite
  const handleRemoveFavorite = useCallback(
    (favoriteId: string) => {
      if (!onUpdateFavorites) return;

      const updated = favorites.filter((f) => f.id !== favoriteId);
      // Reorder positions
      const reordered = updated.map((fav, index) => ({
        ...fav,
        position: index,
      }));

      onUpdateFavorites(reordered);
    },
    [favorites, onUpdateFavorites]
  );

  // Handle editing favorite name
  const handleEditName = useCallback(
    (favoriteId: string, name: string) => {
      if (!onUpdateFavorites) return;

      const updated = favorites.map((fav) =>
        fav.id === favoriteId ? { ...fav, name, updatedAt: new Date() } : fav
      );

      onUpdateFavorites(updated);
      setEditingFavorite(null);
      setNewName("");
    },
    [favorites, onUpdateFavorites]
  );

  // Start editing
  const startEditing = useCallback((favorite: FavoriteType) => {
    setEditingFavorite(favorite.id);
    setNewName(favorite.name);
  }, []);

  // Sort favorites by position
  const sortedFavorites = React.useMemo(() => {
    return [...favorites].sort((a, b) => a.position - b.position);
  }, [favorites]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Favorites</h3>
          <Badge variant="outline">{favorites.length} items</Badge>
        </div>

        {onToggleManageMode && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              disabled={isManageMode}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
            <Button
              variant={isManageMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleManageMode}
            >
              <Settings className="w-4 h-4 mr-1" />
              {isManageMode ? "Done" : "Manage"}
            </Button>
          </div>
        )}
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        <AnimatePresence>
          {sortedFavorites.map((favorite) => {
            const item = getItemDetails(favorite);
            if (!item) return null;

            return (
              <motion.div
                key={favorite.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={!isManageMode ? { scale: 0.95 } : undefined}
                className={`cursor-pointer relative ${
                  isManageMode ? "animate-pulse" : ""
                }`}
              >
                <Card
                  className={`h-full transition-all duration-200 ${
                    isManageMode
                      ? "border-dashed border-2 border-blue-300 bg-blue-50"
                      : "hover:shadow-md hover:scale-105"
                  }`}
                >
                  <CardContent className="p-3 text-center relative">
                    {/* Manage Mode Controls */}
                    {isManageMode && (
                      <>
                        <div className="absolute top-1 right-1 z-10">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveFavorite(favorite.id)}
                            className="p-1 h-6 w-6"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="absolute top-1 left-1 z-10">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(favorite)}
                            className="p-1 h-6 w-6"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="absolute bottom-1 right-1 z-10 opacity-50">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      </>
                    )}

                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                      {favorite.image ? (
                        <Image
                          src={favorite.image}
                          alt={favorite.name}
                          width={120}
                          height={120}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Star className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Product Name */}
                    {editingFavorite === favorite.id ? (
                      <div className="space-y-2">
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="text-xs"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleEditName(favorite.id, newName);
                            }
                          }}
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleEditName(favorite.id, newName)}
                            className="flex-1 p-1 h-6"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFavorite(null)}
                            className="flex-1 p-1 h-6"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                          {favorite.name}
                        </h3>
                        <p className="text-lg font-semibold text-blue-600">
                          ${favorite.price.toFixed(2)}
                        </p>

                        {/* Add to Cart Button */}
                        {!isManageMode && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(favorite.itemId);
                            }}
                            size="sm"
                            className="w-full mt-2"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {favorites.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No favorite items yet</p>
            <p className="text-sm">
              Add frequently sold products for quick access
            </p>
            {onUpdateFavorites && (
              <Button
                variant="outline"
                onClick={() => setShowAddModal(true)}
                className="mt-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Favorite
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Favorite Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add to Favorites</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchTerm("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Available Items */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-background cursor-pointer"
                    onClick={() => handleAddFavorite(item)}
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.mainImage ? (
                        <Image
                          src={item.mainImage}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Star className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.price.toFixed(2)}</p>
                      <Button size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {availableItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No items available to add</p>
                    {searchTerm && (
                      <p className="text-sm">Try adjusting your search</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
