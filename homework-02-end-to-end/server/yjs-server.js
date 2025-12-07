// server/yjs-server.js
// Custom Yjs WebSocket server implementation
import * as Y from "yjs";

const docs = new Map();
const conns = new Map();

const messageSync = 0;
const messageAwareness = 1;

const getYDoc = (docname) => {
  let doc = docs.get(docname);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docname, doc);
  }
  return doc;
};

const send = (conn, message) => {
  if (conn.readyState === 1) {
    // WebSocket.OPEN
    conn.send(message);
  }
};

export const setupWSConnection = (conn, req) => {
  // Extract room name from URL path
  const url = new URL(req.url, `http://${req.headers.host}`);
  const docname = url.searchParams.get("room") || "default";

  console.log(`Client connected to room: ${docname}`);

  const doc = getYDoc(docname);

  // Track connections per document
  if (!conns.has(docname)) {
    conns.set(docname, new Set());
  }
  conns.get(docname).add(conn);

  // Send initial sync
  const encoder = Y.encodeStateAsUpdate(doc);
  const syncMessage = new Uint8Array([messageSync, ...encoder]);
  send(conn, syncMessage);

  conn.on("message", (message) => {
    try {
      const data = new Uint8Array(message);
      const messageType = data[0];
      const payload = data.slice(1);

      if (messageType === messageSync) {
        // Apply update to doc
        Y.applyUpdate(doc, payload);

        // Broadcast to other connections
        const roomConns = conns.get(docname);
        if (roomConns) {
          roomConns.forEach((c) => {
            if (c !== conn) {
              send(c, message);
            }
          });
        }
      } else if (messageType === messageAwareness) {
        // Broadcast awareness to all other connections
        const roomConns = conns.get(docname);
        if (roomConns) {
          roomConns.forEach((c) => {
            if (c !== conn) {
              send(c, message);
            }
          });
        }
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  conn.on("close", () => {
    console.log(`Client disconnected from room: ${docname}`);
    const roomConns = conns.get(docname);
    if (roomConns) {
      roomConns.delete(conn);
      if (roomConns.size === 0) {
        // Optionally clean up empty rooms after some time
        // For now, keep the document
      }
    }
  });

  conn.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
};
