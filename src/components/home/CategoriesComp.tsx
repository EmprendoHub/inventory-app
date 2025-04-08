"use client";

import SectionTitle from "./SectionTitle";
import React from "react";
import "./categories.css";

const CategoriesComp = () => {
  return (
    <div
      className="pt-20 pb-40 px-40 maxxlg:px-20 maxlg:px-10 maxmd:px-5 maxmd:pt-10 bg-gray-200"
      id="servicios"
    >
      <div className="mx-auto">
        <SectionTitle
          className="text-5xl maxmd:text-4xl text-gray-800 dark:text-gray-300 font-primary leading-none mb-3 w-full text-center h-full px-20 maxsm:px-5"
          title={"categoryDic.title"}
          titleTwo={"categoryDic.titleTwo"}
          subtitle={"categoryDic.text"}
        />
      </div>
      <div className="relative flex flex-wrap maxsm:flex-col items-center justify-center gap-10 w-full ">
        {/* {categoryDic.categories.map((category, index) => (
          <div
            key={category.title}
            className="w-auto cursor-pointer hover:scale-[105%] duration-300 ease-in-out mx-auto flex flex-col items-center justify-center gap-2"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: index * 0.2, 
                type: "tween",
                stiffness: 260,
                damping: 20,
              }}
              className="octagon-container relative mx-auto items-center justify-center flex text-center h-[300px] w-[300px] maxxlg:h-[250px] maxxlg:w-[250px] maxlg:h-[250px] maxlg:w-[250px] maxmd:h-[250px] maxmd:w-[250px]"
            >
              <div className="octagon relative overflow-hidden w-full h-[400px] maxxlg:h-[250px]">
                <Image
                  src={category.imgPath}
                  width={600}
                  height={600}
                  alt={category.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="octagon-overlay absolute z-[2] top-0 left-0 w-full h-full" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, scale: 0, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: index * 0.2, // Sequential delay
                type: "tween",
                stiffness: 260,
                damping: 20,
              }}
              className=" text-4xl font-primary tracking-wide"
            >
              {category.title}
            </motion.span>
          </div>
        ))} */}
      </div>
    </div>
  );
};

export default CategoriesComp;
