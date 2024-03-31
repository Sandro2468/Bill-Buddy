const { createServer } = require("http");
const { Server } = require("socket.io");

const app = require("./app");

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_CLIENT_URL,
  },
});

let tmpDB = {};

io.on("connection", (socket) => {
  console.log("someone connect with ID: ", socket.id);

  socket.on("join:room", (roomId, token) => {
    socket.join(roomId);
    if (!tmpDB.hasOwnProperty(roomId) && token) {
      tmpDB[roomId] = {};
      tmpDB[roomId]["userId"] = socket.id;
      console.log("Database member create by user ID: ", socket.id);
    }
    io.to(roomId).emit(
      "receive:membersData",
      tmpDB[socket.handshake.auth.billId]
    );
  });

  socket.on("send:members", (room, members) => {
    if (tmpDB[room]) {
      tmpDB[room]["userId"] = socket.id;
      tmpDB[room]["members"] = members;
      socket
        .to(room)
        .emit("receive:membersData", tmpDB[socket.handshake.auth.billId]);
    }
  });

  socket.on("disconnect", () => {
    if (tmpDB[socket.handshake.auth.billId]?.userId == socket.id) {
      delete tmpDB[socket.handshake.auth.billId];
      console.log(
        "Room with ID: ",
        socket.handshake.auth.billId,
        "has been deleted by user because disconnected"
      );
      console.log(tmpDB, "<<<< db terbaru");
    }
    console.log("Someone with ID: ", socket.id, "disconnected");
  });
});

module.exports = httpServer;
