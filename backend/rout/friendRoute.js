import express from "express";
import isLogin from "../middleware/isLogin.js";
import {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    getFriends
} from "../routControlers/friendController.js";

const router = express.Router();

router.use(isLogin);

router.get("/", getFriends);
router.get("/search", searchUsers);
router.get("/requests", getFriendRequests);
router.post("/request/:targetUserId", sendFriendRequest);
router.post("/accept/:requestId", acceptFriendRequest);
router.post("/decline/:requestId", declineFriendRequest);

export default router;
