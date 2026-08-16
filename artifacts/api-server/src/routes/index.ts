import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import requestsRouter from "./requests";
import savedRouter from "./saved";
import statsRouter from "./stats";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(listingsRouter);
router.use(requestsRouter);
router.use(savedRouter);
router.use(statsRouter);
router.use(usersRouter);

export default router;
