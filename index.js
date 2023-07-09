import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
dotenv.config();
const app = express();

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
    canPublishData: true,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
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
app.listen(PORT);

console.log("Server started on port : " + PORT);
