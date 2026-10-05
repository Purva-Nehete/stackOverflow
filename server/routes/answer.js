import express from "express";
import { Askanswer, deleteanswer, voteanswer, acceptAnswer } from "../controller/answer.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/postanswer/:id",auth, Askanswer);
router.delete("/delete/:id",auth,deleteanswer)
router.patch("/vote/:questionId/:answerId", auth, voteanswer);
router.patch("/accept/:questionId/:answerId", auth, acceptAnswer);


export default router;
