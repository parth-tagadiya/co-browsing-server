const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
var io = socketio(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "hello",
  });
});

io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  socket.on("join", (data) => {
    socket.join(data.roomId);
    if (!data.isMaster) {
      io.to(data.roomId).emit("userJoined", { userId: socket.id });
    }
  });
  socket.on("sendContent", (data) => {
    io.to(data.roomId).emit("getContent", data);
  });
  socket.on("sendSize", (data) => {
    io.to(data.roomId).emit("sizeChange", data);
  });
  socket.on("sendScroll", (data) => {
    io.to(data.roomId).emit("scrollChange", data);
  });
  socket.on("sendMouse", (data) => {
    io.to(data.roomId).emit("mouseChange", data);
  });
  socket.on("sendInput", (data) => {
    io.to(data.roomId).emit("inputChange", data);
  });
  socket.on("sendMouseClick", (data) => {
    io.to(data.roomId).emit("mouseClicked", data);
  });
  socket.on("disconnecting", (data) => {
    const rooms = [...socket.rooms];
    io.to(rooms).emit("userDisconnected", { userId: socket.id });
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is up and running at port: ${port}`);
});
