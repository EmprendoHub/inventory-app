import Image from "next/image";

const LogoComponent = ({ className }: { className: string }) => {
  return (
    <Image
      width={250}
      height={250}
      src={"/images/horizontal_logo.webp"}
      alt="Yunuen Co"
      className={`main-logo-class ${className}`}
    />
  );
};

export default LogoComponent;
