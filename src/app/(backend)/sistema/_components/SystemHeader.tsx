import {
  Bell,
  LogOut,
  Moon,
  PlusCircleIcon,
  // Settings,
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
import { BiMoneyWithdraw } from "react-icons/bi";
// import { getMexicoGlobalUtcDate } from "@/lib/utils";
// import ClockTime from "@/components/ClockComponent";

interface BranchNotification {
  id: string;
  notificationNo: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  urgency: boolean;
  requestedQty: number;
  itemId: string;
  deliveryMethod: string;
  customerInfo?: {
    id: string;
    name: string;
    phone: string;
  };
  createdAt: string;
  fromWarehouse: { id: string; title: string };
  toWarehouse: { id: string; title: string };
}

const SystemHeader = ({ hidden }: { hidden: boolean }) => {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<BranchNotification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<BranchNotification | null>(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // setCurrentDate(getMexicoGlobalUtcDate());
  }, []);

  // Fetch notifications for current warehouse
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Get warehouse ID from user session
        const userWarehouseId = (session?.user as any)?.warehouseId;

        // Only proceed if user has a warehouse assigned
        if (!userWarehouseId) {
          setNotifications([]);
          setNotificationCount(0);
          return;
        }

        // Validate that we have a proper MongoDB ObjectId (24 characters, hexadecimal)
        if (
          !userWarehouseId ||
          userWarehouseId.length !== 24 ||
          !/^[0-9a-fA-F]{24}$/.test(userWarehouseId)
        ) {
          setNotifications([]);
          setNotificationCount(0);
          return;
        }

        // Fetch notifications specifically for this user's warehouse (receiving warehouse)

        const response = await fetch(
          `/api/notifications?toWarehouseId=${userWarehouseId}&status=PENDING,ACKNOWLEDGED`
        );

        if (response.ok) {
          const data = await response.json();

          setNotifications(data.data || []);
          setNotificationCount(data.data?.length || 0);
        } else {
          const errorText = await response.text();
          console.error(
            "❌ Failed to fetch notifications:",
            response.status,
            errorText
          );

          setNotifications([]);
          setNotificationCount(0);
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

  const handleNotificationClick = (notification: BranchNotification) => {
    setSelectedNotification(notification);
    setShowNotificationPopup(true);
    setShowNotifications(false); // Close the dropdown
  };

  const handleAcceptNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Remove the notification from the list
        setNotifications((prev) => {
          const filtered = prev.filter((n) => n.id !== notificationId);

          return filtered;
        });
        setNotificationCount((prev) => Math.max(0, prev - 1));
        setShowNotificationPopup(false);
        setSelectedNotification(null);
      } else {
        const errorData = await response.text();
        console.error(
          "❌ Failed to accept notification:",
          response.status,
          errorData
        );
        alert("Error al aceptar la notificación: " + response.status);
      }
    } catch (error) {
      console.error("💥 Error accepting notification:", error);
      alert("Error al aceptar la notificación");
    }
  };

  return (
    <div className="fixed w-full bg-primary h-12 flex items-center justify-between pl-4 pr-16 maxmd:px-4  z-30">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Link
            href={"/sistema/pos/register"}
            className="bg-muted text-white hover:text-accent p-1 rounded-lg mr-4"
          >
            <PlusCircleIcon size={20} />
          </Link>
           <Link
            href={"/sistema/contabilidad/gastos/nuevo"}
            className="bg-muted text-white hover:text-accent p-1 rounded-lg"
          >
            <BiMoneyWithdraw size={20} />
          </Link>
          {/* <div className="flex items-center font-mono justify-center">
            {isMounted && currentDate ? (
              <>
                {currentDate.toLocaleDateString()} - <ClockTime />
              </>
            ) : (
              <span>--</span>
            )}
          </div> */}
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
                      className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.urgency
                              ? "bg-red-500"
                              : notification.priority === "ALTA"
                              ? "bg-orange-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            De: {notification.fromWarehouse.title}
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            Cantidad: {notification.requestedQty} unidades
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
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
              {/* <div className="flex items-center w-full text-sm gap gap-2">
                <Settings size={18} />
                <span>Configuración</span>
              </div> */}

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

      {/* Notification Detail Popup */}
      <AnimatePresence>
        {showNotificationPopup && selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
            onClick={() => setShowNotificationPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Solicitud de Stock</h2>
                <button
                  onClick={() => setShowNotificationPopup(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Título:</p>
                  <p className="text-sm">{selectedNotification.title}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Mensaje:</p>
                  <p className="text-sm">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">De:</p>
                    <p className="text-sm">
                      {selectedNotification.fromWarehouse.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Para:</p>
                    <p className="text-sm">
                      {selectedNotification.toWarehouse.title}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Cantidad:
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      {selectedNotification.requestedQty} unidades
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Método:</p>
                    <p className="text-sm">
                      {selectedNotification.deliveryMethod === "CUSTOMER_PICKUP"
                        ? "Cliente Recoge"
                        : selectedNotification.deliveryMethod === "DELIVERY"
                        ? "Entrega"
                        : selectedNotification.deliveryMethod ===
                          "DIRECT_DELIVERY"
                        ? "Entrega Directa"
                        : selectedNotification.deliveryMethod}
                    </p>
                  </div>
                </div>

                {selectedNotification.customerInfo && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Cliente:
                    </p>
                    <p className="text-sm">
                      {selectedNotification.customerInfo.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedNotification.customerInfo.phone}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Prioridad:
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedNotification.urgency
                          ? "bg-red-500"
                          : selectedNotification.priority === "ALTA"
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="text-sm">
                      {selectedNotification.urgency
                        ? "Urgente"
                        : selectedNotification.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha:</p>
                  <p className="text-sm">
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNotificationPopup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleAcceptNotification(selectedNotification.id);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Aceptar Solicitud
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemHeader;
