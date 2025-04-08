"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CiCircleChevDown } from "react-icons/ci";

const DoubleSideToSide = () => {
  return (
    <div className="w-full min-h-full  py-40" id="acerca">
      <div className="h-full py-8">
        {/* Top Side */}
        <div className="h-full max-w-5xl mx-auto m-8">
          <div className="flex h-full maxmd:flex-col-reverse items-center justify-center">
            {/* text and image */}
            <div className="w-6/12 maxmd:w-full  h-full">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.7,
                  type: "tween",
                  stiffness: 260,
                  damping: 20,
                }}
                className="relative w-[20rem] h-[20rem] maxsm:w-[15rem] maxsm:h-[15rem]  rounded-full overflow-hidden ml-10"
              >
                {/* Diamond image container */}
                <div className="absolute  w-[141%] h-[141%] top-[-20.5%] left-[-20.5%] ">
                  <Image
                    className="object-cover w-full h-full"
                    src={"/images/Buffetera.webp"}
                    alt="Unidad de Diagnóstico Dr. Gerardo Amezcua"
                    width={550}
                    height={550}
                    priority
                  />
                </div>
              </motion.div>
            </div>
            {/* text */}
            <div className="relative maxmd:ml-5 w-6/12 pr-20 maxmd:w-full">
              <motion.h2
                initial={{ x: -180, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="text-5xl maxmd:text-3xl text-gray-800 dark:text-gray-300 font-primary leading-none mb-3 w-[90%] h-full"
              >
                <span>{"Muebles de alta calidad"} </span>
              </motion.h2>
              <motion.h2
                initial={{ x: -180, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.6 }}
                className="text-5xl maxmd:text-3xl text-gray-800 dark:text-gray-300 font-primary leading-none mb-3 w-[90%] h-full"
              >
                <span className="text-primary">{"a precios accesibles"}</span>
              </motion.h2>
              <div className="text-gray-800 dark:text-gray-300 font-secondary text-sm mb-2 maxmd:text-sm flex flex-col gap-3 min-h-full">
                <motion.p
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.2,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2"
                >
                  {"homeDic.doublesides.boxTwo.text"}
                </motion.p>
              </div>
              <ul className="text-xs italic text-gray-500 dark:text-gray-300 font-secondary flex flex-col gap-2">
                <motion.li
                  initial={{ opacity: 0, x: 0 }}
                  whileInView={{ opacity: 1, x: 1 }}
                  transition={{
                    duration: 1.2,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2"
                >
                  <CiCircleChevDown className="text-black" />{" "}
                  {"Muebles y electrodomésticos de alta calidad"}
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.4,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2"
                >
                  <CiCircleChevDown className="text-black" />{" "}
                  {
                    "Tienes un hotel, motel or Airbnb? Contáctanos tenemos precios especiales!"
                  }
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.7,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2"
                >
                  <CiCircleChevDown className="text-black" />{" "}
                  {
                    "Precios Accesibles: Ofrecemos paquetes y servicios competitivos sin comprometer la calidad."
                  }
                </motion.li>
              </ul>
            </div>
          </div>
        </div>
        {/* Bottom Side */}
        <div className="h-full max-w-5xl mx-auto m-8 mt-20">
          <div className="flex maxmd:flex-wrap  maxmd:h-full items-center justify-center">
            {/* Text */}
            <div className="w-6/12 maxmd:w-full px-12">
              <motion.h2
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.7,
                  type: "tween",
                  stiffness: 260,
                  damping: 20,
                }}
                className="text-5xl maxmd:text-3xl text-gray-800 dark:text-gray-300 font-primary leading-none mb-3 w-[90%] h-full"
              >
                <span>{"Remodela tu hogar "} </span>
                <span className="text-primary">{"a precios accesibles"}</span>
              </motion.h2>
              <div className="text-gray-800 dark:text-gray-300 font-secondary text-sm mb-8 maxmd:text-sm flex flex-col gap-3 min-h-full">
                <motion.p
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.2,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2"
                >
                  {
                    "Crea un ambiente acogedor y funcional con nuestros muebles de alta calidad."
                  }
                </motion.p>
              </div>
              <ul className="text-xs italic text-gray-500 dark:text-gray-300 font-secondary flex flex-col gap-2">
                <motion.li
                  initial={{ opacity: 0, x: 0 }}
                  whileInView={{ opacity: 1, x: 1 }}
                  transition={{
                    duration: 1.2,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2"
                >
                  <CiCircleChevDown className="text-black" />{" "}
                  {
                    "Profesionales capacitados: Un equipo dedicado a brindarte la mejor atención."
                  }
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.4,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2"
                >
                  <CiCircleChevDown className="text-black" />{" "}
                  {
                    "Muebles de alta calidad: Diseños modernos y funcionales para cada espacio."
                  }
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.7,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2"
                >
                  <CiCircleChevDown className="text-black" />{" "}
                  {
                    "Calidad y diseño: Muebles que combinan estilo y funcionalidad."
                  }
                </motion.li>
              </ul>
            </div>
            {/* Image */}
            <div className="relative w-6/12 maxmd:w-[90%]">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.7,
                  type: "tween",
                  stiffness: 260,
                  damping: 20,
                }}
                className="relative w-[20rem] h-[20rem] maxsm:w-[15rem] maxsm:h-[15rem]  rounded-full overflow-hidden ml-10"
              >
                {/* image container */}
                <div className="absolute  w-[141%] h-[141%] top-[-20.5%] left-[-20.5%]">
                  <Image
                    className="object-cover w-full h-full"
                    src={"/images/Mesa_Cafetera.webp"}
                    alt="Unidad de Diagnóstico Dr. Gerardo Amezcua"
                    width={550}
                    height={550}
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoubleSideToSide;
