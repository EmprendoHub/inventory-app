import {
  sendRecentOrdersInteractiveMessage,
  uploadToBucket,
} from "@/app/_actions";
import prisma from "@/lib/db";
import { SenderType } from "@prisma/client";
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

const FACEBOOK_VERIFY_TOKEN = process.env.FB_WEBHOOKTOKEN;

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
    console.log(client);
  }

  if (event.messages) {
    console.log("PROCESS contacts", event.contacts[0]);
    console.log("PROCESS messages", event.messages[0]);

    const WAPhone = event.contacts[0].wa_id.replace(/^521/, "");
    const client = await prisma.client.findFirst({
      where: { phone: WAPhone },
    });

    try {
      // ... existing message processing setup
      const timestamp = new Date(parseInt(event.messages[0].timestamp) * 1000);
      const senderPhone = WAPhone;
      const senderName = event.contacts[0].profile.name;
      const clientId = client?.id;
      const messageType = event.messages[0].type;

      // Add sentiment analysis
      const sentimentAnalysis = await analyzeCustomerSentiment(senderPhone);

      // Process different message types
      switch (messageType) {
        case "text":
          await handleTextMessage({
            senderPhone,
            clientId,
            timestamp,
            messageText: event.messages[0].text.body,
            senderName,
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

      // Check if we should send a follow-up
      const followUpCheck = await shouldSendAiFollowUp(senderPhone);
      if (followUpCheck.shouldFollow) {
        await generateAiFollowUp(senderPhone);
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

// Update the store functions to handle AI-processed content
// async function storeAudioResponseMessage(messageDetails: any) {
//   const audioResult = await processAudioFile(messageDetails.itemId);

//   // Generate AI response based on transcription
//   const aiResponse = await generateCustomerServiceResponse(
//     audioResult.transcription,
//     messageDetails.clientId,
//     messageDetails.senderPhone
//   );

//   const newWAMessage = await prisma.whatsAppMessage.create({
//     data: {
//       clientId: messageDetails.clientId,
//       phone: messageDetails.senderPhone,
//       type: "audio",
//       mediaUrl: audioResult.audioUrl,
//       message: audioResult.transcription || "Audio recibido",
//       sender: "CLIENT" as SenderType,
//       timestamp: messageDetails.timestamp,
//     },
//   });

//   console.log("Audio Message stored:", newWAMessage);

//   if (aiResponse) {
//     // Send AI response
//     await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);

//     // Store AI response
//     await prisma.whatsAppMessage.create({
//       data: {
//         clientId: messageDetails.clientId,
//         phone: messageDetails.senderPhone,
//         type: "text",
//         message: aiResponse,
//         sender: "SYSTEM" as SenderType,
//         timestamp: new Date(),
//       },
//     });
//   }
// }

// async function storeImageResponseMessage(messageDetails: any) {
//   const imageResult = await processImageFile(messageDetails.itemId);

//   // Generate AI response based on image description
//   const aiResponse = await generateCustomerServiceResponse(
//     `El cliente envió una imagen con la descripción: ${imageResult.description}`,
//     messageDetails.clientId,
//     messageDetails.senderPhone
//   );

//   const newWAMessage = await prisma.whatsAppMessage.create({
//     data: {
//       clientId: messageDetails.clientId,
//       phone: messageDetails.senderPhone,
//       type: "image",
//       mediaUrl: imageResult.imageUrl,
//       message: imageResult.description || messageDetails.messageText,
//       sender: "CLIENT" as SenderType,
//       timestamp: messageDetails.timestamp,
//     },
//   });

//   console.log("Image Message stored:", newWAMessage);

//   if (aiResponse) {
//     // Send AI response
//     await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);

//     // Store AI response
//     await prisma.whatsAppMessage.create({
//       data: {
//         clientId: messageDetails.clientId,
//         phone: messageDetails.senderPhone,
//         type: "text",
//         message: aiResponse,
//         sender: "SYSTEM" as SenderType,
//         timestamp: new Date(),
//       },
//     });
//   }
// }

// Store message (stub implementation)
async function storeTextMessage(messageDetails: any) {
  // First store the incoming message
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "text",
      message: messageDetails.messageText,
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  console.log("Text Message stored:", newWAMessage);

  // Generate AI response
  const aiResponse = await generateCustomerServiceResponse(
    messageDetails.messageText,
    messageDetails.clientId,
    messageDetails.senderPhone
  );

  if (aiResponse) {
    // Send AI response
    await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);

    // Store AI response
    await prisma.whatsAppMessage.create({
      data: {
        clientId: messageDetails.clientId,
        phone: messageDetails.senderPhone,
        type: "text",
        message: aiResponse,
        sender: "SYSTEM" as SenderType,
        timestamp: new Date(),
      },
    });
  }
}

// async function storeTextInteractiveMessage(messageDetails: any) {
//   // typing on
//   const data = JSON.stringify({
//     messaging_product: "whatsapp",
//     to: `52${messageDetails.senderPhone}`,
//     type: "text",
//     text: {
//       body: "Estamos procesando tu solicitud...",
//     },
//   });

//   const config = {
//     method: "post",
//     url: "https://graph.facebook.com/v22.0/340943589100021/messages",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
//     },
//     data: data,
//   };

//   await axios(config);

//   const response = await processPdfFile(messageDetails.orderId);
//   if (response.success) {
//     const newWAMessage = await prisma.whatsAppMessage.create({
//       data: {
//         clientId: messageDetails.clientId,
//         phone: messageDetails.senderPhone,
//         type: "interactive",
//         header: messageDetails.messageTitle,
//         message: messageDetails.messageDescription,
//         mediaUrl: response.pdfUrl,
//         sender: "CLIENT" as SenderType,
//         timestamp: messageDetails.timestamp,
//       },
//     });

//     await sendWATemplateOrderPdfMessage(
//       messageDetails.orderId,
//       response.pdfUrl
//     );
//     console.log("PDF Message stored:", newWAMessage);
//   }
// }

// async function storeButtonResponseMessage(messageDetails: any) {
//   const newWAMessage = await prisma.whatsAppMessage.create({
//     data: {
//       clientId: messageDetails.clientId,
//       phone: messageDetails.senderPhone,
//       type: "button",
//       message: messageDetails.messageText,
//       sender: "CLIENT" as SenderType,
//       timestamp: messageDetails.timestamp,
//     },
//   });

//   if (messageDetails.messageText === "Ver Pedido") {
//     // send last 3 orders as options
//     await sendRecentOrdersInteractiveMessage(messageDetails.clientId);
//   }

//   console.log("Button Message stored:", newWAMessage);
// }

// async function processPdfFile(orderId: string) {
//   try {
//     // Step 1: Fetch pdf order receipt
//     const url = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/factura/${orderId}`;
//     const response = await fetch(url);

//     if (!response.ok) {
//       throw new Error(`Failed to fetch PDF: ${response.statusText}`);
//     }

//     // Step 2: Get the PDF buffer from the response
//     const pdfBuffer = await response.arrayBuffer();

//     // Step 3: Generate a unique filename and save the PDF to a temporary file
//     const newFilename = `${orderId}.pdf`;
//     const filePath = join("/", "tmp", newFilename);

//     fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

//     // Step 4: Upload the file to the bucket
//     await uploadToBucket("inventario", "pdf/" + newFilename, filePath);
//     console.log("File uploaded to bucket");

//     // Step 5: Return the public URL of the uploaded PDF
//     const pdfUrl = `${process.env.MINIO_URL}pdf/${newFilename}`;
//     return { success: true, pdfUrl };
//   } catch (error) {
//     console.error("Error in processPdfFile:", error);
//     throw error; // Re-throw the error for further handling
//   }
// }

async function handleTextMessage(messageDetails: any) {
  // Store the incoming message
  await storeTextMessage(messageDetails);

  // Generate AI response based on sentiment
  const systemPrompt = selectSystemPrompt(
    messageDetails.messageText,
    messageDetails.sentiment
  );
  const aiResponse = await generateCustomerServiceResponse(
    messageDetails.messageText,
    messageDetails.clientId,
    messageDetails.senderPhone,
    systemPrompt
  );

  if (aiResponse) {
    await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);
    await storeMessage({
      phone: messageDetails.senderPhone,
      clientId: messageDetails.clientId,
      message: aiResponse,
      type: "text",
      sender: "ASSISTANT" as SenderType,
      timestamp: new Date(),
    });

    // Send product recommendations if appropriate
    if (shouldOfferRecommendations(messageDetails.messageText)) {
      const recommendations = await generateProductRecommendations(
        messageDetails.clientId
      );
      if (recommendations.success) {
        if (recommendations.recommendedProducts) {
          await sendProductRecommendations(
            messageDetails.senderPhone,
            recommendations.recommendedProducts
          );
        }
      }
    }
  }
}

async function handleAudioMessage(messageDetails: any) {
  const audioResult = await processAudioFile(messageDetails.itemId);

  // Store the audio message
  await storeMessage({
    phone: messageDetails.senderPhone,
    clientId: messageDetails.clientId,
    message: audioResult.transcription,
    type: "audio",
    mediaUrl: audioResult.audioUrl,
    sender: "CLIENT" as SenderType,
    timestamp: messageDetails.timestamp,
  });

  // Process transcription with AI
  const aiResponse = await generateCustomerServiceResponse(
    audioResult.transcription,
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
      sender: "ASSISTANT" as SenderType,
      timestamp: new Date(),
    });
  }
}

async function handleImageMessage(messageDetails: any) {
  const imageResult = await processImageFile(messageDetails.itemId);

  // Store the image message
  await storeMessage({
    phone: messageDetails.senderPhone,
    clientId: messageDetails.clientId,
    message: imageResult.description,
    type: "image",
    mediaUrl: imageResult.imageUrl,
    sender: "CLIENT" as SenderType,
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
      sender: "ASSISTANT" as SenderType,
      timestamp: new Date(),
    });
  }
}

async function handleInteractiveMessage(messageDetails: any) {
  // ... existing interactive message handling
  // Add satisfaction survey if appropriate
  if (messageDetails.messageTitle.includes("pedido")) {
    await sendSatisfactionSurvey(messageDetails.senderPhone);
  }
}

function selectSystemPrompt(message: string, sentiment: string) {
  if (sentiment === "Negative") return SYSTEM_PROMPTS.COMPLAINT_HANDLING;
  if (message.includes("devolución")) return SYSTEM_PROMPTS.RETURNS_REFUNDS;
  if (message.includes("comprar")) return SYSTEM_PROMPTS.SALES_AGENT;
  return SYSTEM_PROMPTS.CUSTOMER_SERVICE;
}

function shouldOfferRecommendations(message: string) {
  const keywords = ["recomendar", "sugerir", "nuevo", "comprar"];
  return keywords.some((keyword) => message.toLowerCase().includes(keyword));
}

async function handleButtonMessage(messageDetails: any) {
  // Store the button response
  await storeMessage({
    phone: messageDetails.senderPhone,
    clientId: messageDetails.clientId,
    message: messageDetails.messageText,
    type: "button",
    sender: "CLIENT" as SenderType,
    timestamp: messageDetails.timestamp,
  });

  // Handle different button responses
  switch (messageDetails.messageText) {
    case "Ver Pedido":
      // Send recent orders as interactive message
      await sendRecentOrdersInteractiveMessage(messageDetails.clientId);
      break;

    case "Recomendaciones":
      // Generate and send product recommendations
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
      // Escalate to human agent
      await escalateToHumanAgent({
        phone: messageDetails.senderPhone,
        clientId: messageDetails.clientId,
        reason: "Customer requested human agent",
      });
      break;

    case "Soporte Técnico":
      // Initiate technical support flow
      await sendWhatsAppMessage(
        messageDetails.senderPhone,
        "Por favor describe tu problema técnico y un especialista te ayudará."
      );
      break;

    default:
      // Handle generic button responses with AI
      const aiResponse = await generateCustomerServiceResponse(
        `El cliente seleccionó: ${messageDetails.messageText}`,
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
          sender: "ASSISTANT" as SenderType,
          timestamp: new Date(),
        });
      }
  }

  // Check if we should send a satisfaction survey
  if (shouldTriggerSurvey(messageDetails.messageText)) {
    await sendSatisfactionSurvey(messageDetails.senderPhone);
  }
}

function shouldTriggerSurvey(buttonText: string) {
  const surveyTriggers = ["Ver Pedido", "Soporte Técnico", "Recomendaciones"];
  return surveyTriggers.includes(buttonText);
}

async function escalateToHumanAgent(details: {
  phone: string;
  clientId: string | undefined;
  reason: string;
}) {
  // Create escalation record
  await prisma.escalation.create({
    data: {
      clientId: details.clientId,
      phone: details.phone,
      reason: details.reason,
      status: "PENDING",
      timestamp: new Date(),
    },
  });

  // Notify customer
  await sendWhatsAppMessage(
    details.phone,
    "Un agente humano se pondrá en contacto contigo pronto. Gracias por tu paciencia."
  );

  // Notify support team (implementation depends on your notification system)
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
