import Image from "next/image";

const LogoIcon = ({ className }: { className: string }) => {
  return (
    <Image
      width={250}
      height={250}
      src={"/images/logo_icon_light.png"}
      alt="Yunuen Co"
      className={`main-logo-class ${className}`}
    />
  );
};

export default LogoIcon;
