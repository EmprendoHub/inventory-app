import MessageForm from "./_components/MessageForm";
import TemplateMessage from "./_components/TemplateMessage";
import React from "react";

export default function BulkEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center  bg-background">
      <TemplateMessage />
      <br />
      <div className="border border-1 shadow-lg p-8 maxmd:px-1 rounded-lg w-full h-full">
        <MessageForm />
      </div>
    </div>
  );
}
