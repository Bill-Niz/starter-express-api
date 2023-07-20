import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import Gun from 'gun';
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

dotenv.config();
const app = express();
app.use(Gun.serve);
app.use(cors());
app.use(express.json());


const DEFAULT_ROOM_NAME = "#MainOffice";
app.post("/connection_details", async (req, res) => {
  const { username, metadata } = req.body;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;
  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({ error: "Server misconfigured" });
  }
  if (!username) return res.status(400).json({ error: "Missing username" });

  const livekitHost = wsUrl?.replace("wss://", "https://");

  const at = new AccessToken(apiKey, apiSecret, { identity: username });
  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  try {
    await roomService.getParticipant(DEFAULT_ROOM_NAME, username);
    return res.status(401).json({ error: "Username already exists in room" });
  } catch {
    // If participant doesn't exist, we can continue 
  }
  at.addGrant({
    DEFAULT_ROOM_NAME,
    canUpdateOwnMetadata: true,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    roomAdmin:true
  });
  if (metadata) {
    at.metadata = JSON.stringify(metadata);
  }
  res.send(JSON.stringify({ token: at.toJwt(), ws_url: wsUrl }));
});

app.all("/", (req, res) => {
  console.log("Just got a request!");
  res.send("welcome!");
});

const PORT = process.env.PORT || 3100;
const server = app.listen(PORT);
const s3 = {
  region: process.env.AWS_REGION,
  key: process.env.AWS_ACCESS_KEY_ID, // AWS Access Key
  secret: process.env.AWS_SECRET_ACCESS_KEY, // AWS Secret Token
  bucket: process.env.AWS_S3_BUCKET // The bucket you want to save into
}
console.log("🚀 ~ file: index.js:62 ~ s3:", s3)
Gun({ web: server, s3});

console.log("Server started on port : " + PORT);
