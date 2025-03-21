using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace CryptMessengerApi.Models
{
    public class EncryptMessage
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public byte[] IV { get; set; } = Array.Empty<byte>();
        public byte[] Message { get; set; } = Array.Empty<byte>();
    }
}