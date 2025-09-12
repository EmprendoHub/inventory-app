import { getAllPOSProductNoFilter } from "@/app/_actions";
import ProductsWithSelection from "./ProductsWithSelection";

const POSProductsPage = async ({ searchParams }: { searchParams: any }) => {
  const data = await getAllPOSProductNoFilter();
  const products = data.products.map((product: any) => ({
    ...product,
    barcode: product.barcode === null ? undefined : product.barcode,
  }));

  const page = parseInt(searchParams.page) || 1;

  return (
    <ProductsWithSelection
      products={products}
      totalCount={data.filteredProductsCount}
      initialPage={page}
    />
  );
};

export default POSProductsPage;
