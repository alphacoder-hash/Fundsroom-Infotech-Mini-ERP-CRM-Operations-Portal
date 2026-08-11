import { Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/auth';
import { uploadToS3, deleteFromS3 } from '../s3';

// GET /products
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, category, page = '1', limit = '10' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 10));
  const skip = (pageNum - 1) * limitNum;

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
      prisma.product.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ]);
    res.json({ success: true, data: products, meta: { total, page: pageNum, limit: limitNum } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /products/:id
export const getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { email: true, role: true } } },
        },
      },
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

  if (!name || !name.trim()) { res.status(400).json({ success: false, message: 'Product name is required' }); return; }
  if (!sku || !sku.trim()) { res.status(400).json({ success: false, message: 'SKU is required' }); return; }
  if (!category || !category.trim()) { res.status(400).json({ success: false, message: 'Category is required' }); return; }
  if (unitPrice === undefined || unitPrice === '') { res.status(400).json({ success: false, message: 'Unit price is required' }); return; }
  if (parseFloat(unitPrice) <= 0) { res.status(400).json({ success: false, message: 'Unit price must be greater than 0' }); return; }
  if (currentStock !== undefined && parseInt(currentStock) < 0) { res.status(400).json({ success: false, message: 'Stock cannot be negative' }); return; }
  if (minStockAlert !== undefined && parseInt(minStockAlert) < 0) { res.status(400).json({ success: false, message: 'Min stock alert cannot be negative' }); return; }

  try {
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim(),
        unitPrice: parseFloat(unitPrice),
        currentStock: parseInt(currentStock) || 0,
        minStockAlert: parseInt(minStockAlert) || 0,
        location: location?.trim() || null,
      },
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

  if (!name || !name.trim()) { res.status(400).json({ success: false, message: 'Product name is required' }); return; }
  if (!sku || !sku.trim()) { res.status(400).json({ success: false, message: 'SKU is required' }); return; }
  if (!category || !category.trim()) { res.status(400).json({ success: false, message: 'Category is required' }); return; }
  if (unitPrice === undefined || unitPrice === '') { res.status(400).json({ success: false, message: 'Unit price is required' }); return; }
  if (parseFloat(unitPrice) <= 0) { res.status(400).json({ success: false, message: 'Unit price must be greater than 0' }); return; }
  if (minStockAlert !== undefined && parseInt(minStockAlert) < 0) { res.status(400).json({ success: false, message: 'Min stock alert cannot be negative' }); return; }

  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, message: 'Product not found' }); return; }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim(),
        unitPrice: parseFloat(unitPrice),
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert) : existing.minStockAlert,
        location: location?.trim() || null,
      },
    });
    res.json({ success: true, data: product });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: 'SKU already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

// POST /products/:id/stock
export const updateStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const { quantity, type, reason } = req.body;

  if (!type || !['IN', 'OUT'].includes(type)) { res.status(400).json({ success: false, message: 'Movement type must be IN or OUT' }); return; }
  if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) { res.status(400).json({ success: false, message: 'Quantity must be a positive number' }); return; }

  const qty = parseInt(quantity);

  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }

    if (type === 'OUT' && product.currentStock < qty) {
      res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.currentStock}` });
      return;
    }

    const newStock = type === 'IN' ? product.currentStock + qty : product.currentStock - qty;

    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({ where: { id: req.params.id }, data: { currentStock: newStock } }),
      prisma.stockMovement.create({
        data: {
          productId: req.params.id,
          quantityChanged: qty,
          type,
          reason: reason?.trim() || null,
          createdBy: req.user!.id,
        },
      }),
    ]);
    res.json({ success: true, data: { product: updatedProduct, movement } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /products/:id/image
export const uploadProductImage = async (req: AuthRequest, res: Response): Promise<void> => {
  const file = (req as any).file;
  if (!file) { res.status(400).json({ success: false, message: 'No image file provided' }); return; }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    res.status(400).json({ success: false, message: 'Only JPEG, PNG, or WebP images are allowed' });
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    res.status(400).json({ success: false, message: 'Image must be under 5MB' });
    return;
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }

    // Delete old image from S3 if exists
    if (product.imageUrl) await deleteFromS3(product.imageUrl);

    const imageUrl = await uploadToS3(file.buffer, file.mimetype);
    const updated = await prisma.product.update({ where: { id: req.params.id }, data: { imageUrl } });
    res.json({ success: true, data: { imageUrl: updated.imageUrl } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to upload image' });
  }
};

// GET /products/:id/movements
export const getStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }

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
