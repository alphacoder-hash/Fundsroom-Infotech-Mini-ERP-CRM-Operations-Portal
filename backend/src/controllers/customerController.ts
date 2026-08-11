import { Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/auth';

const VALID_TYPES = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'];
const VALID_STATUSES = ['LEAD', 'ACTIVE', 'INACTIVE'];

// GET /customers
export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, status, type, page = '1', limit = '10' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { mobile: { contains: search as string } },
      { businessName: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (status && VALID_STATUSES.includes(status as string)) where.status = status;
  if (type && VALID_TYPES.includes(type as string)) where.type = type;

  try {
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);
    res.json({ success: true, data: customers, meta: { total, page: pageNum, limit: limitNum } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /customers/:id
export const getCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { challans: { include: { items: true }, orderBy: { createdAt: 'desc' } } },
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

  if (!name || !name.trim()) { res.status(400).json({ success: false, message: 'Customer name is required' }); return; }
  if (!mobile || !mobile.trim()) { res.status(400).json({ success: false, message: 'Mobile number is required' }); return; }
  if (!/^\d{10,15}$/.test(mobile.trim())) { res.status(400).json({ success: false, message: 'Mobile must be 10-15 digits' }); return; }
  if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { res.status(400).json({ success: false, message: 'Invalid email address' }); return; }
  if (!type || !VALID_TYPES.includes(type)) { res.status(400).json({ success: false, message: 'Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR' }); return; }
  if (status && !VALID_STATUSES.includes(status)) { res.status(400).json({ success: false, message: 'Status must be LEAD, ACTIVE, or INACTIVE' }); return; }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email?.trim() || null,
        businessName: businessName?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        type,
        address: address?.trim() || null,
        status: status || 'LEAD',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes?.trim() || null,
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

  if (!name || !name.trim()) { res.status(400).json({ success: false, message: 'Customer name is required' }); return; }
  if (!mobile || !mobile.trim()) { res.status(400).json({ success: false, message: 'Mobile number is required' }); return; }
  if (!/^\d{10,15}$/.test(mobile.trim())) { res.status(400).json({ success: false, message: 'Mobile must be 10-15 digits' }); return; }
  if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { res.status(400).json({ success: false, message: 'Invalid email address' }); return; }
  if (!type || !VALID_TYPES.includes(type)) { res.status(400).json({ success: false, message: 'Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR' }); return; }
  if (status && !VALID_STATUSES.includes(status)) { res.status(400).json({ success: false, message: 'Status must be LEAD, ACTIVE, or INACTIVE' }); return; }

  try {
    const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email?.trim() || null,
        businessName: businessName?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        type,
        address: address?.trim() || null,
        status: status || existing.status,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes?.trim() || null,
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
  if (!note || !note.trim()) {
    res.status(400).json({ success: false, message: 'Note is required' });
    return;
  }
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }

    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const updatedNotes = customer.notes
      ? `${customer.notes}\n[${timestamp}] ${note.trim()}`
      : `[${timestamp}] ${note.trim()}`;

    const updated = await prisma.customer.update({ where: { id: req.params.id }, data: { notes: updatedNotes } });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
