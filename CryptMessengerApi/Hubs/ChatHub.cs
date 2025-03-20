using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CryptMessengerApi.Models;
using Microsoft.AspNetCore.SignalR;

namespace CryptMessengerApi.Hubs
{
    public class ChatHub : Hub
    {
        public async Task JoinChat(UserConnection user)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, $"{user.Username} has joined the chat");
        }

        public async Task SendMessage(UserConnection user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }

        public async Task PrivateMessage(UserConnection user, string message)
        {
            await Clients.User(user.ConnectionId).SendAsync("ReceiveMessage", user, message);
        }
    }
}