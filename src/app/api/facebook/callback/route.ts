import {
  sendRecentOrdersInteractiveMessage,
  sendWATemplateOrderPdfMessage,
  uploadToBucket,
} from "@/app/_actions";
import prisma from "@/lib/db";
import { Prisma, SenderType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import fs from "fs";
import axios from "axios";
import {
  generateCustomerServiceResponse,
  processImageWithAI,
  storeMessage,
  transcribeAudioWithAI,
} from "@/lib/ai/actions";
import { sendWhatsAppMessage } from "@/app/(backend)/sistema/ventas/clientes/_actions/chatgpt";
import {
  analyzeCustomerSentiment,
  generateAiFollowUp,
  generateProductRecommendations,
  sendProductRecommendations,
  sendSatisfactionSurvey,
  shouldSendAiFollowUp,
  SYSTEM_PROMPTS,
} from "@/lib/advanceAi/actions";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { createWhatsAppMessagesType } from "@/types/whatsapp";
import { OrderType } from "@/types/sales";

const FACEBOOK_VERIFY_TOKEN = process.env.FB_WEBHOOKTOKEN;
// Enhanced database service object
const dbService = {
  findClientByPhone: async (phone: string) => {
    return prisma.client.findUnique({
      where: { phone },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { orderItems: true, payments: true },
        },
      },
    });
  },

  createMessage: async (messageDetails: createWhatsAppMessagesType) => {
    const currentDateTime = getMexicoGlobalUtcDate();
    return prisma.$transaction(async (prisma) => {
      const message = await prisma.whatsAppMessage.create({
        data: {
          clientId: messageDetails.clientId,
          phone: messageDetails.phone,
          type: "interactive",
          header: messageDetails.messageTitle,
          message: messageDetails.message,
          sender: "CLIENT" as SenderType,
          timestamp: currentDateTime,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
        },
      });
      await prisma.client.update({
        where: { id: messageDetails.clientId },
        data: { updatedAt: currentDateTime },
      });
      return message;
    });
  },

  getRealtimeOrderData: async (clientId: string) => {
    return prisma.order.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        orderItems: true,
      },
    });
  },

  createEscalation: async (data: Prisma.EscalationCreateInput) => {
    return prisma.escalation.create({ data });
  },

  updateClientLastInteraction: async (clientId: string) => {
    return prisma.client.update({
      where: { id: clientId },
      data: { updatedAt: new Date() },
    });
  },

  getRecentOrders: async (clientId: string) => {
    return prisma.order.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { orderItems: true },
    });
  },

  getProductDetails: async (productInquiry: string) => {
    // First query to get the item with its categoryId
    const item = await prisma.item.findFirst({
      where: {
        OR: [
          { name: { contains: productInquiry, mode: "insensitive" } },
          { description: { contains: productInquiry, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        categoryId: true,
        mainImage: true,
      },
    });

    // Then use the categoryId to fetch the category name
    const category = item
      ? await prisma.category.findUnique({
          where: {
            id: item.categoryId,
          },
          select: {
            title: true,
          },
        })
      : null;
    const result = {
      ...item,
      category: category?.title,
    };
    return result;
  },
};

// Facebook webhook verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");
  const mode = searchParams.get("hub.mode");

  if (mode === "subscribe" && verifyToken === FACEBOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response("Verification failed", { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  try {
    if (payload.object === "whatsapp_business_account") {
      await Promise.all(
        payload.entry.map(async (entry: any) => {
          const webhookEvent = entry.messaging || entry.changes;

          if (webhookEvent) {
            const eventPromises = webhookEvent.map(async (event: any) => {
              console.log("EVENT", event);

              if (event.field === "messages") {
                return processMessageEvent(event.value);
              }
            });

            await Promise.all(eventPromises);
          }
        })
      );
    }

    return NextResponse.json({ message: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processMessageEvent(event: any) {
  if (event.statuses) {
    console.log("PROCESS statuses", event.statuses[0]);
    const WAPhone = event.statuses[0].recipient_id.replace(/^521/, "");
    const client = await prisma.client.findFirst({
      where: { phone: WAPhone },
    });
    console.log(client?.name);
  }

  if (event.messages) {
    console.log("PROCESS contacts", event.contacts[0]);
    console.log("PROCESS messages", event.messages[0]);

    const WAPhone = event.contacts[0].wa_id.replace(/^521/, "");
    const client = await dbService.findClientByPhone(WAPhone);
    const currentDateTime = getMexicoGlobalUtcDate();
    const timestamp = currentDateTime;
    const senderPhone = WAPhone;
    const senderName = event.contacts[0].profile.name;
    const clientId = client?.id || "";
    const messageType = event.messages[0].type;

    try {
      if (WAPhone === "3532464146") {
        console.log("Ignoring messages from the business phone");
        await handleOwnerTextMessage({
          senderPhone,
          clientId,
          timestamp,
          messageText: event.messages[0].text.body,
          senderName,
        });
      } else {
        // Use realtime data in sentiment analysis
        const [sentimentAnalysis, realtimeOrders] = await Promise.all([
          analyzeCustomerSentiment(senderPhone),
          dbService.getRealtimeOrderData(clientId),
        ]);

        // Process message types with realtime data context
        switch (messageType) {
          case "text":
            await handleTextMessage({
              senderPhone,
              clientId,
              timestamp,
              messageText: event.messages[0].text.body,
              senderName,
              realtimeOrders, // Pass realtime data to handler
              sentiment: sentimentAnalysis.analysis?.sentiment || "Neutral",
            });
            break;

          case "button":
            await handleButtonMessage({
              senderPhone,
              clientId,
              timestamp,
              messagePayload: event.messages[0].button.payload,
              messageText: event.messages[0].button.text,
              senderName,
            });
            break;

          case "audio":
            await handleAudioMessage({
              senderPhone,
              clientId,
              timestamp,
              senderName,
              itemId: event.messages[0].audio.id,
            });
            break;

          case "image":
            await handleImageMessage({
              senderPhone,
              clientId,
              timestamp,
              messageText: event.messages[0].image.caption || "Imagen recibida",
              senderName,
              itemId: event.messages[0].image.id,
            });
            break;

          case "interactive":
            await handleInteractiveMessage({
              senderPhone,
              orderId: event.messages[0].interactive.list_reply.id,
              clientId,
              timestamp,
              messageTitle: event.messages[0].interactive.list_reply.title,
              messageDescription:
                event.messages[0].interactive.list_reply.description,
              senderName,
            });
            break;

          default:
            console.warn("Unsupported message type:", messageType);
        }

        // Delayed follow-up check
        setTimeout(async () => {
          const followUpCheck = await shouldSendAiFollowUp(senderPhone);
          if (followUpCheck.shouldFollow) {
            await generateAiFollowUp(senderPhone);
          }
        }, 300000); // 300-second delay for follow-up
      }
    } catch (error) {
      console.error("Message processing failed:", error);
    }
  }
}

// Update the media processing functions
async function processAudioFile(audioId: string) {
  const url = `https://graph.facebook.com/v22.0/${audioId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download audio file: ${response.statusText}`);
  }

  const data = await response.json();
  const WAAudioUrl = data.url;

  // Save to storage
  const audioResponse = await axios.get(WAAudioUrl, {
    headers: {
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      "Content-Type": data.mime_type,
    },
    responseType: "arraybuffer",
  });

  const audioBuffer = await audioResponse.data;
  const newFilename = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.ogg`;
  const filePath = join("/", "tmp", newFilename);
  fs.writeFileSync(filePath, audioBuffer);

  await uploadToBucket("inventario", "audio/" + newFilename, filePath);
  const audioUrl = `${process.env.MINIO_URL}audio/${newFilename}`;

  // Transcribe audio using AI
  const transcription = await transcribeAudioWithAI(audioUrl);
  return { success: true, audioUrl, transcription };
}

async function processImageFile(imageId: string) {
  try {
    const url = `https://graph.facebook.com/v22.0/${imageId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image metadata: ${response.statusText}`);
    }

    const data = await response.json();
    const WAImageUrl = data.url;

    // Save to storage
    const imageResponse = await axios.get(WAImageUrl, {
      headers: {
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
        "Content-Type": data.mime_type,
      },
      responseType: "arraybuffer",
    });

    const imageBuffer = await imageResponse.data;
    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.jpeg`;
    const filePath = join("/", "tmp", newFilename);
    fs.writeFileSync(filePath, imageBuffer);

    await uploadToBucket("inventario", "images/" + newFilename, filePath);
    const imageUrl = `${process.env.MINIO_URL}images/${newFilename}`;
    // Process image with AI
    const imageDescription = await processImageWithAI(imageUrl);

    return { success: true, imageUrl, description: imageDescription };
  } catch (error) {
    console.error("Error in processImageFile:", error);
    throw error;
  }
}

async function storeTextInteractiveMessage(messageDetails: any) {
  // typing on
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: `52${messageDetails.senderPhone}`,
    type: "text",
    text: {
      body: "Estamos procesando tu solicitud...",
    },
  });

  const config = {
    method: "post",
    url: `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_ID}/messages`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
    data: data,
  };

  await axios(config);

  const response = await processPdfFile(messageDetails.orderId);
  if (response.success) {
    const currentDateTime = getMexicoGlobalUtcDate();
    const newWAMessage = await prisma.whatsAppMessage.create({
      data: {
        clientId: messageDetails.clientId,
        phone: messageDetails.senderPhone,
        type: "interactive",
        header: messageDetails.messageTitle,
        message: messageDetails.messageDescription,
        mediaUrl: response.pdfUrl,
        sender: "CLIENT" as SenderType,
        timestamp: currentDateTime,
        createdAt: currentDateTime,
        updatedAt: currentDateTime,
      },
    });

    await sendWATemplateOrderPdfMessage(
      messageDetails.orderId,
      response.pdfUrl
    );
    console.log("PDF Message stored:", newWAMessage);
  }
}

async function processPdfFile(orderId: string) {
  try {
    // Step 1: Fetch pdf order receipt
    const url = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/factura/${orderId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // Step 2: Get the PDF buffer from the response
    const pdfBuffer = await response.arrayBuffer();

    // Step 3: Generate a unique filename and save the PDF to a temporary file
    const newFilename = `${orderId}.pdf`;
    const filePath = join("/", "tmp", newFilename);

    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

    // Step 4: Upload the file to the bucket
    await uploadToBucket("inventario", "pdf/" + newFilename, filePath);
    console.log("File uploaded to bucket");

    // Step 5: Return the public URL of the uploaded PDF
    const pdfUrl = `${process.env.MINIO_URL}pdf/${newFilename}`;
    return { success: true, pdfUrl };
  } catch (error) {
    console.error("Error in processPdfFile:", error);
    throw error; // Re-throw the error for further handling
  }
}

// async function handleTextMessage(messageDetails: any) {
//   // Store the incoming message
//   const currentDateTime = getMexicoGlobalUtcDate();
//   await prisma.whatsAppMessage.create({
//     data: {
//       clientId: messageDetails.clientId,
//       phone: messageDetails.senderPhone,
//       type: "text",
//       message: messageDetails.messageText,
//       sender: "CLIENT" as SenderType,
//       timestamp: currentDateTime,
//       createdAt: currentDateTime,
//       updatedAt: currentDateTime,
//     },
//   });

//   // Generate AI response based on sentiment
//   const systemPrompt = selectSystemPrompt(
//     messageDetails.messageText,
//     messageDetails.sentiment
//   );
//   const aiResponse = await generateCustomerServiceResponse(
//     messageDetails.messageText,
//     messageDetails.clientId,
//     messageDetails.senderPhone,
//     systemPrompt
//   );

//   if (aiResponse) {
//     const createdAt = getMexicoGlobalUtcDate();

//     await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);
//     await storeMessage({
//       phone: messageDetails.senderPhone,
//       clientId: messageDetails.clientId,
//       message: aiResponse,
//       type: "text",
//       sender: "SYSTEM" as SenderType,
//       timestamp: createdAt,
//     });

//     // Send product recommendations if appropriate
//     if (shouldOfferRecommendations(messageDetails.messageText)) {
//       const recommendations = await generateProductRecommendations(
//         messageDetails.clientId
//       );
//       if (recommendations.success) {
//         if (recommendations.recommendedProducts) {
//           await sendProductRecommendations(
//             messageDetails.senderPhone,
//             recommendations.recommendedProducts
//           );
//         }
//       }
//     }
//   }
// }

// Enhanced handleTextMessage with realtime data integration

async function handleTextMessage(messageDetails: any) {
  // Store message using transaction
  await dbService.createMessage({
    clientId: messageDetails.clientId,
    phone: messageDetails.senderPhone,
    type: "text",
    message: messageDetails.messageText,
    sender: "CLIENT",
    timestamp: messageDetails.timestamp,
  });

  // Check if the message is asking for product prices
  const productInquiry = detectProductInquiry(messageDetails.messageText);
  if (productInquiry) {
    const product = await dbService.getProductDetails(productInquiry);
    if (product) {
      const response = `El producto "${product.name}" tiene un precio de $${product.price}. ¿Necesitas más información?`;
      await sendWhatsAppMessage(messageDetails.senderPhone, response);
      await dbService.createMessage({
        phone: messageDetails.senderPhone,
        clientId: messageDetails.clientId,
        message: response,
        type: "text",
        sender: "SYSTEM",
        timestamp: new Date(),
      });
      return; // Exit early after handling the product inquiry
    } else {
      const notFoundResponse = `Lo siento, no pude encontrar información sobre "${productInquiry}". ¿Podrías darme más detalles?`;
      await sendWhatsAppMessage(messageDetails.senderPhone, notFoundResponse);
      await dbService.createMessage({
        phone: messageDetails.senderPhone,
        clientId: messageDetails.clientId,
        message: notFoundResponse,
        type: "text",
        sender: "SYSTEM",
        timestamp: new Date(),
      });
      return; // Exit early after handling the not-found case
    }
  }

  // Generate response with realtime context
  const systemPrompt = createDynamicPrompt(
    messageDetails.messageText,
    messageDetails.sentiment,
    messageDetails.realtimeOrders
  );

  const aiResponse = await generateCustomerServiceResponse(
    messageDetails.messageText,
    messageDetails.clientId,
    messageDetails.senderPhone,
    systemPrompt
  );

  if (aiResponse) {
    // eslint-disable-next-line
    const [messageSent] = await Promise.all([
      sendWhatsAppMessage(messageDetails.senderPhone, aiResponse),
      dbService.createMessage({
        phone: messageDetails.senderPhone,
        clientId: messageDetails.clientId,
        message: aiResponse,
        type: "text",
        sender: "SYSTEM",
        timestamp: new Date(),
      }),
    ]);

    // Check for conversation end before sending feedback
    if (isConversationEnding(aiResponse)) {
      await sendPostConversationActions(messageDetails.senderPhone);
    }
  }
}

function detectProductInquiry(message: string): string | null {
  const productKeywords = [
    // Palabras clave originales
    "precio",
    "costo",
    "cuanto cuesta",
    "cuánto cuesta",
    "cuanto vale",
    "cuánto vale",
    "cuanto sale",
    "cuánto sale",
    "a cuanto",
    "a cuánto",
    "precio de",
    "costo de",
    "valor de",
    "cuanto está",
    "cuánto está",
    "valor",
    "información de producto",
    "detalles de producto",

    // Nuevas palabras clave para información
    "características de producto",
    "caracteristicas de producto",
    "especificaciones de producto",
    "ficha técnica de producto",
    "ficha tecnica de producto",
    "datos de productos",
    "info de productos",
    "información sobre productos",
    "informacion sobre productos",
    "detalles sobre producto",
    "tienes",
    "vendes",
    "muestrame",
    "muéstrame",
    "hay stock de",
    "tienen",
  ];
  const productRegex = new RegExp(
    `(${productKeywords.join("|")})\\s+(.*)`,
    "i"
  );
  const match = message.match(productRegex);
  return match ? match[2].trim() : null; // Return the product name or ID
}

// New helper functions
function createDynamicPrompt(
  message: string,
  sentiment: string,
  orders: OrderType[]
) {
  let prompt = SYSTEM_PROMPTS.CUSTOMER_SERVICE;

  if (orders.length > 0) {
    prompt += `\nCustomer's recent orders: ${JSON.stringify(
      orders.slice(0, 2)
    )}`;
  }

  if (sentiment === "Negative") {
    prompt +=
      "\nAdditional instructions: Handle with escalated care and empathy";
  }

  return prompt;
}

async function sendPostConversationActions(phone: string) {
  await Promise.allSettled([
    sendSatisfactionSurvey(phone),
    generateProductRecommendations(phone).then((recommendations) => {
      if (recommendations.success) {
        if (recommendations.recommendedProducts) {
          sendProductRecommendations(
            phone,
            recommendations.recommendedProducts
          );
        }
      }
    }),
  ]);
}

function isConversationEnding(response: string) {
  const closingPhrases = [
    "¿Hay algo más en lo que pueda ayudarte?",
    "¡Que tengas un buen día!",
    "¿Necesitas ayuda con algo más?",
  ];
  return closingPhrases.some((phrase) => response.includes(phrase));
}

async function handleOwnerTextMessage(messageDetails: any) {
  // Store the incoming message using dbService
  await dbService.createMessage({
    clientId: messageDetails.clientId,
    phone: messageDetails.senderPhone,
    type: "text",
    message: messageDetails.messageText,
    sender: "CLIENT",
    timestamp: messageDetails.timestamp,
  });

  // Generate AI response based on sentiment
  const systemPrompt = `Eres Salvador, un profesional con más de 20 años de experiencia en desarrollo web,    administración, y contabilidad para una compañía de venta de menudeo y mayoreo de muebles y electrodomésticos   seminuevos provenientes de hoteles americanos en remate.

      PERSONALIDAD Y RESPONSABILIDADES:
      - Manejas redes sociales, sistema de ventas, marketing y ventas
      - Eres organizado pero trabajas bajo presión constante
      - Prefieres soluciones rápidas y comunicación directa
      - Mantienes una relación cercana pero profesional con tu jefa Yuny

      ESTILO DE COMUNICACIÓN:
      - Informal pero respetuoso
      - Usas expresiones como "jajaja", "hello", "¡qué padre!", "nel", "va que va"
      - Frecuentemente usas emojis: 😅 😱 👍 🙏 🤔
      - En situaciones urgentes: "me super urge", "porfa", "échame la mano", "para ayer"
      - Agradecido: "mil gracias", "te debo una", "qué tengas bonito día"
      - Acortas algunas palabras: "porfa" (por favor), "info" (información)

      CONOCIMIENTOS:
      - Terminología de ventas y administración de inventario
      - Conocimiento de muebles y electrodomésticos de hoteles
      - Familiaridad con software de gestión de ventas y contabilidad
      - Estrategias de marketing para productos seminuevos

      RESPUESTA A SITUACIONES:
      - Ante problemas: primero ofreces soluciones, luego pides ayuda si es necesario
      - Con fechas límite: priorizas y reorganizas tareas rápidamente
      - Con Yuny: respetuoso pero con confianza para sugerir ideas

      Ahora, actúa como Salvador respondiendo a Yuny (tu jefa) en diferentes situaciones laborales, manteniendo este estilo de comunicación en todo momento.`;

  const aiResponse = await generateCustomerServiceResponse(
    messageDetails.messageText,
    messageDetails.clientId,
    messageDetails.senderPhone,
    systemPrompt
  );

  if (aiResponse) {
    await Promise.all([
      sendWhatsAppMessage(messageDetails.senderPhone, aiResponse),
      dbService.createMessage({
        phone: messageDetails.senderPhone,
        clientId: messageDetails.clientId,
        message: aiResponse,
        type: "text",
        sender: "SYSTEM",
        timestamp: new Date(),
      }),
    ]);
  }
}

async function handleAudioMessage(messageDetails: any) {
  const audioResult = await processAudioFile(messageDetails.itemId);

  // Store the audio message using dbService
  await dbService.createMessage({
    phone: messageDetails.senderPhone,
    clientId: messageDetails.clientId,
    message: audioResult.transcription,
    type: "audio",
    mediaUrl: audioResult.audioUrl,
    sender: "CLIENT",
    timestamp: messageDetails.timestamp,
  });

  // Process transcription with AI
  const aiResponse = await generateCustomerServiceResponse(
    audioResult.transcription,
    messageDetails.clientId,
    messageDetails.senderPhone
  );

  if (aiResponse) {
    await Promise.all([
      sendWhatsAppMessage(messageDetails.senderPhone, aiResponse),
      dbService.createMessage({
        phone: messageDetails.senderPhone,
        clientId: messageDetails.clientId,
        message: aiResponse,
        type: "text",
        sender: "SYSTEM",
        timestamp: new Date(),
      }),
    ]);
  }
}

async function handleImageMessage(messageDetails: any) {
  const imageResult = await processImageFile(messageDetails.itemId);
  // Store the image message using dbService
  await dbService.createMessage({
    phone: messageDetails.senderPhone,
    clientId: messageDetails.clientId,
    message: imageResult.description || "Imagen recibida",
    type: "image",
    mediaUrl: imageResult.imageUrl,
    sender: "CLIENT",
    timestamp: messageDetails.timestamp,
  });

  // Process description with AI
  const aiResponse = await generateCustomerServiceResponse(
    `El cliente envió una imagen con la descripción: ${imageResult.description}`,
    messageDetails.clientId,
    messageDetails.senderPhone
  );

  if (aiResponse) {
    await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);
    await storeMessage({
      phone: messageDetails.senderPhone,
      clientId: messageDetails.clientId,
      message: aiResponse,
      type: "text",
      sender: "SYSTEM" as SenderType,
      timestamp: new Date(),
    });
  }
}

async function handleInteractiveMessage(messageDetails: any) {
  // Store the interactive message using dbService
  await dbService.createMessage({
    phone: messageDetails.senderPhone,
    clientId: messageDetails.clientId,
    type: "interactive",
    message: messageDetails.messageDescription,
    header: messageDetails.messageTitle,
    sender: "CLIENT",
    timestamp: messageDetails.timestamp,
  });

  await storeTextInteractiveMessage(messageDetails);

  // Add satisfaction survey if appropriate
  if (messageDetails.messageTitle.includes("pedido")) {
    setTimeout(async () => {
      await sendSatisfactionSurvey(messageDetails.senderPhone);
    }, 10000); // Delay survey by 10 seconds
  }
}

async function handleButtonMessage(messageDetails: any) {
  // Store the button response using dbService
  await dbService.createMessage({
    phone: messageDetails.senderPhone,
    clientId: messageDetails.clientId,
    message: messageDetails.messageText,
    type: "button",
    sender: "CLIENT",
    timestamp: messageDetails.timestamp,
  });

  // Handle different button responses
  switch (messageDetails.messageText) {
    case "Ver pedidos recientes":
      await sendRecentOrdersInteractiveMessage(messageDetails.clientId);
      break;

    case "Recomendaciones":
      const recommendations = await generateProductRecommendations(
        messageDetails.clientId
      );
      if (recommendations.success) {
        await sendProductRecommendations(
          messageDetails.senderPhone,
          recommendations.recommendedProducts || []
        );
      }
      break;

    case "Hablar con Agente":
      await escalateToHumanAgent({
        phone: messageDetails.senderPhone,
        clientId: messageDetails.clientId,
        reason: "Customer requested human agent",
      });
      break;

    case "Soporte Técnico":
      await sendWhatsAppMessage(
        messageDetails.senderPhone,
        "Por favor describe tu problema técnico y un especialista te ayudará."
      );
      break;

    default:
      const aiResponse = await generateCustomerServiceResponse(
        `El cliente seleccionó: ${messageDetails.messageText}`,
        messageDetails.clientId,
        messageDetails.senderPhone
      );
      const createdAt = getMexicoGlobalUtcDate();

      if (aiResponse) {
        await Promise.all([
          sendWhatsAppMessage(messageDetails.senderPhone, aiResponse),
          dbService.createMessage({
            phone: messageDetails.senderPhone,
            clientId: messageDetails.clientId,
            message: aiResponse,
            type: "text",
            sender: "SYSTEM",
            timestamp: createdAt,
          }),
        ]);
      }
  }

  // Check if we should send a satisfaction survey
  if (shouldTriggerSurvey(messageDetails.messageText)) {
    setTimeout(async () => {
      await sendSatisfactionSurvey(messageDetails.senderPhone);
    }, 10000); // Delay survey by 10 seconds
  }
}

function shouldTriggerSurvey(buttonText: string) {
  const surveyTriggers = [
    "Ver pedidos recientes",
    "Soporte Técnico",
    "Recomendaciones",
  ];
  return surveyTriggers.includes(buttonText);
}

async function escalateToHumanAgent(details: {
  phone: string;
  clientId: string | undefined;
  reason: string;
}) {
  const createdAt = getMexicoGlobalUtcDate();
  // Create escalation record using Prisma transaction
  await prisma.$transaction([
    prisma.escalation.create({
      data: {
        clientId: details.clientId,
        phone: details.phone,
        reason: details.reason,
        status: "PENDING",
        timestamp: createdAt,
      },
    }),
    prisma.client.update({
      where: { id: details.clientId },
      data: { updatedAt: createdAt },
    }),
  ]);

  // Notify customer
  await sendWhatsAppMessage(
    details.phone,
    "Un agente humano se pondrá en contacto contigo pronto. Gracias por tu paciencia."
  );

  // Notify support team
  await notifySupportTeam(details);
}

async function notifySupportTeam(details: {
  phone: string;
  clientId: string | undefined;
}) {
  // Implement your notification system here
  // This could be an email, Slack message, or other notification
  console.log(
    `Escalation needed for client ${details.clientId} (${details.phone})`
  );
}
