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

let customerList = [];
io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  socket.on("join", (data) => {
    socket.join(data.roomId);
    if (data.isCustomer) {
      customerList.push(data);
      io.emit("newCustomerAdded", data);
    }
    if (!data.isCustomer && data.isGetCustomerData) {
      let index = customerList.findIndex(customer => customer.customerId == data.customerId)
      if (index > -1) {
        customerList[index].isAdvisorConnected = true;
        customerList[index].advisorId = data.advisorId;
        io.emit("sendCustomerList", { customers: customerList });
      }
      io.to(data.roomId).emit("newAdvisorConnected", data);
    }
  });

  socket.on("advisorConnected", (data) => {
    const rooms = [...socket.rooms];
    io.to(rooms).emit("sendCustomerList", { customers: customerList });
  });

  socket.on("sendContent", (data) => {
    io.to(data.roomId).emit("getContent", data);
  });

  socket.on("sendChangedContent", (data) => {
    io.to(data.roomId).emit("getChangedContent", data);
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
    let index = -1;
    customerList = customerList.filter((customer, i) => {
      if (customer.advisorId == socket.id) {
        index = i
      }
      if (customer.customerId == socket.id) {
        return false;
      } else {
        return true;
      }
    });
    if (index > -1) {
      customerList[index].isAdvisorConnected = false;
      io.emit("sendCustomerList", { customers: customerList });
    }
    console.log("user disconnected", socket.id);
    io.emit("userDisconnected", { userId: socket.id });
  });

});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is up and running at port: ${port}`);
});
