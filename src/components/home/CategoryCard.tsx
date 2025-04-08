"use client";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import ModalProduct from "../layout/ModalProduct";

interface Category {
  id: string;
  name: string;
  description: string;
  images: { _id: string; url: string }[];
  title: string;
  packing: string;
  category?: {
    name: string;
    summary: string;
    characteristics: {
      _id: string;
      test: string;
      method: string;
      typicalValue?: string;
    }[];
    benefits: string;
    precautions: string;
    images: { _id: string; url: string }[];
  };
}

export default function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <ModalProduct
        showModal={showModal}
        setShowModal={setShowModal}
        data={category}
      />
      <Link
        key={category.title}
        href={`${category.name}`}
        className="w-auto cursor-pointer hover:scale-[105%] duration-300 ease-in-out"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 10 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: index * 0.2, // Sequential delay
            type: "tween",
            stiffness: 260,
            damping: 20,
          }}
          className="octagon-container relative mx-auto items-center justify-center flex text-center h-[300px] w-[300px] maxxlg:h-[250px] maxxlg:w-[250px] maxlg:h-[250px] maxlg:w-[250px] maxmd:h-[250px] maxmd:w-[250px]"
        >
          <div className="octagon relative overflow-hidden w-full h-[500px] maxxlg:h-[350px]">
            <Image
              src={category.images[0].url}
              width={600}
              height={600}
              alt={category.title}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute z-50 text-white py-2 px-8 text-2xl top-[40%] font-primary tracking-wide">
            {category.title}
          </span>
          {/* Octagonal overlay */}
          <div className="octagon-overlay absolute z-[2] top-0 left-0 w-full h-full" />
        </motion.div>
      </Link>
    </>
  );
}
