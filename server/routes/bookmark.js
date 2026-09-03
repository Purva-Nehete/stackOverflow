import express from "express";
import auth from "../middleware/auth.js";
import { addBookmark, getBookmarks, removeBookmark } from "../controller/bookmark.js";

const router = express.Router();

router.post("/:questionId", auth, addBookmark);
router.delete("/:questionId", auth, removeBookmark);
router.get("/", auth, getBookmarks);

export default router;
