import { Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/auth';

// GET /products
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, category, page = '1', limit = '10' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { sku: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = { contains: category as string, mode: 'insensitive' };
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ]);
    res.json({ success: true, data: products, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /products/:id
export const getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { email: true, role: true } } } } },
    });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /products
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;
  if (!name || !sku || !category || unitPrice === undefined) {
    res.status(400).json({ success: false, message: 'Name, SKU, category, and unit price are required' });
    return;
  }
  try {
    const product = await prisma.product.create({
      data: { name, sku, category, unitPrice: parseFloat(unitPrice), currentStock: parseInt(currentStock) || 0, minStockAlert: parseInt(minStockAlert) || 0, location },
    });
    res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: 'SKU already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

// PUT /products/:id
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, sku, category, unitPrice, minStockAlert, location } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, sku, category, unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : undefined, minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert) : undefined, location },
    });
    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /products/:id/stock
export const updateStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const { quantity, type, reason } = req.body;
  if (!quantity || !type || !['IN', 'OUT'].includes(type)) {
    res.status(400).json({ success: false, message: 'Quantity and type (IN/OUT) are required' });
    return;
  }
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    if (type === 'OUT' && product.currentStock < parseInt(quantity)) {
      res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.currentStock}` });
      return;
    }
    const newStock = type === 'IN' ? product.currentStock + parseInt(quantity) : product.currentStock - parseInt(quantity);
    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({ where: { id: req.params.id }, data: { currentStock: newStock } }),
      prisma.stockMovement.create({ data: { productId: req.params.id, quantityChanged: parseInt(quantity), type, reason, createdBy: req.user!.id } }),
    ]);
    res.json({ success: true, data: { product: updatedProduct, movement } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /products/:id/movements
export const getStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { productId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, role: true } } },
    });
    res.json({ success: true, data: movements });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
