const { ZegoUIKitPrebuilt } = require('@zegocloud/zego-uikit-prebuilt');

const appID = 1735165999;
const serverSecret = "66f44d85a6db9e4cc800f7239fb6788a";

const t1 = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, "room", "user", "name", 3600);
console.log("Token 1:", t1.substring(0, 50) + "...");

const realDateNow = Date.now;
Date.now = () => 1704067200000;
const t2 = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, "room", "user", "name", 3600);
console.log("Token 2:", t2.substring(0, 50) + "...");
Date.now = realDateNow;

// Parse token to see if it changes timestamp
// Zego tokens are usually Base64 encoded JSON
try {
  const payload1 = Buffer.from(t1.split('.')[1] || t1, 'base64').toString('utf8');
  console.log("Payload 1:", payload1.substring(0, 50) + "...");
} catch (e) {}

try {
  const payload2 = Buffer.from(t2.split('.')[1] || t2, 'base64').toString('utf8');
  console.log("Payload 2:", payload2.substring(0, 50) + "...");
} catch (e) {}
