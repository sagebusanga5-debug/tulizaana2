import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  console.error("Unhandled Server Error:", err);
  return res.status(500).json({
    success: false,
    error: "Une erreur interne est survenue sur le serveur Tulizaana.",
    details: process.env.NODE_ENV !== "production" ? err.message : undefined,
  });
}
