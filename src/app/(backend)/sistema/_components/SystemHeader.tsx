import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import React from "react";
import { SearchInput } from "./SearchInput";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { signOut } from "next-auth/react";

const SystemHeader = () => {
  return (
    <div className="bg-slate-200 h-10 flex items-center justify-between px-4 maxsm:px-2">
      <div className="flex items-center maxsm:w-[65%] maxsm:pr-2">
        <SearchInput />
      </div>
      <div className="flex gap-2 items-center  maxsm:w-full">
        <TooltipProvider>
          {/* <!-- Notification --> */}
          <LogOut
            size={20}
            onClick={() => signOut()}
            className=" cursor-pointer"
          />
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
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SystemHeader;
