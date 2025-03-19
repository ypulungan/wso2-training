"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomReservations = exports.rooms = void 0;
const express_1 = __importDefault(require("express"));
const utils_1 = require("./utils");
const uuid_1 = require("uuid");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const router = express_1.default.Router();
const port = 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
exports.rooms = (0, utils_1.getAllRooms)();
exports.roomReservations = {};
// POST /reservations
router.post("/", (req, res) => {
    const payload = req.body;
    console.log("Request received by POST /reservations", payload);
    // Check if room is available for the given dates
    const availableRoom = (0, utils_1.getAvailableRoom)(payload.checkinDate, payload.checkoutDate, payload.roomType);
    if (!availableRoom) {
        return res.status(400).send({
            http: "NotFound",
            body: "No rooms available for the given dates and type",
        });
    }
    // Create a new reservation
    const reservation = {
        id: (0, uuid_1.v4)(),
        user: payload.user,
        room: availableRoom,
        checkinDate: payload.checkinDate,
        checkoutDate: payload.checkoutDate,
    };
    // Add reservation to the map
    exports.roomReservations[reservation.id] = reservation;
    res.json(reservation);
});
router.get("/roomTypes", (req, res) => {
    console.log("Request received by GET /reservations/roomTypes", req.query);
    const { checkinDate, checkoutDate, guestCapacity } = req.query;
    // Validate query parameters
    if (!checkinDate || !checkoutDate || !guestCapacity) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
    // Call the function to get available room types
    try {
        const roomTypes = (0, utils_1.getAvailableRoomTypes)(checkinDate.toString(), checkoutDate.toString(), parseInt(guestCapacity.toString(), 10));
        res.json(roomTypes);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/users/:userId", (req, res) => {
    const userId = req.params.userId;
    const reservations = Object.values(exports.roomReservations);
    return res.json(reservations.filter((r) => r.user.id === userId));
});
router.put("/:reservationId", (req, res) => {
    const reservationId = req.params.reservationId;
    const { checkinDate, checkoutDate } = req.body;
    if (!exports.roomReservations[reservationId]) {
        res.json({ http: "NotFound", body: "Reservation not found" });
    }
    const room = (0, utils_1.getAvailableRoom)(checkinDate, checkoutDate, exports.roomReservations[reservationId].room.type.name);
    if (!room) {
        res.json({ http: "NotFound", body: "No rooms available" });
    }
    exports.roomReservations[reservationId].checkinDate = checkinDate;
    exports.roomReservations[reservationId].checkoutDate = checkoutDate;
    res.json(exports.roomReservations[reservationId]);
});
router.delete("/:reservationId", (req, res) => {
    const reservationId = req.params.reservationId;
    if (!exports.roomReservations[reservationId]) {
        res.json({ http: "NotFound", body: "Reservation not found" });
    }
    delete exports.roomReservations[reservationId];
    res.sendStatus(200);
});
app.use("/api/reservations", router);
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
