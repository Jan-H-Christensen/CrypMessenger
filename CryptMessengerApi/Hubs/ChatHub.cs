using System;
using System.Collections.Generic;
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
        // public static List<UserConnection> Users = new List<UserConnection>();

        public async Task JoinChat(UserConnection user)
        {
            user.ConnectionId = Context.ConnectionId;

            ClientSource.Clients.Add(user);
            // Send the list of users to the newly joined user
            await Clients.Caller.SendAsync(nameof(MethodNames.UserList), ClientSource.Clients);

            // Notify all clients about the new user
            await Clients.All.SendAsync(nameof(MethodNames.UserJoined), user);
        }

        public async Task SendMessage(UserConnection user, string message)
        {
            await Clients.All.SendAsync(nameof(MethodNames.ReceiveMessage), user, message);
        }

        public async Task SendPrivateMessage(EncryptMessage crypt)
        {
            var recipient = ClientSource.Clients.FirstOrDefault(u => u.Username == crypt.UserName);
            if (recipient != null)
            {
                await Clients.Client(recipient.ConnectionId).SendAsync(nameof(MethodNames.SendPrivateMessage), recipient, crypt.IV, crypt.Message);
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