"use client";
import { motion } from "framer-motion";
import React from "react";

const SingleSideToSide = () => {
  return (
    <div className="w-full pt-10 maxmd:pt-0 bg-white dark:bg-primary px-32 maxxlg:px-10 maxlg:px-5 maxmd:px-3 ">
      {/* underhero */}

      <section className=" py-8">
        <div className=" mx-auto m-8">
          <div className="flex maxmd:flex-wrap items-center justify-center">
            {/* Text */}
            <div className="w-1/3 maxlg:w-1/2 maxmd:w-full p-6 maxmd:px-0">
              <motion.h2
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="text-5xl font-primary leading-none mb-3"
              >
                <span className=" text-dark">
                  {"homeDic.singlesides.boxOne.title"}{" "}
                </span>
                <span className="text-primary dark:text-white">
                  {"homeDic.singlesides.boxOne.titleTwo"}
                </span>
              </motion.h2>
              <div className="font-secondary text-base mb-3 flex flex-col gap-3">
                <motion.p
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9 }}
                  className="  flex items-center gap-2"
                >
                  {"homeDic.singlesides.boxOne.text"}
                </motion.p>
              </div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 1.0,
                }}
              >
                {/* <ButtonMotion
                  href={homeDic.imageHero.btnUrlTwo}
                  aria-label="Contactar"
                  textClass={"text-white"}
                  textClassTwo={"text-white"}
                  className="bg-accent dark:bg-secondary-gradient px-10 py-3 text-white flex items-center justify-center  text-base tracking-widest"
                >
                  {homeDic.singlesides.boxOne.btnText}
                </ButtonMotion> */}
              </motion.div>
            </div>
            {/* Image */}
            <div className="relative w-2/3 maxmd:w-full">
              {/* <FlipBoxesComp flipBoxes={flipBoxes} /> */}
              <section className="min-h-full">
                <div className=" mx-auto flex ">
                  <div className="w-full min-h-full flex flex-row maxsm:flex-col items-center maxsm:items-start justify-center maxlg:justify-between place-content-center">
                    {/* <ThreeDFlipBoxComp
                      data={flipBoxes[1]}
                      className={`w-full h-full object-cover absolute bg-black bg-opacity-50 shadow-lg shadow-black `}
                      classNameBack={
                        "w-full h-full object-cover absolute bg-black bg-opacity-50 shadow-lg shadow-black "
                      }
                    /> */}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SingleSideToSide;
