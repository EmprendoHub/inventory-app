import {
  Bell,
  LogOut,
  Moon,
  PlusCircleIcon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";

const SystemHeader = () => {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="fixed w-full bg-primary h-10 flex items-center justify-between pl-4 pr-16 maxsm:px-4  z-30">
      <TooltipProvider>
        <div className="flex items-center justify-between w-full">
          {/* <!-- Notification --> */}
          <div className="w-full flex">
            <Tooltip>
              <TooltipTrigger>
                <Link
                  href={"/sistema/ventas/pedidos/nuevo"}
                  className="bg-muted text-white hover:text-accent p-1 rounded-lg"
                >
                  <PlusCircleIcon size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notificaciones</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/*  User Info  */}
          <div className="w-full flex justify-end">
            <Tooltip>
              <TooltipTrigger>
                <div
                  ref={buttonRef}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={toggleMenu}
                >
                  <Image
                    src={
                      session?.user?.image || "/images/avatar_placeholder.jpg"
                    }
                    width={30}
                    height={30}
                    className="rounded-full"
                    alt="avatar"
                  />
                  <span className="text-xs">{session?.user?.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cuenta</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* Overlay Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 right-0 bg-background shadow-lg rounded-lg p-6 z-[9999]"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Image
                  src={session?.user?.image || "/images/avatar_placeholder.jpg"}
                  width={40}
                  height={40}
                  className="rounded-full"
                  alt="avatar"
                />

                <div>
                  <p className="font-semibold">{session?.user?.name}</p>
                  <p className="text-sm text-gray-500">
                    {session?.user?.email}
                  </p>
                </div>
                <div onClick={toggleMenu} className=" cursor-pointer">
                  <X />
                </div>
              </div>
              <hr className="rounded" />
              {/*  Theme  */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="flex items-center w-full text-sm gap gap-2"
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                {theme === "light" ? (
                  <span>Tema oscuro</span>
                ) : (
                  <span>Tema claro</span>
                )}
              </button>
              {/*  Config  */}
              <div className="flex items-center w-full text-sm gap gap-2">
                <Settings size={18} />
                <span>Configuración</span>
              </div>
              {/*  Config  */}
              <div className="flex items-center w-full text-sm gap gap-2">
                <Bell size={18} />
                <span>Notificaciones</span>
              </div>
              <hr className="rounded" />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-red-500 hover:text-red-700"
              >
                <LogOut size={16} />
                <span className="text-xs">Cerrar sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemHeader;
