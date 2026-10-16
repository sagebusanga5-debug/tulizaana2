import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  /**
   * Code d'erreur metier stable et exploitable par le client.
   *
   * Le texte de `error` peut etre traduit ou reformule : il ne fait PAS partie
   * du contrat. Le client doit brancher son comportement sur `code`, jamais sur
   * la phrase ni sur le statut HTTP.
   */
  code?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta,
  };
  return res.status(status).json(payload);
}

export function sendError(
  res: Response,
  error: string,
  status = 400,
  code?: string,
  meta?: Record<string, unknown>
): Response {
  const payload: ApiResponse = {
    success: false,
    error,
    ...(code ? { code } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(status).json(payload);
}
