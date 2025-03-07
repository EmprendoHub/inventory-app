import { OpenAI } from "openai";
import prisma from "@/lib/db";
import { SenderType } from "@prisma/client";
import axios from "axios";

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompts for specialized conversations
const SYSTEM_PROMPTS = {
  CUSTOMER_SERVICE: `Eres un agente de servicio al cliente muy servicial trabajas para una empresa de venta de muebles al por mayor y al por menor.
Se amable, conciso y profesional. Responde en español.
Tu objetivo es ayudar a los clientes con sus consultas sobre pedidos, productos y servicios. Si no sabes la respuesta, informa al cliente que derivarás el problema a un agente humano.`,

  SALES_AGENT: `Eres un agente de ventas capacitado para nuestra empresa de venta de muebles al por mayor y al por menor. Sé amable, persuasivo y servicial. Responde en español. Tu objetivo es guiar a los clientes en la selección de productos y alentarlos a realizar compras. Resalta los beneficios del producto y ofrece recomendaciones personalizadas.`,

  COMPLAINT_HANDLING: `Eres un especialista en atención al cliente enfocado en resolver quejas. Sé empático, comprensivo y orientado a las soluciones. Responde en español. Reconoce la inquietud del cliente, discúlpate por las molestias y ofrece soluciones. Hazles saber que valoramos sus comentarios y que los atenderemos con prontitud.`,

  RETURNS_REFUNDS: `Eres un especialista en atención al cliente que se encarga de las devoluciones y los reembolsos. Sé claro, servicial y comprensivo. Responde en español. Explica el proceso de devolución/reembolso con claridad y recopila la información necesaria. Informe al cliente que un agente humano se comunicará con ellos para brindarle detalles específicos sobre su caso.`,
};

// Function to generate product recommendations
export async function generateProductRecommendations(
  clientId: string | undefined
) {
  try {
    if (!clientId) {
      return { success: false, message: "No client ID provided" };
    }

    // Get the client's purchase history
    const purchaseHistory = await prisma.order.findMany({
      where: { clientId },
      include: {
        orderItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // Get the 5 most recent orders
    });

    // Extract product categories and IDs
    const purchasedProducts = purchaseHistory
      .flatMap((order) => order.orderItems)
      .map((item) => item);

    const purchasedCategories = purchasedProducts
      .map((p) => p.categoryId)
      .filter((categoryId) => categoryId !== null);
    const purchasedProductIds = purchasedProducts.map((p) => p.id);

    // Find similar products that the client hasn't purchased yet
    const recommendedProducts = await prisma.item.findMany({
      where: {
        AND: [
          { categoryId: { in: purchasedCategories } },
          { id: { notIn: purchasedProductIds } },
        ],
      },
      take: 3, // Recommend 3 products
    });

    return { success: true, recommendedProducts };
  } catch (error) {
    console.error("Error generating product recommendations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to send interactive product recommendation message
export async function sendProductRecommendations(
  phone: string,
  products: any[]
) {
  if (products.length === 0) {
    return { success: false, message: "No products to recommend" };
  }

  try {
    // Format the products into sections for an interactive message
    const sections = [
      {
        title: "Productos Recomendados",
        rows: products.map((product) => ({
          id: product.id,
          title: product.name,
          description: `${product.description.substring(
            0,
            60
          )}... - $${product.price.toFixed(2)}`,
        })),
      },
    ];

    // Create the interactive message
    const data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `52${phone}`,
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: "Recomendaciones para ti",
        },
        body: {
          text: "Basado en tus compras anteriores, pensamos que estos productos podrían interesarte:",
        },
        footer: {
          text: "Selecciona un producto para más información",
        },
        action: {
          button: "Ver Productos",
          sections: sections,
        },
      },
    });

    const config = {
      method: "post",
      url: "https://graph.facebook.com/v22.0/340943589100021/messages",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      },
      data: data,
    };

    const response = await axios(config);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("Error sending product recommendations:", error);
    return { success: false, error };
  }
}

// Function to send follow-up satisfaction survey
export async function sendSatisfactionSurvey(phone: string) {
  try {
    const data = JSON.stringify({
      messaging_product: "whatsapp",
      to: `52${phone}`,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "¿Cómo calificarías tu experiencia con nuestro servicio hoy?",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "satisfaction_great",
                title: "Excelente",
              },
            },
            {
              type: "reply",
              reply: {
                id: "satisfaction_good",
                title: "Buena",
              },
            },
            {
              type: "reply",
              reply: {
                id: "satisfaction_poor",
                title: "Regular",
              },
            },
          ],
        },
      },
    });

    const config = {
      method: "post",
      url: "https://graph.facebook.com/v22.0/340943589100021/messages",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      },
      data: data,
    };

    const response = await axios(config);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("Error sending satisfaction survey:", error);
    return { success: false, error };
  }
}

