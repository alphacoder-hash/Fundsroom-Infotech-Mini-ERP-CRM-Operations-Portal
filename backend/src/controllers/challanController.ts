import { Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/auth';

const generateChallanNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  // Use max challanNumber to avoid collision on deletions
  const last = await prisma.salesChallan.findFirst({
    where: { challanNumber: { startsWith: `CH-${year}-` } },
    orderBy: { challanNumber: 'desc' },
  });
  const lastNum = last ? parseInt(last.challanNumber.split('-')[2]) : 0;
  return `CH-${year}-${String(lastNum + 1).padStart(5, '0')}`;
};

// GET /challans
export const getChallans = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, customerId, page = '1', limit = '10' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  try {
    const [challans, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          user: { select: { email: true } },
          items: true,
        },
      }),
      prisma.salesChallan.count({ where }),
    ]);
    res.json({ success: true, data: challans, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /challans/:id
export const getChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        user: { select: { email: true, role: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });
    if (!challan) { res.status(404).json({ success: false, message: 'Challan not found' }); return; }
    res.json({ success: true, data: challan });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /challans
export const createChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { customerId, items, status } = req.body;

  // --- Validate inputs ---
  if (!customerId || !customerId.trim()) {
    res.status(400).json({ success: false, message: 'Customer is required' }); return;
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'At least one product item is required' }); return;
  }

  const challanStatus = status === 'CONFIRMED' ? 'CONFIRMED' : 'DRAFT';

  for (const item of items) {
    if (!item.productId || !item.productId.trim()) {
      res.status(400).json({ success: false, message: 'Each item must have a valid product selected' }); return;
    }
    const qty = parseInt(item.quantity);
    if (!qty || qty <= 0) {
      res.status(400).json({ success: false, message: 'Each item quantity must be a positive number' }); return;
    }
  }

  // Check for duplicate productIds in items
  const productIds = items.map((i: any) => i.productId);
  const uniqueIds = new Set(productIds);
  if (uniqueIds.size !== productIds.length) {
    res.status(400).json({ success: false, message: 'Duplicate products in challan — combine quantities instead' }); return;
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }

    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate all products exist and check stock if confirming
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        res.status(404).json({ success: false, message: `Product not found` }); return;
      }
      if (challanStatus === 'CONFIRMED' && product.currentStock < parseInt(item.quantity)) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${parseInt(item.quantity)}`,
        }); return;
      }
    }

    const challanNumber = await generateChallanNumber();
    const totalQuantity = items.reduce((sum: number, i: any) => sum + parseInt(i.quantity), 0);

    const challan = await prisma.$transaction(async (tx) => {
      const newChallan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          status: challanStatus,
          createdBy: req.user!.id,
          items: {
            create: items.map((item: any) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                productNameSnapshot: product.name,
                skuSnapshot: product.sku,
                unitPriceSnapshot: product.unitPrice,
                quantity: parseInt(item.quantity),
              };
            }),
          },
        },
        include: { items: true, customer: true },
      });

      if (challanStatus === 'CONFIRMED') {
        for (const item of items) {
          const product = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: product.currentStock - parseInt(item.quantity) },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: parseInt(item.quantity),
              type: 'OUT',
              reason: `Challan: ${challanNumber}`,
              createdBy: req.user!.id,
            },
          });
        }
      }

      return newChallan;
    });

    res.status(201).json({ success: true, data: challan });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /challans/:id/status
export const updateChallanStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;

  if (!status || !['CONFIRMED', 'CANCELLED'].includes(status)) {
    res.status(400).json({ success: false, message: 'Status must be CONFIRMED or CANCELLED' }); return;
  }

  try {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!challan) { res.status(404).json({ success: false, message: 'Challan not found' }); return; }
    if (challan.status !== 'DRAFT') {
      res.status(400).json({ success: false, message: `Challan is already ${challan.status}. Only DRAFT challans can be updated` }); return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (status === 'CONFIRMED') {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw new Error(`Product "${item.productNameSnapshot}" no longer exists`);
          if (product.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for "${item.productNameSnapshot}". Available: ${product.currentStock}, Required: ${item.quantity}`);
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: product.currentStock - item.quantity },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              type: 'OUT',
              reason: `Challan: ${challan.challanNumber}`,
              createdBy: req.user!.id,
            },
          });
        }
      }
      return tx.salesChallan.update({ where: { id: req.params.id }, data: { status } });
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to update challan status' });
  }
};
