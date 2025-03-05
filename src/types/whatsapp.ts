import { MessageStatus, SenderType } from "@prisma/client";

export type whatsAppMessagesType = {
  id: string;
  clientId: string;
  phone: string;
  message: string;
  template: string | null;
  header: string | null;
  footer: string | null;
  button: string | null;
  variables: string[] | null;
  type: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
  sender: SenderType;
  timestamp: Date;
  mediaUrl: string | null;
};
