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
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import ClockTime from "@/components/ClockComponent";

interface BranchNotification {
  id: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  urgency: boolean;
  createdAt: string;
  fromWarehouse: { title: string };
  toWarehouse: { title: string };
}

const SystemHeader = ({ hidden }: { hidden: boolean }) => {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<BranchNotification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setCurrentDate(getMexicoGlobalUtcDate());
  }, []);

  // Fetch notifications for current warehouse
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Get warehouse ID from user session
        const userWarehouseId = (session?.user as any)?.warehouseId;

        let warehouseId: string;

        if (!userWarehouseId) {
          console.log(
            "User has no assigned warehouse, using fallback warehouse selection"
          );

          // Fallback: Get warehouses from API and use first active one
          const warehousesResponse = await fetch("/api/warehouses");
          if (!warehousesResponse.ok) {
            console.log("No warehouses found, skipping notification fetch");
            return;
          }

          const warehousesData = await warehousesResponse.json();
          const warehouses = warehousesData.data || [];

          if (warehouses.length === 0) {
            console.log("No warehouses available, skipping notification fetch");
            return;
          }

          // Use the first active warehouse as fallback
          const activeWarehouse =
            warehouses.find((w: any) => w.status === "ACTIVE") || warehouses[0];
          warehouseId = activeWarehouse.id;
        } else {
          warehouseId = userWarehouseId;
        }

        // Validate that we have a proper MongoDB ObjectId (24 characters, hexadecimal)
        if (
          !warehouseId ||
          warehouseId.length !== 24 ||
          !/^[0-9a-fA-F]{24}$/.test(warehouseId)
        ) {
          console.log(
            "Invalid warehouse ID format, skipping notification fetch"
          );
          return;
        }

        const response = await fetch(
          `/api/notifications?warehouseId=${warehouseId}&type=incoming&status=PENDING,ACKNOWLEDGED`
        );

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.data || []);
          setNotificationCount(data.data?.length || 0);
        } else {
          console.log("Failed to fetch notifications, response not ok");
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Reset notifications on error to prevent infinite error loops
        setNotifications([]);
        setNotificationCount(0);
      }
    };

    if (isMounted && session?.user) {
      fetchNotifications();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isMounted, session]);

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
    <div className="fixed w-full bg-primary h-12 flex items-center justify-between pl-4 pr-16 maxmd:px-4  z-30">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Link
            href={"/sistema/pos/register"}
            className="bg-muted text-white hover:text-accent p-1 rounded-lg"
          >
            <PlusCircleIcon size={20} />
          </Link>
          <div className="flex items-center font-mono justify-center">
            {isMounted && currentDate ? (
              <>
                {currentDate.toLocaleDateString()} - <ClockTime />
              </>
            ) : (
              <span>--</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications Bell */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div
                  className="relative cursor-pointer p-2 hover:bg-muted/20 rounded-lg transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5 text-white" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Notificaciones{" "}
                  {notificationCount > 0 && `(${notificationCount})`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/*  User Info  */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div
                  ref={buttonRef}
                  className={`flex items-center gap-2 cursor-pointer  ${
                    hidden ? "mr-0" : "mr-36 maxmd:mr-0"
                  }`}
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
          </TooltipProvider>
        </div>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            ref={notificationRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 right-4 bg-background shadow-lg rounded-lg border w-80 max-h-96 overflow-hidden z-[9999]"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notificaciones</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.urgency
                              ? "bg-red-500"
                              : notification.priority === "HIGH"
                              ? "bg-orange-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            De: {notification.fromWarehouse.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className={`flex flex-col gap-3`}>
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
