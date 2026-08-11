// @ts-nocheck
import { Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/auth';

// GET /customers
export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, status, type, page = '1', limit = '10' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { mobile: { contains: search as string } },
      { businessName: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status as string;
  if (type) where.type = type as string;
  try {
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);
    res.json({ success: true, data: customers, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /customers/:id
export const getCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { challans: { include: { items: true } } },
    });
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }
    res.json({ success: true, data: customer });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /customers
export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, mobile, email, businessName, gstNumber, type, address, status, followUpDate, notes } = req.body;
  if (!name || !mobile || !type) {
    res.status(400).json({ success: false, message: 'Name, mobile, and type are required' });
    return;
  }
  try {
    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email: email || null,
        businessName: businessName || null,
        gstNumber: gstNumber || null,
        type,
        address: address || null,
        status: status || 'LEAD',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
      },
    });
    res.status(201).json({ success: true, data: customer });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /customers/:id
export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, mobile, email, businessName, gstNumber, type, address, status, followUpDate, notes } = req.body;
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name,
        mobile,
        email: email || null,
        businessName: businessName || null,
        gstNumber: gstNumber || null,
        type,
        address: address || null,
        status,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
      },
    });
    res.json({ success: true, data: customer });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /customers/:id/notes
export const addNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { note } = req.body;
  if (!note) { res.status(400).json({ success: false, message: 'Note is required' }); return; }
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }
    const updatedNotes = customer.notes ? `${customer.notes}\n[${new Date().toISOString()}] ${note}` : `[${new Date().toISOString()}] ${note}`;
    const updated = await prisma.customer.update({ where: { id: req.params.id }, data: { notes: updatedNotes } });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
