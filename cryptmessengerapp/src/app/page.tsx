"use client";

import { useState, useEffect } from "react";
import {
  HubConnectionBuilder,
  LogLevel,
  HubConnection,
} from "@microsoft/signalr";
import Login from "../../components/login";
import {
  generateKey,
  encryptMessage,
  decryptMessage,
} from "../../utils/Cryption";
import { Message } from "../../models/Message";
import { UserConnection } from "../../models/UserConnection";
import { EncryptMessage } from "../../models/EncryptMessage";

export default function Home() {
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
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    generateKey().then(setEncryptionKey);
  }, []);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("Connected!");

          connection.on("ReceiveMessage", async (user, message) => {
            setMessages((messages) => [
              ...messages,
              { user: user.username, text: message },
            ]);
          });

          connection.on("SendPrivateMessage", async (EncryptMessage) => {
            if (encryptionKey) {
              const decryptedMessage = await decryptMessage(
                encryptionKey,
                EncryptMessage.IV,
                EncryptMessage.Message
              );
              setMessages((messages) => [
                ...messages,
                { user: EncryptMessage.username, text: decryptedMessage },
              ]);
            }
          });

          connection.on("UserJoined", (user) => {
            console.log("User joined:", user);
            setUsers((users) => {
              const updatedUsers = [...users, user];
              const uniqueUsers = Array.from(
                new Set(updatedUsers.map((u) => u.connectionId))
              ).map((id) => updatedUsers.find((u) => u.connectionId === id));
              return uniqueUsers;
            });
          });

          connection.on("UserLeft", (user) => {
            console.log("User left:", user);
            setUsers((users) =>
              users.filter((u) => u.connectionId !== user.connectionId)
            );
          });

          connection.on("UserList", (userList) => {
            console.log("User list:", userList);
            setUsers(userList);
          });
        })
        .catch((e) => console.log("Connection failed: ", e));
    }
  }, [connection, encryptionKey]);

  const handleSendMessage = async () => {
    if (input.trim() && connection && userConnection) {
      try {
        await connection.invoke("SendMessage", userConnection, input);
        setInput("");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSendPrivateMessage = async () => {
    if (
      privateInput.trim() &&
      privateRecipient.trim() &&
      connection &&
      userConnection &&
      encryptionKey
    ) {
      try {
        // Encrypt message
        const { iv, encrypted } = await encryptMessage(
          encryptionKey,
          privateInput
        );

        const recipient = users.find(
          (user) => user.username === privateRecipient
        );
        if (recipient) {
          const crypt: EncryptMessage = {
            ConnectionId: recipient.connectionId,
            UserName: privateRecipient,
            IV: iv,
            Message: encrypted,
          };

          console.log("Sending private message:", crypt);
          await connection.invoke("SendPrivateMessage", crypt);

          setPrivateInput("");
          setPrivateRecipient("");
        } else {
          console.error("Recipient not found");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLogin = async (username: string) => {
    setUsername(username);

    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5187/chat")
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);

    const userConnection: UserConnection = {
      connectionId: "", // This will be set by the server
      username: username,
    };

    setUserConnection(userConnection);

    newConnection.on("ReceiveMessage", async (user, message) => {
      setMessages((messages) => [
        ...messages,
        { user: user.username, text: message },
      ]);
    });

    newConnection.on("SendPrivateMessage", async (EncryptMessage) => {
      if (encryptionKey) {
        const decryptedMessage = await decryptMessage(
          encryptionKey,
          EncryptMessage.IV,
          EncryptMessage.Message
        );
        setMessages((messages) => [
          ...messages,
          { user: EncryptMessage.username, text: decryptedMessage },
        ]);
      }
    });

    newConnection.on("UserJoined", async (user) => {
      console.log("User joined:", user);
      setUsers((users) => {
        const updatedUsers = [...users, user];
        const uniqueUsers = Array.from(
          new Set(updatedUsers.map((u) => u.connectionId))
        ).map((id) => updatedUsers.find((u) => u.connectionId === id));
        return uniqueUsers;
      });
    });

    newConnection.on("UserLeft", async (user) => {
      console.log("User left:", user);
      setUsers((users) =>
        users.filter((u) => u.connectionId !== user.connectionId)
      );
    });

    newConnection.on("UserList", async (userList) => {
      console.log("User list:", userList);
      setUsers(userList);
    });

    await newConnection.start();
    await newConnection.invoke("JoinChat", userConnection);
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
        <h1 className="text-2xl font-bold mb-4">Chat App</h1>
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
