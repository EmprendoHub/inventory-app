import LogoComponent from "@/components/LogoComponent";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col bg-gradient-to-br from-slate-600 to-slate-900 gap-0 items-center justify-center h-screen">
      <LogoComponent className="" />
      <p className="text-xs text-slate-400 italic">
        Sistema de Gestión de Inventario
      </p>
      <Link
        className="text-xs tracking-wider text-white uppercase bg-accent hover:bg-slate-900 px-6 py-2 rounded-md mt-10"
        href="/sistema/home"
      >
        Iniciar
      </Link>
    </div>
  );
}
