import {
  Bell,
  ChevronDown,
  History,
  LayoutGrid,
  Plus,
  Settings,
  User2,
} from "lucide-react";
import React from "react";
import { SearchInput } from "./SearchInput";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

const SystemHeader = () => {
  return (
    <div className="bg-slate-200 h-10 flex items-center justify-between px-4">
      <div className="flex gap-3 items-center">
        <div>
          <History className="w-5 h-5" />
        </div>
        <SearchInput />
      </div>
      <div className="flex gap-2 items-center">
        <TooltipProvider>
          {/* <!-- Plus Icon --> */}
          <div className="flex">
            <Tooltip>
              <TooltipTrigger>
                <div className=" text-white bg-blue-700 hover:bg-blue-800 p-1 rounded-lg mr-3">
                  <Plus size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nuevo</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/* <!-- User --> */}
          <div className="flex">
            <Tooltip>
              <TooltipTrigger>
                <div className="  bg-gray-200 hover:text-blue-800 p-1 rounded-lg">
                  <User2 size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Usuario</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/* <!-- Notification --> */}
          <div className="flex">
            <Tooltip>
              <TooltipTrigger>
                <div className="  bg-gray-200 hover:text-blue-800 p-1 rounded-lg">
                  <Bell size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notificaciones</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/*  Config  */}
          <div className="flex">
            <Tooltip>
              <TooltipTrigger>
                <div className=" bg-gray-200 hover:text-blue-800 p-1 rounded-lg">
                  <Settings size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Config</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/*  User Info   */}
          <div className="flex gap-6">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center bg-gray-200  p-1 rounded-lg">
                  <span className="text-xs">Salvador</span>
                  <ChevronDown size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvador</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/*  User Info  */}
          <div className="flex">
            <Tooltip>
              <TooltipTrigger>
                <div className=" bg-gray-200 hover:text-blue-800 p-1 rounded-lg">
                  <Image
                    src="/images/avatar.jpg"
                    width={30}
                    height={30}
                    className="rounded-full"
                    alt="avatar"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cuenta</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/*  User Info  */}
          <div className="flex">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center bg-gray-200  p-1 rounded-lg">
                  <LayoutGrid size={18} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SystemHeader;
