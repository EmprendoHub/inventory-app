"use client";
import { useTheme } from "next-themes";
import Image from "next/image";
import lightImage from "../../public/icons/co_logo.png";
import darkImage from "../../public/icons/co_logo.png";
import { useEffect, useState } from "react";

const LogoIcon = ({ className }: { className: string }) => {
  const { theme } = useTheme();
  const [newTheme, setNewTheme] = useState("dark");

  useEffect(() => {
    setNewTheme(theme || "dark");
  }, [theme]);

  return (
    <Image
      width={250}
      height={250}
      src={newTheme === "light" ? darkImage : lightImage}
      alt="Yunuen Co"
      className={`icon-logo-class ${className}`}
    />
  );
};

export default LogoIcon;
