import prisma from "@/lib/db";
import { CashTransactionList } from "../../_components/CashTransactionList";

export default async function CashRegisterDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const cashRegister = await prisma.cashRegister.findUnique({
    where: { userId: params.id },
    include: { transactions: true },
  });

  if (!cashRegister) {
    return <div>No se encontró cartera</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{cashRegister.name}</h1>
      <p className="mb-4">Balance: ${cashRegister.balance}</p>
      <CashTransactionList transactions={cashRegister.transactions} />
    </div>
  );
}
