"use client";
import { motion } from "framer-motion";

const SectionTitle = ({
  title,
  titleTwo = "",
  subtitle,
  className = "",
}: {
  title: string;
  titleTwo?: string;
  subtitle: string;
  className?: string;
}) => {
  return (
    <div
      className={`section-title-class pb-10 w-full flex flex-col items-center justify-center  mx-auto ${className} `}
    >
      <motion.h2
        initial={{ opacity: 0, scale: 1, y: -20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 1,
          type: "tween",
          stiffness: 260,
          damping: 20,
        }}
        className="font-primary mb-4"
      >
        <span className="text-primary dark:text-white">{title} </span>
        <span className="text-dark dark:text-primary">{titleTwo}</span>
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 1, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 1.2,
          type: "tween",
          stiffness: 260,
          damping: 20,
        }}
        className="h-[1px] w-[150px] border-b border-primary mb-4"
      />
      <motion.p
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 1.2,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="text-lg maxmd:text-base font-secondary "
      >
        {subtitle}
      </motion.p>
    </div>
  );
};

export default SectionTitle;
