import express from "express";
import {
  createOffer,
  updateOffer,
  deleteOffer,
  getAllOffers,
} from "../Controllers/offer.controller.js";
import { authentication } from "../Middlewares/authentication.js";

const offerRoutes = express.Router();

offerRoutes.post("/create", authentication, createOffer);
offerRoutes.put("/update/:id", authentication, updateOffer);
offerRoutes.delete("/delete/:id", authentication, deleteOffer);
offerRoutes.get("/all", authentication, getAllOffers);

export default offerRoutes;