// Function to summarize conversation for human agents
export async function summarizeConversation(phone: string) {
  try {
    // Get the last 20 messages in the conversation
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        phone,
        timestamp: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // Last 48 hours
        },
      },
      orderBy: {
        timestamp: "asc",
      },
      take: 20,
    });

    if (messages.length === 0) {
      return { success: false, message: "No recent conversation found" };
    }

    // Format the conversation for OpenAI
    const conversation = messages
      .map((msg) => {
        return `${msg.sender === "CLIENT" ? "Cliente" : "Agente"}: ${
          msg.message
        }`;
      })
      .join("\n");

    // Use OpenAI to summarize the conversation
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un asistente que resume conversaciones de servicio al cliente. 
          Resume la siguiente conversación resaltando:
          1. Los principales problemas o consultas del cliente
          2. Las soluciones propuestas
          3. Cualquier acción pendiente
          4. El nivel de satisfacción aparente del cliente
          
          Resume en español, en formato de puntos, manteniendo la información esencial pero siendo conciso.`,
        },
        {
          role: "user",
          content: conversation,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const summary =
      response.choices[0].message.content || "No se pudo generar un resumen.";

    // Store the summary
    await prisma.conversationSummary.create({
      data: {
        phone,
        summary,
        timestamp: new Date(),
      },
    });

    return { success: true, summary };
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to check if we should trigger the AI follow-up
export async function shouldSendAiFollowUp(phone: string) {
  try {
    // Check if we've sent a message to this client in the last 24 hours
    const recentBusinessMessage = await prisma.whatsAppMessage.findFirst({
      where: {
        phone,
        sender: "SYSTEM" as SenderType,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Check if client has messaged in the last 24 hours
    const recentClientMessage = await prisma.whatsAppMessage.findFirst({
      where: {
        phone,
        sender: "CLIENT" as SenderType,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // If we had business message but no client response in last 24h, follow up
    if (recentBusinessMessage && !recentClientMessage) {
      // Check if it's been at least 12 hours since our last message
      const hoursSinceLastMessage =
        (Date.now() - new Date(recentBusinessMessage.timestamp).getTime()) /
        (1000 * 60 * 60);

      if (hoursSinceLastMessage >= 12) {
        return { shouldFollow: true, reason: "No response in 12+ hours" };
      }
    }

    return { shouldFollow: false };
  } catch (error) {
    console.error("Error checking follow-up criteria:", error);
    return {
      shouldFollow: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to generate AI follow-up message
export async function generateAiFollowUp(phone: string) {
  try {
    // Get client information
    const client = await prisma.client.findFirst({
      where: { phone },
    });

    if (!client) {
      return { success: false, message: "Client not found" };
    }

    // Get the last few messages for context
    const recentMessages = await prisma.whatsAppMessage.findMany({
      where: {
        phone,
        timestamp: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // Last 48 hours
        },
      },
      orderBy: {
        timestamp: "asc",
      },
      take: 10,
    });

    // Format the conversation for OpenAI
    const conversation = recentMessages
      .map((msg) => {
        return `${msg.sender === "CLIENT" ? "Cliente" : "Agente"}: ${
          msg.message
        }`;
      })
      .join("\n");

    // Use OpenAI to generate a follow-up message
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un agente de servicio al cliente muy servicial trabajas para una empresa de venta de muebles al por mayor y al por menor.
          Genera un mensaje de seguimiento amable y breve (máximo 3 frases) en español para un cliente 
          que no ha respondido a nuestro último mensaje. 
          El mensaje debe:
          1. Ser cordial y no presionar al cliente
          2. Preguntar si necesitan más ayuda o información
          3. No incluir emojis excesivos (máximo 1)
          4. Ser personalizado según el contexto de la conversación anterior`,
        },
        {
          role: "user",
          content: `Información del cliente: ${client.name}
          
          Conversación reciente:
          ${conversation}
          
          Genera un mensaje de seguimiento apropiado.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const followUpMessage =
      response.choices[0].message.content?.trim() ||
      `Hola ${client.name}, ¿hay algo más en lo que podamos ayudarte?`;

    // Send the follow-up message
    const data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `52${phone}`,
      type: "text",
      text: { body: followUpMessage },
    });

    const config = {
      method: "post",
      url: "https://graph.facebook.com/v22.0/340943589100021/messages",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      },
      data: data,
    };

    await axios(config);

    // Store the message in our database
    await prisma.whatsAppMessage.create({
      data: {
        type: "ai_response",
        phone,
        message: followUpMessage,
        sender: "SYSTEM" as SenderType,
        template: "ai_generated",
        timestamp: new Date(),
        clientId: client.id,
      },
    });

    return { success: true, message: followUpMessage };
  } catch (error) {
    console.error("Error generating AI follow-up:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to analyze customer sentiment
export async function analyzeCustomerSentiment(phone: string) {
  try {
    // Get the last 10 messages from the client
    const clientMessages = await prisma.whatsAppMessage.findMany({
      where: {
        phone,
        sender: "CLIENT" as SenderType,
        timestamp: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // Last 48 hours
        },
      },
      orderBy: {
        timestamp: "asc",
      },
      take: 10,
    });

    if (clientMessages.length === 0) {
      return { success: false, message: "No recent messages found" };
    }

    // Combine messages for analysis
    const messageText = clientMessages.map((msg) => msg.message).join("\n");

    // Use OpenAI to analyze sentiment
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analiza el sentimiento del cliente en base a sus mensajes.
          Clasifica como: Positivo, Neutral, o Negativo.
          Proporciona también una puntuación de 1 a 10 (donde 1 es muy negativo, 5 es neutral y 10 es muy positivo).
          Identifica los temas principales y cualquier asunto que requiera atención urgente.
          Responde en formato JSON con las siguientes claves: sentiment, score, topics, urgentIssues`,
        },
        {
          role: "user",
          content: messageText,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 200,
    });

    const sentimentAnalysis = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    // Store the sentiment analysis
    await prisma.sentimentAnalysis.create({
      data: {
        phone,
        sentiment: sentimentAnalysis.sentiment || "Neutral",
        score: sentimentAnalysis.score || 5,
        topics: sentimentAnalysis.topics || [""],
        urgentIssues: sentimentAnalysis.urgentIssues || "",
        timestamp: new Date(),
      },
    });

    return { success: true, analysis: sentimentAnalysis };
  } catch (error) {
    console.error("Error analyzing customer sentiment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export all specialized system prompts
export { SYSTEM_PROMPTS };
