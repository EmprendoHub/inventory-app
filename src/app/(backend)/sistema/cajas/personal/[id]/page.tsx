import prisma from "@/lib/db";
import { CashTransactionList } from "../../_components/CashTransactionList";
import SingleCashAuditForm from "../../_components/SingleCashAudit";
import SingleCashDeposit from "../../_components/SingleCashDeposit";

export default async function CashRegisterDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const cashRegister = await prisma.cashRegister.findUnique({
    where: { userId: params.id },
    include: {
      transactions: {
        orderBy: {
          createdAt: "desc", // Latest product
        },
      },
      user: true,
    },
  });

  if (!cashRegister) {
    return <div>No se encontró expediente...</div>;
  }

  return (
    <div>
      <div className="p-4 flex maxmd:flex-col items-end justify-between w-full bg-card rounded-md">
        <div className="flex flex-col items-start w-fit gap-3  p-4 ">
          <div className="p-4 bg-blue-800 text-white rounded-md flex flex-col w-full">
            <p>Balance:</p>{" "}
            <span className="text-4xl">
              ${cashRegister.balance.toLocaleString()}
            </span>
            <SingleCashDeposit cashRegister={cashRegister} />
          </div>
        </div>
        <div>
          <SingleCashAuditForm cashRegister={cashRegister} />
        </div>
      </div>
      <CashTransactionList transactions={cashRegister.transactions} />
    </div>
  );
}
