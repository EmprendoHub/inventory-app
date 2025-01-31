import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <h2 className="text-3xl">Sistema de Gestión de Inventario</h2>
      <Link href="/sistema/home/negocio">Ver Panel de Control</Link>
    </div>
  );
}
