"use client";
import "./styles.scss";
import * as FaIcons from "react-icons/fa6";
import { IconType } from "react-icons";
import Image from "next/image";

const ThreeDFlipBoxComp = ({
  data,
  className,
  classNameBack,
}: {
  data: {
    icon: string;
    title: string;
    text: string;
    titleTwo: string;
    textTwo: string;
    imgTwo: string;
    img: string;
  };
  className: string;
  classNameBack: string;
}) => {
  const IconComponent: IconType | undefined =
    FaIcons[data.icon as keyof typeof FaIcons];
  return (
    <div className="flip-card m-4 maxlg:mx-2 maxmd:mx-1 maxsm:my-2 ">
      <div className="flip-card-front  w-[800px] maxlg:w-[550px] maxmd:w-[600px] maxsm:w-[400px] min-h-[340px] ">
        <div className="inner p-5 maxmd:p-3 flex flex-col justify-center items-center  text-white">
          {IconComponent && (
            <IconComponent className="text-4xl mb-3 text-white dark:text-white" />
          )}
          <h3 className="text-2xl text-white dark:text-primary">
            {data?.title}
          </h3>
          <p>{data?.text}</p>
        </div>
        <Image
          src={data?.img}
          layout="fill"
          alt="flip"
          className=" object-cover"
        />
        <div className={className} />
      </div>
      <div className="flip-card-back w-[800px] maxlg:w-[550px] maxmd:w-[600px] maxsm:w-[400px] min-h-[340px]  ">
        <div className="inner p-5 maxsm:p-5 flex flex-col justify-center items-center">
          {IconComponent && (
            <IconComponent className="text-4xl mb-3 text-white" />
          )}
          <h3 className="text-white text-5xl">{data?.titleTwo}</h3>
          <p className="text-white ">{data?.textTwo}</p>
        </div>
        <Image
          src={data?.imgTwo}
          layout="fill"
          alt="flip"
          className=" object-cover"
        />
        <div className={classNameBack} />
      </div>
    </div>
  );
};

export default ThreeDFlipBoxComp;
