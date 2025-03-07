"use client";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  sendWAMediaMessage,
  sendWATemplatePaymentPendingMessage,
  sendWATextMessage,
} from "@/app/_actions";
import Image from "next/image";

export default function MessageForm() {
  // Form States
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [success, setSuccess] = useState(false);

  const [mainImage, setMainImage] = useState("/images/item_placeholder.png");

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    // const success = await sendSMSMessage(body, phone, name);

    let success;
    if (mainImage === "/images/item_placeholder.png" && body.length <= 0) {
      success = await sendWATemplatePaymentPendingMessage(phone);
    } else if (
      mainImage === "/images/item_placeholder.png" &&
      body.length > 0
    ) {
      success = await sendWATextMessage(body, phone);
    } else {
      success = await sendWAMediaMessage(body, phone, mainImage);
    }

    if (success) {
      console.log("WA Text message sent successfully!");
    } else {
      console.log("Failed to send WA Text message.");
    }

    setSuccess(true);
  };

  // *******main images**********  //
  // functions
  const upload = async (e: any) => {
    // Get selected files from the input element.
    const files = e?.target.files;
    if (files) {
      for (let i = 0; i < files?.length; i++) {
        const file = files[i];
        // Retrieve a URL from our server.
        retrieveNewURL(file, (file, url) => {
          const parsed = JSON.parse(url);
          url = parsed.url;
          // Compress and optimize the image before upload
          compressAndOptimizeMainImage(file, url);
        });
      }
    }
  };

  // generate a pre-signed URL for use in uploading that file:
  async function retrieveNewURL(
    file: { name: any },
    cb: {
      (file: any, url: string): void;
      (file: any, url: any): void;
      (arg0: any, arg1: string): void;
    }
  ) {
    const endpoint = `/api/minio/`;
    fetch(endpoint, {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": "*",
        Name: file.name,
      },
    })
      .then((response) => {
        response.text().then((url) => {
          cb(file, url);
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }
  async function compressAndOptimizeMainImage(
    file: Blob | MediaSource,
    url: any
  ) {
    // Create an HTML Image element
    const img = document.createElement("img");

    // Load the file into the Image element
    img.src = URL.createObjectURL(file);

    // Wait for the image to load
    img.onload = async () => {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      const ctx: any = canvas.getContext("2d");

      // Set the canvas dimensions to the image dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0);

      // Compress and set quality (adjust quality value as needed)
      const quality = 0.8; // Adjust quality value as needed
      const compressedImageData = canvas.toDataURL("image/jpeg", quality);

      // Convert base64 data URL to Blob
      const blobData = await fetch(compressedImageData).then((res) =>
        res.blob()
      );

      // Upload the compressed image
      uploadFile(blobData, url);
    };
  }

  // to upload this file to S3 at `https://minio.salvawebpro.com:9000` using the URL:
  async function uploadFile(blobData: Blob, url: any | URL | Request) {
    fetch(url, {
      method: "PUT",
      body: blobData,
    })
      .then(() => {
        const newUrl = url.split("?");

        setMainImage(newUrl[0]);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  return (
    <div className="h-full flex justify-start gap-5">
      <div className="space-y-5 w-full h-full">
        <input
          type="text"
          name="phone"
          placeholder="Número de teléfono"
          className="bg-input"
          onChange={(e) => setPhone(e.target.value)}
        ></input>
        {/* Message */}
        <textarea
          id="Body"
          rows={6}
          onChange={(e) => setBody(e.target.value)}
          className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg shadow-sm border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          placeholder="Mensaje"
        ></textarea>
        {/*  Imagen principal */}
        <div className="gap-y-1 flex-col flex px-2 w-full">
          <div className="relative aspect-video hover:opacity-80 bg-background border-4 border-gray-300">
            <label htmlFor="selectorMain" className="cursor-pointer">
              <Image
                id="blogImage"
                alt="blogBanner"
                src={mainImage}
                width={1280}
                height={1280}
                className="w-full h-full object-cover z-20"
              />
              <input
                id="selectorMain"
                type="file"
                accept=".png, .jpg, .jpeg, .webp"
                hidden
                onChange={upload}
              />
            </label>
          </div>
        </div>
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <button
            onClick={handleSubmit}
            className="py-3 px-5 mt-5 text-sm font-medium text-center text-white bg-black rounded-lg bg-primary-700 sm:w-fit  focus:ring-4 focus:outline-none focus:ring-primary-300"
          >
            Enviar Mensajes
          </button>
        </div>
      </div>
      <div className="w-full ">
        <div className="relative w-full h-full flex justify-center">
          <div className="absolute  z-10 bg-red-100 p-5 mx-5 rounded-md mt-10">
            {success && "Mensaje enviado con éxito!"}
            {mainImage !== "/images/product-placeholder-minimalist.jpg" ? (
              <Image
                id="blogImage"
                alt="blogBanner"
                src={mainImage}
                width={1280}
                height={1280}
                className=" w-[400px] h-[400px] rounded-t-md"
              />
            ) : (
              ""
            )}
            {body.length > 0 ? (
              <div className="bg-slate-100 text-black text-sm p-1 rounded-b-md">
                {body}
              </div>
            ) : (
              <div className="bg-slate-100 text-black text-sm p-1 rounded-b-md">
                ¡OFERTA - Por Tiempo Limitado! ¡No te pierdas esta oportunidad
                única! Aprovecha nuestras increíbles ofertas antes de que se
                acaben. ¡Solo por tiempo limitado! 🔥 👉 ¡Haz clic aquí para más
                detalles y asegura tu descuento! #OfertaEspecial #TiempoLimitado
                ¿Listo para ahorrar? ¡Contáctanos ahora! 🚀
              </div>
            )}
          </div>
          <Image
            id="WAWallPaper"
            alt="WAWallPaper"
            src={"/images/WAWallpaper.jpeg"}
            width={735}
            height={1593}
            className="w-full h-full absolute object-cover z-1 "
          />
        </div>
      </div>
    </div>
  );
}
