import { getAllPOSProductNoFilter } from "@/app/_actions";
import QRGenerator from "../_components/QRGenerator";

const QRPage = async () => {
  const data = await getAllPOSProductNoFilter();
  // The updated function now returns actual data objects, not JSON strings
  const products = data.products;

  return <QRGenerator products={products} />;
};

export default QRPage;
