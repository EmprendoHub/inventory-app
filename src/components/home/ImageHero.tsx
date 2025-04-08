"use client";
import React from "react";
import coverImage from "../../../public/images/RecamaraMarmol.webp";
// import { GiClothes, GiDiscussion } from "react-icons/gi";
import { motion } from "framer-motion";
// import { ButtonMotion } from "../motion/ButtonMotion";
// import { FaDiagnoses, FaXRay } from "react-icons/fa";
import Image from "next/image";

const ImageHero = () => {
  return (
    <div className=" relative">
      <div className="w-full bg-white h-[700px]  maxmd:h-[600px] overflow-hidden top-0 relative flex justify-start items-center">
        {/* overlay */}
        <div className="absolute bg-black bg-opacity-40 maxmd:bg-opacity-60 w-full h-full z-20 " />
        <Image
          src={coverImage}
          width={1920}
          height={1080}
          priority
          loading="eager"
          alt="portfolio image"
          className="w-full h-full absolute top-0 right-0 z-10"
        />

        <div className=" pl-40 maxlg:pl-20 maxmd:pl-5 z-20 text-7xl maxlg:text-6xl maxsm:text-4xl font-primary w-3/4 maxmd:w-[90%] ">
          <motion.h2
            initial={{ opacity: 0, scale: 1, y: -10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.9,
              type: "tween",
              stiffness: 260,
              damping: 20,
            }}
            className="leading-none mb-3"
          >
            <span className="text-white font-black">
              {"Muebles y electrodomésticos "}
            </span>
            <span className="text-primary font-black">
              {"Remodela tu hogar!"}
            </span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 1, y: 10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 1,
              type: "tween",
              stiffness: 260,
              damping: 20,
            }}
            className=" font-secondary text-lg mb-8  maxmd:text-sm flex flex-col gap-3"
          >
            <p className=" flex items-center gap-2">
              {"Precios bajos y productos de calidad"}
            </p>
          </motion.div>
          <div className="flex maxsm:flex-col maxsm:items-start items-center justify-start gap-5">
            {/* <ButtonMotion
              href={homeDic.imageHero.btnUrlTwo}
              aria-label="Contactar"
              textClass={"text-white"}
              textClassTwo={"text-white"}
              className="bg-accent dark:bg-secondary-gradient px-5 py-3 text-white flex items-center justify-center  text-lg tracking-widest"
            >
              {homeDic.imageHero.btnTextTwo}
            </ButtonMotion> */}
          </div>
        </div>
      </div>
      {/* bottom icons */}
      {/* <div className="absolute -bottom-40 maxxlg:-bottom-48 maxlg:-bottom-36 left-1/2 transform -translate-x-1/2 z-20 w-full px-20 maxxlg:px-5">
        <div className="flex items-center justify-center gap-5 maxsm:gap-1 w-full bg-white py-4 shadow-sm shadow-slate-400">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              type: "tween",
              stiffness: 260,
              damping: 20,
            }}
            className=" w-80 maxsm:w-auto flex flex-col items-center justify-start px-6 maxsm:px-1 py-4 border-r-2 border-primary"
          >
            <div className=" flex flex-col maxlg:items-center items-center justify-start w-full">
              <FaXRay size={60} className="text-primary mb-2" />{" "}
              <span className=" leading-none text-2xl maxsm:text-sm text-center font-semibold">
                {"Calidad y servicio"}
              </span>
            </div>
            <span className="text-base text-primary  maxlg:hidden text-center">
              {"Renueva tu AirB&B con nosotros"}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              type: "tween",
              stiffness: 260,
              damping: 20,
            }}
            className=" w-80 maxsm:w-auto flex flex-col items-center justify-start px-6 maxsm:px-1 py-4 border-r-2 border-primary"
          >
            <div className=" flex flex-col maxlg:items-center  items-center justify-start w-full">
              <GiClothes size={60} className="text-primary mb-2" />
              <span className="text-2xl leading-none  maxlg:text-sm text-center font-semibold">
                {"Muebles americanos de liquidación."}
              </span>
            </div>
            <span className="text-base maxlg:hidden text-center">
              {"Contamos con muebles de calidad a precios bajos"}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              type: "tween",
              stiffness: 260,
              damping: 20,
            }}
            className=" w-80  maxsm:w-auto flex flex-col items-center px-6 maxsm:px-1 py-4 border-r-2 maxmd:border-r-0 border-primary"
          >
            <div className=" flex flex-col maxlg:items-center  items-center justify-start w-full">
              <GiDiscussion size={60} className="text-primary mb-2" />{" "}
              <span className="text-2xl leading-none  maxlg:text-sm text-center font-semibold">
                {"Atención Amable y Personalizada"}
              </span>
            </div>
            <span className="text-base text-center maxlg:hidden">
              {
                "Nuestro equipo está aquí para brindarte la mejor experiencia, desde el primer contacto."
              }
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              type: "tween",
              stiffness: 260,
              damping: 20,
            }}
            className=" flex  w-80  maxsm:w-28 maxmd:hidden flex-col items-center justify-start px-6 maxsm:px-1 py-4 "
          >
            <div className=" flex flex-col maxlg:items-center items-center justify-start w-full">
              <FaDiagnoses size={60} className="text-primary mb-2" />{" "}
              <span className="text-2xl leading-none maxlg:text-sm text-center font-semibold">
                {"Certeza de Calidad y Puntualidad"}
              </span>
            </div>
            <span className="text-base text-center maxlg:hidden">
              {
                "Trabajamos con los mejores proveedores para garantizar la calidad de nuestros productos y la puntualidad en las entregas."
              }
            </span>
          </motion.div>
        </div>
      </div> */}
    </div>
  );
};

export default ImageHero;
