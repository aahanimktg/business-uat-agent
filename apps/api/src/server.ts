import express from "express";
import cors from "cors";

import { generatePlanRouter } from "./routes/generate-plan.route";
import { reviewRouter } from "./routes/review.route";
import { approveRouter } from "./routes/approve.route";
import { plansRouter }from "./routes/plans.route";
import { approveSprintRouter } from "./routes/approve-sprint.route";
const app = express();
 
app.use(cors());

app.use(express.json());
app.use("/generate-plan", generatePlanRouter);
app.use("/review", reviewRouter);
app.use("/approve", approveRouter);
app.use("/plans",plansRouter);
console.log(
  "approveSprintRouter",
  approveSprintRouter
);
app.use("/approve-sprint",approveSprintRouter);

const PORT = 4000;

app.listen(PORT, () => {

  console.log(
    `API running on ${PORT}`
  );

});