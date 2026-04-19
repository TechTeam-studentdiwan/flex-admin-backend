import { Router } from "express";
import { getAllTermsPages, getAllTermsPagesAdmin, getTermsPageById, createTermsPage, updateTermsPage, deleteTermsPage } from "../Controllers/termsPage.controller.js";
import { authentication } from "../Middlewares/authentication.js";
import { adminOnly } from "../Middlewares/admin.js";

const termsPageRouter = Router();

termsPageRouter.get("/all", getAllTermsPages);
termsPageRouter.get("/admin/all", authentication, adminOnly, getAllTermsPagesAdmin);
termsPageRouter.get("/:id", getTermsPageById);
termsPageRouter.post("/create", authentication, adminOnly, createTermsPage);
termsPageRouter.put("/update/:id", authentication, adminOnly, updateTermsPage);
termsPageRouter.delete("/delete/:id", authentication, adminOnly, deleteTermsPage);

export default termsPageRouter;
