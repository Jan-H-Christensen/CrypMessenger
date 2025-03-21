namespace CryptMessengerApi.Models
{
    public class UserConnection
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PublicKey { get; set; } = string.Empty; // Add PublicKey property
    }
}