import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Middleware to check if user is authenticated
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Get user from storage
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    
    // Check if user is active
    if (!user.ativo) {
      return res.status(401).json({ message: "Usuário inativo" });
    }
    
    // User is authenticated, proceed
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Middleware to check if user is admin
export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Get user from storage
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    
    // Check if user is active
    if (!user.ativo) {
      return res.status(401).json({ message: "Usuário inativo" });
    }
    
    // Check if user is admin
    if (user.tipo !== "admin") {
      return res.status(403).json({ message: "Não autorizado" });
    }
    
    // User is admin, proceed
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// Middleware to check if user is employee
export const employeeMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Get user from storage
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    
    // Check if user is active
    if (!user.ativo) {
      return res.status(401).json({ message: "Usuário inativo" });
    }
    
    // Check if user is employee
    if (user.tipo !== "empregado") {
      return res.status(403).json({ message: "Não autorizado" });
    }
    
    // User is employee, proceed
    next();
  } catch (error) {
    console.error("Employee middleware error:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
