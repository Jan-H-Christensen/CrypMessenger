"use client";

import { useState, useEffect } from "react";
import {
  HubConnectionBuilder,
  LogLevel,
  HubConnection,
} from "@microsoft/signalr";
import Login from "../../components/login";
// Import RSA-OAEP helper functions
import {
  generateKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  importPublicKey,
} from "../../utils/Cryption";
import { Message } from "../../models/Message";
import { UserConnection } from "../../models/UserConnection";

export default function Home() {
  // State declarations
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [privateInput, setPrivateInput] = useState("");
  const [privateRecipient, setPrivateRecipient] = useState("");
  const [username, setUsername] = useState("");
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [userConnection, setUserConnection] = useState<UserConnection | null>(
    null
  );
  const [users, setUsers] = useState<UserConnection[]>([]);
  // RSA keys: hold the private key here and the exported public key as Base64
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [publicKeyBase64, setPublicKeyBase64] = useState<string>("");

  // On login, generate key pair and send public key to server
  const handleLogin = async (username: string) => {
    setUsername(username);
    const { publicKey, privateKey } = await generateKeyPair();
    setPrivateKey(privateKey);
    // Export public key as Base64 (using spki)
    const exported = await crypto.subtle.exportKey("spki", publicKey);
    const publicKeyStr = arrayBufferToBase64(exported);
    setPublicKeyBase64(publicKeyStr);

    // Create connection
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5187/chat")
      .configureLogging(LogLevel.Information)
      .build();
    setConnection(newConnection);

    // Create user object that includes the public key
    const userConn: UserConnection = {
      connectionId: "", // will be set by the server
      username: username,
      publicKey: publicKeyStr,
    };
    setUserConnection(userConn);

    newConnection.on("ReceiveMessage", (user, message) => {
      setMessages((msgs) => [...msgs, { user: user.username, text: message }]);
    });

    // When receiving a private message, decrypt it using our private key
    newConnection.on("ReceivePrivateMessage", async (user, message) => {
      try {
        if (privateKey) {
          // The message here is sent as a Base64 string (format depends on your encryption method)
          console.log("Received message:", message);
          const parts = message.split(":");
          console.log("IV part:", parts[0], "Encrypted part:", parts[1]);

          if (parts.length === 2) {
            const ivBase64 = parts[0];
            const encryptedBase64 = parts[1];
            const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);
            const decryptedMessage = await decryptWithPrivateKey(
              privateKey,
              encryptedBuffer
            );
            setMessages((msgs) => [
              ...msgs,
              { user: user.username, text: decryptedMessage },
            ]);
          } else {
            console.error("Invalid message format");
          }
        } else {
          console.error("Private key not available");
        }
      } catch (error) {
        console.error("Error decrypting message:", error);
      }
    });

    // When receiving the user list, expect each user to include their public key
    newConnection.on("UserList", (userList) => {
      setUsers(userList);
    });

    newConnection.on("UserJoined", (user) => {
      console.log("User joined:", user);
      setUsers((currentUsers) => {
        const updatedUsers = [...currentUsers, user];
        // Ensure uniqueness by connectionId
        return Array.from(new Set(updatedUsers.map((u) => u.connectionId))).map(
          (id) => updatedUsers.find((u) => u.connectionId === id)!
        );
      });
    });

    newConnection.on("UserLeft", (user) => {
      console.log("User left:", user);
      setUsers((currentUsers) =>
        currentUsers.filter((u) => u.connectionId !== user.connectionId)
      );
    });

    try {
      await newConnection.start();
      // Send JoinChat; the server will store our public key along with our user info
      await newConnection.invoke("JoinChat", userConn);
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  // Send a regular (unencrypted) message
  const handleSendMessage = async () => {
    if (input.trim() && connection && userConnection) {
      try {
        await connection.invoke("SendMessage", userConnection, input);
        setInput("");
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Send a private message using the recipient's public key
  const handleSendPrivateMessage = async () => {
    if (
      privateInput.trim() &&
      privateRecipient.trim() &&
      connection &&
      userConnection
    ) {
      try {
        // Find recipient in the user list (should include their public key)
        const recipient = users.find((u) => u.username === privateRecipient);
        if (recipient && recipient.publicKey) {
          // Import the recipient's public key
          const importedPublicKey = await importPublicKey(recipient.publicKey);
          // Encrypt the private message with the recipient's public key
          const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate a random IV
          const encryptedBuffer = await encryptWithPublicKey(
            importedPublicKey,
            privateInput
          );
          const encryptedBase64 = arrayBufferToBase64(encryptedBuffer);
          const ivBase64 = arrayBufferToBase64(iv.buffer);

          // Format the message as iv:encryptedMessage
          const formattedMessage = `${ivBase64}:${encryptedBase64}`;

          console.log("Sending private message (encrypted):", formattedMessage);
          await connection.invoke(
            "SendPrivateMessage",
            userConnection,
            privateRecipient,
            formattedMessage
          );

          setPrivateInput("");
          setPrivateRecipient("");
        } else {
          console.error("Recipient not found or missing public key");
        }
      } catch (error) {
        console.error("Error sending private message:", error);
      }
    }
  };

  if (!username) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-1/4 border-r p-4">
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <ul>
          {users.map((user) => (
            <li
              key={user.connectionId}
              className="mb-2 bg-gray-200 p-2 text-black"
              onClick={() => setPrivateRecipient(user.username)}
            >
              {user.username}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 flex flex-col items-center justify-between p-24">
        <h1 className="text-2xl font-bold mb-4">Chat App user: {username}</h1>
        <div className="flex flex-col w-full max-w-md border rounded-lg p-4">
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className="mb-2 p-2 bg-gray-100 text-black rounded"
              >
                <strong>{msg.user}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 border rounded-l"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSendMessage}
              className="p-2 bg-green-500 text-white rounded-r"
            >
              Send
            </button>
          </div>
          <div className="flex mt-4">
            <input
              type="text"
              value={privateRecipient}
              onChange={(e) => setPrivateRecipient(e.target.value)}
              className="flex-1 p-2 border rounded-l"
              placeholder="Private recipient username"
            />
          </div>
          <div className="flex mt-4">
            <input
              type="text"
              value={privateInput}
              onChange={(e) => setPrivateInput(e.target.value)}
              className="flex-1 p-2 border rounded-l"
              placeholder="Type your private message..."
            />
            <button
              onClick={handleSendPrivateMessage}
              className="p-2 bg-blue-500 text-white rounded-r"
            >
              Send Private
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
