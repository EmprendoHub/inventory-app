import Image from "next/image";

const LogoComponent = ({ className }: { className: string }) => {
  return (
    <Image
      width={250}
      height={250}
      src={`/logos/logo_square_light.png`}
      alt="Yunuen Co"
      className={`main-logo-class ${className}`}
    />
  );
};

export default LogoComponent;
