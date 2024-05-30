"use client";
import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { CornerDownLeft, Settings, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProductList from "./productlist";
import ChatMessage from "./chatmessage";

export function Chat() {
  const [messages, setMessages] = useState([
    { content: "No Discussion Selected , Please Select a conversation", avatarSrc: "/placeholder-user.jpg", isUser: false },
  ]);

  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  useEffect(() => {
    if (selectedProduct){
    const token = localStorage.getItem("token");
    const socketConnection = io("http://localhost:3000", {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    setSocket(socketConnection);
    const conversationId = selectedProduct.conversationId
    socketConnection.on("connect", () => {
      console.log("Connected to the server");
      console.log(conversationId)
      socketConnection.emit("joinConversation", JSON.stringify({ conversationId }));
    });

    socketConnection.on("joined", (event) => {
      console.log(event);
    });

    socketConnection.on("message", (message) => {
      console.log("Received message:", message);
      const messageFormat = {
        content: message.content,
        avatarSrc: "/placeholder-user.jpg",
        isUser: message.sender ==false,
      };
      setMessages((prevMessages) => [...prevMessages, messageFormat]);
    });

    socketConnection.on("disconnect", () => {
      console.log("Disconnected from the server");
    });
    
    return () => {
      socketConnection.disconnect();
    };
  }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      fetch(`http://localhost:3000/conversation/messages/${selectedProduct.conversationId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        const formattedMessages = data.messages.map((msg : any) => ({
          content: msg.content,
          avatarSrc: "/placeholder-user.jpg",
          isUser: msg.sender == false,
        }));
        setMessages(formattedMessages);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    }
  }, [selectedProduct]);

  const handleSubmit = (e: any) => {
    e.preventDefault()
    console.log(message.trim() !== "", socket)
    if (message.trim() !== "" && socket) {
      const messageDto = {
        content: message,
        conversationId: selectedProduct.conversationId,
      };
      socket.emit("sendMessage", JSON.stringify(messageDto));
      setMessage("");
    }
  };

  return (
    <div className="grid h-screen w-full pl-[56px]">
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
          <h1 className="text-xl font-semibold">Playground</h1>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Settings className="size-4" aria-placeholder="Products" />
                <span className="sr-only">Products</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
              <DrawerHeader>
                <DrawerTitle>Configuration</DrawerTitle>
                <DrawerDescription>
                  Configure the settings for the model and messages.
                </DrawerDescription>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5 text-sm"
          >
            <Share className="size-3.5" />
            Share
          </Button>
        </header>
        <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            className="relative hidden flex-col items-start gap-8 md:flex"
            x-chunk="dashboard-03-chunk-0"
          >
            <form className="grid w-full items-start gap-6">
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Products
                </legend>
                <div className="grid gap-3">
                  <ProductList selectedProduct={selectedProduct} onSelectProduct={setSelectedProduct} />
                </div>
              </fieldset>
            </form>
          </div>
          <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2">
            <div className="flex-1">
              <div className="flex-1 flex flex-col justify-end gap-4 p-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    text={message.content}
                    avatarSrc={message.avatarSrc}
                    isUser={message.isUser}
                  />
                ))}
              </div>
            </div>
            <form
              className="relative overflow-hidden rounded-lg border bg-background"
              onSubmit={handleSubmit}
            >
              <Label htmlFor="message" className="sr-only">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
              />
              <div className="flex items-center p-3 pt-0">
                <Button
                  type="submit"
                  size="sm"
                  className="ml-auto gap-1.5"
                  onSubmit={handleSubmit}
                >
                  Send Message
                  <CornerDownLeft className="size-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
