using System;
using System.Linq;
using System.Threading.Tasks;
using CryptMessengerApi.Data;
using CryptMessengerApi.Helper;
using CryptMessengerApi.Models;
using Microsoft.AspNetCore.SignalR;

namespace CryptMessengerApi.Hubs
{
    public class ChatHub : Hub
    {
        public async Task JoinChat(UserConnection user)
        {
            user.ConnectionId = Context.ConnectionId;
            // Remove any existing user with the same username to avoid duplicates
            ClientSource.Clients.RemoveAll(u => u.Username == user.Username);
            // Add the user with public key to the central list
            ClientSource.Clients.Add(user);
            // Send the list of users (with their public keys) to the newly joined client
            await Clients.Caller.SendAsync(nameof(MethodNames.UserList), ClientSource.Clients);
            // Notify all clients about the new user
            await Clients.All.SendAsync(nameof(MethodNames.UserJoined), user);
        }

        public async Task SendMessage(UserConnection user, string message)
        {
            try
            {
                await Clients.All.SendAsync(nameof(MethodNames.ReceiveMessage), user, message);
                Console.WriteLine(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                throw;
            }
        }

        public async Task SendPrivateMessage(UserConnection user, string recipientUsername, string message)
        {
            // Expecting message already encrypted with the format iv:encryptedData
            var parts = message.Split(':');
            if (parts.Length == 2)
            {
                string ivBase64 = parts[0];
                string messageBase64 = parts[1];
                Console.WriteLine($"Received private message from {user.Username} to {recipientUsername}: {message}");

                // Find the recipient by username
                var recipient = ClientSource.Clients.FirstOrDefault(c => c.Username == recipientUsername);
                if (recipient != null)
                {
                    Console.WriteLine("Recipient ConnectionId: " + recipient.ConnectionId);
                    // Forward the encrypted message to the recipient only
                    await Clients.Client(recipient.ConnectionId)
                        .SendAsync(nameof(MethodNames.ReceivePrivateMessage), user, message);
                }
                else
                {
                    Console.WriteLine("Recipient not found");
                }
            }
            else
            {
                Console.WriteLine("Invalid message format");
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var user = ClientSource.Clients.FirstOrDefault(u => u.ConnectionId == Context.ConnectionId);
            if (user != null)
            {
                ClientSource.Clients.Remove(user);
                await Clients.All.SendAsync(nameof(MethodNames.UserLeft), user);
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}