## Intro
This is an Application and API for Secure Software Development.

It contains a chat where you can pick a username and login on as many tabs you desire.

## Getting Started

First, Copy the Repository and open the split terminal.

Run the following commands on CryptMessengerApi Terminal:
```bash
dotnet run  
```
Run the following commands on cryptmessengerapp Terminal:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Troubleshooting
# In the case of the program not running:
Delete the bin in CryptMessengerApi and make sure that your LocalMachine is set to Unrestricted for:
```bash
Get-ExecutionPolicy -List
Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope LocalMachine
```

Run the following commands on CryptMessengerApi Terminal:
```bash
cd cryptmessengerApi
dotnet restore 
dotnet build  
dotnet run  
```
Run the following commands on cryptmessengerapp Terminal:
```bash
npm run dev
```

## Interaction

Once you have entered 2 or more users, you can click on any user on the list to automatically add them to the private messaging recipient.

The message you write in the box for private messages will only be sent to the recipient you have selected.

## The Visuals

# Entering the username:
- ![Entering the username:](https://i.gyazo.com/fb3a05ea95903c6b05cc0c38d78a5bea.png)
# Your active users:
- ![Your active users: ](https://i.gyazo.com/8a517c831169dace6da6cde57968d66e.png)
# The Chat with private messaging:
- ![The Chat with private messaging: ](https://i.gyazo.com/0f47c58f21ff0cd903e31c16674c1a23.png)
# The same Chat from the perspective of Jan:
- ![The same Chat from the perspective of Jan: ](https://i.gyazo.com/28fc046196d2cac69939353108392948.png)
# The view from Console, showing the encryption:
- ![The view from Console, showing the encryption: ](https://i.gyazo.com/763f390be6b8dd97f4807d5f96d36eac.png)

## How the Encryption works
# Client vs Server
In this project we are using End-to-End Encryption, meaning that everything happens Client-side, to ensure that the Server is only a messenger and does not have access to the decryptions between the users, allowing no eavesdropping, especially should the Server be compromised by an Attacker. The Attacker will not gain access to the decryption, only the encryption.

Of course End-to-End Encryption does not guarantee absolute security, an Attacker can still gain access if they gain access to the users client where the data can be held unencrypted or if the Attacker gains access to the users account. In the case of vulnerability in the server, the messages are encrypted and secure from weakness in the server side, should the worst happen.

# The Encryption
We use the RSA Cryptosystem, which is a public key cryptosystem and one of the oldest widely used methods for secure data transmission. 
Our users each have their own decryption key, and when they join their public key is accessible to the other users, allowing private messages to be encrypted upon transmission and decrypted at arrival. 
In the CryptMessengerApp under Utils is the file: Cryption.ts, we perform our generation of the key pairs, as well as the encryption of a message using the public key and the decryption at arrival with the private key. 

We specifically use RSA-OAEP which stand for: Rivest-Shamir-Adleman Optimal Asymmetric Encryption Padding, within we use the hashing algorithm: SHA-256 which is widely used because of its security.

RSA-OAEP is good for encrypting small pieces of data, such as symmetric encryption keys or authentication tokens.
When encrypting a message, the plain text is padded using OAEP (Optimal Asymmetric Encryption Padding) scheme.
The padded message is then encrypted using RSA with the recipient's public key, finally the encrypted ciphertext is sent to the recipient.
The padding of OAEP is there to prevent attacks like chosen-ciphertext attacks by introducing randomness in the encryption process by using a masking function with a hash function(SHA-256).
Chosen-ciphertext attacks is where the Attacker can gather information by obtaining the decryptions of chosen ciphertexts, from these pieces of information the Attacker can attempt to recover the secret key used for decryption
The main reason for using this padding is so that encrypting the same message multiple times produces different ciphertexts, making it much harder for the Attacker to obtain the data needed to recover the secret key.

## Final Words


## Sources
[Source for OAEP: ](https://en.wikipedia.org/wiki/Optimal_asymmetric_encryption_padding)

[Source for RSA: ](https://en.wikipedia.org/wiki/RSA_cryptosystem)

[Source for Chosen Ciphertext Attack: ](https://en.wikipedia.org/wiki/Chosen-ciphertext_attack)







