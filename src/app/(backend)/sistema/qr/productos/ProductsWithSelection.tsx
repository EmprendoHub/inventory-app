"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaQrcode,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaMagnifyingGlass,
  FaXmark,
} from "react-icons/fa6";
import { BiBarcode } from "react-icons/bi";

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  totalAvailableStock: number;
  mainImage?: string;
}

interface ProductsWithSelectionProps {
  products: Product[];
  totalCount: number;
  initialPage: number;
}

const PRODUCTS_PER_PAGE = 20;

export default function ProductsWithSelection({
  products,
  totalCount,
  initialPage,
}: ProductsWithSelectionProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter products based on search query (defined later but used here for pagination)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.sku && product.sku.toLowerCase().includes(query)) ||
        (product.barcode && product.barcode.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Handle page navigation
  const goToPage = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/sistema/qr/productos?${params.toString()}`);
  };

  // Handle product selection
  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Handle select all/none for current page
  const toggleAllCurrentPage = () => {
    const currentPageIds = paginatedProducts.map((p) => p.id);
    const allCurrentSelected = currentPageIds.every((id) =>
      selectedProducts.has(id)
    );

    const newSelected = new Set(selectedProducts);
    if (allCurrentSelected) {
      // Deselect all on current page
      currentPageIds.forEach((id) => newSelected.delete(id));
    } else {
      // Select all on current page
      currentPageIds.forEach((id) => newSelected.add(id));
    }
    setSelectedProducts(newSelected);
  };

  // Generate QR codes for selected products
  const generateQRCodes = () => {
    if (selectedProducts.size === 0) return;

    // Store selected product IDs in sessionStorage to pass to generator
    sessionStorage.setItem(
      "selectedProductIds",
      JSON.stringify(Array.from(selectedProducts))
    );
    router.push("/sistema/qr/generador");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Reset page when search changes
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const selectedCount = selectedProducts.size;
  const currentPageIds = paginatedProducts.map((p) => p.id);
  const allCurrentSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedProducts.has(id));

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaQrcode className="h-6 w-6" />
            Productos Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search input */}
          <div className="mb-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              <FaMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaXmark className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Button
              onClick={generateQRCodes}
              disabled={selectedCount === 0}
              className="flex items-center gap-2"
            >
              <FaQrcode />
              Generar QR/Códigos ({selectedCount} seleccionados)
            </Button>
            <Button
              onClick={() => {
                setSelectedProducts(new Set());
                sessionStorage.removeItem("selectedProductIds");
              }}
              disabled={selectedCount === 0}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <FaTrash />
              Limpiar Selección
            </Button>
            <Link href="/sistema/qr/generador">
              <Button variant="outline" className="flex items-center gap-2">
                <BiBarcode />
                Generar con Todos los Productos
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
            <p>
              Mostrando {paginatedProducts.length} de {filteredProducts.length}{" "}
              productos{searchQuery && ` (filtrados de ${totalCount} total)`}
            </p>
            <p className="font-medium">
              {selectedCount > 0 ? (
                <span className="text-blue-600">
                  {selectedCount} productos seleccionados
                </span>
              ) : (
                "Ningún producto seleccionado"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full">
              <thead className="bg-card border-b">
                <tr>
                  <th className="text-left p-4 w-12">
                    <Checkbox
                      checked={allCurrentSelected}
                      onCheckedChange={toggleAllCurrentPage}
                      className="mx-auto"
                    />
                  </th>
                  <th className="text-left p-4 w-20">Imagen</th>
                  <th className="text-left p-4 min-w-[200px]">Producto</th>
                  <th className="text-left p-4">SKU</th>
                  <th className="text-left p-4">Código</th>
                  <th className="text-right p-4">Stock</th>
                  <th className="text-right p-4">Precio</th>
                  <th className="text-left p-4 w-20">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b hover:bg-gray-50 ${
                      selectedProducts.has(product.id) ? "bg-blue-50" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-4">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                    </td>

                    {/* Product Image */}
                    <td className="p-4">
                      <div className="w-12 h-12 relative bg-gray-100 rounded-lg overflow-hidden">
                        {product.mainImage ? (
                          <Image
                            src={product.mainImage}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <BiBarcode size={20} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="p-4">
                      <div className="font-medium text-sm text-gray-900 line-clamp-2">
                        {product.name}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="p-4">
                      <span className="text-sm text-gray-600 font-mono">
                        {product.sku || "-"}
                      </span>
                    </td>

                    {/* Barcode */}
                    <td className="p-4">
                      <span className="text-sm text-gray-600 font-mono">
                        {product.barcode || "-"}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {product.totalAvailableStock}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-4 text-right">
                      <span className="font-semibold text-green-600 text-sm">
                        {formatCurrency({
                          amount: product.price,
                          currency: "MXN",
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <Link href={`/sistema/negocio/articulos/${product.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <FaEye size={12} />
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {paginatedProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BiBarcode className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600">No hay productos en esta página</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages} ({totalCount} productos
                total)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <FaChevronLeft size={12} />
                  Anterior
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Siguiente
                  <FaChevronRight size={12} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
