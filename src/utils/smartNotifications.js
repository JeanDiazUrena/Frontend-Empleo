import axios from 'axios';
import { API_URLS } from '../config.js';

export const EXPIRED_NOTIFICATION_MESSAGE = 'Notificacion caducada';

const normalizeMetadata = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;

  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
};

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getReceiptJobId = (url = '') => {
  const match = String(url).match(/\/(?:client|professional)\/receipt\/(\d+)/);
  return match?.[1] || null;
};

const getTrabajoId = (metadata) =>
  metadata.trabajo_id || metadata.job_id || metadata.id_trabajo || getReceiptJobId(metadata.url);

const getUserId = () => localStorage.getItem('usuario_id');

const fetchJob = async (trabajoId) => {
  if (!trabajoId) return null;
  try {
    const { data } = await axios.get(`${API_URLS.TRABAJOS}/api/trabajos/${trabajoId}`);
    return data || null;
  } catch {
    return null;
  }
};

const fetchQuote = async (cotizacionId) => {
  if (!cotizacionId) return null;
  try {
    const { data } = await axios.get(`${API_URLS.TRABAJOS}/api/cotizaciones/${cotizacionId}`);
    return data || null;
  } catch {
    return null;
  }
};

const fetchPendingClientQuotes = async () => {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const { data } = await axios.get(`${API_URLS.TRABAJOS}/api/cotizaciones/cliente/${userId}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const fetchUserJobs = async (role) => {
  const userId = getUserId();
  if (!userId) return [];

  const endpoint = role === 'professional'
    ? `${API_URLS.TRABAJOS}/api/trabajos/profesional/${userId}`
    : `${API_URLS.TRABAJOS}/api/trabajos/cliente/${userId}`;

  try {
    const { data } = await axios.get(endpoint);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const inferAction = (notif, metadata, role) => {
  if (metadata.action) return metadata.action;

  const title = normalizeText(notif.title);
  const message = normalizeText(notif.message);
  const url = String(metadata.url || '');

  if (getReceiptJobId(url)) {
    return role === 'professional' ? 'open_professional_receipt' : 'view_client_receipt';
  }
  if (title.includes('pago confirmado') || message.includes('ver tu recibo')) return 'view_client_receipt';
  if (title.includes('pago liberado')) return 'open_professional_receipt';
  if (title.includes('trabajo terminado')) return 'confirm_job';
  if (title.includes('comprobante')) return 'confirm_transfer';
  if (title.includes('cotizacion aceptada')) return 'open_professional_job';
  if (title.includes('cotizacion')) return 'review_quote';
  if (metadata.url) return 'open_url';

  return 'none';
};

const buildDashboardTarget = (role, query = {}) => ({
  path: role === 'professional' ? '/professional/dashboard' : '/client/dashboard',
  query: Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
});

const validateReceiptTarget = async (metadata, role) => {
  const trabajoId = getTrabajoId(metadata);
  const fallbackUrl = metadata.url || (trabajoId ? `/${role === 'professional' ? 'professional' : 'client'}/receipt/${trabajoId}` : '');
  if (!trabajoId) return fallbackUrl ? { to: fallbackUrl } : { expired: true };

  const job = await fetchJob(trabajoId);
  if (!job) return { expired: true };

  return { to: fallbackUrl };
};

const validateQuoteTarget = async (metadata) => {
  const cotizacionId = metadata.cotizacion_id || metadata.quote_id;
  let quote = await fetchQuote(cotizacionId);

  if (!quote && cotizacionId) {
    const pending = await fetchPendingClientQuotes();
    quote = pending.find((item) => String(item.id) === String(cotizacionId)) || null;
  }

  if (!quote && !cotizacionId) {
    const pending = await fetchPendingClientQuotes();
    if (pending.length === 0) return { expired: true };
    return buildDashboardTarget('client', { focus: 'quote' });
  }

  if (!quote || quote.estado !== 'PENDIENTE') return { expired: true };

  const trabajoId = quote.trabajo_id || metadata.trabajo_id;
  if (trabajoId) {
    const job = await fetchJob(trabajoId);
    const inactiveStates = ['CONFIRMADO_CLIENTE', 'CANCELADO', 'FINALIZADO_PROFESIONAL', 'ESPERANDO_CONFIRMACION_TRANSFERENCIA'];
    if (job && inactiveStates.includes(job.estado)) return { expired: true };
  }

  return buildDashboardTarget('client', { focus: 'quote', cotizacion_id: quote.id });
};

const validateConfirmJobTarget = async (metadata) => {
  const trabajoId = getTrabajoId(metadata);

  if (!trabajoId) {
    const jobs = await fetchUserJobs('client');
    const hasPendingConfirmation = jobs.some((job) =>
      ['FINALIZADO_PROFESIONAL', 'ESPERANDO_CONFIRMACION_TRANSFERENCIA'].includes(job.estado)
    );
    return hasPendingConfirmation ? buildDashboardTarget('client', { focus: 'confirm_job' }) : { expired: true };
  }

  const job = await fetchJob(trabajoId);
  if (!job) return { expired: true };
  if (job.estado === 'CONFIRMADO_CLIENTE') return { to: `/client/receipt/${trabajoId}` };
  if (!['FINALIZADO_PROFESIONAL', 'ESPERANDO_CONFIRMACION_TRANSFERENCIA'].includes(job.estado)) return { expired: true };

  return buildDashboardTarget('client', { focus: 'confirm_job', trabajo_id: trabajoId });
};

const validateTransferTarget = async (metadata) => {
  const trabajoId = getTrabajoId(metadata);

  if (!trabajoId) {
    const jobs = await fetchUserJobs('professional');
    const hasPendingTransfer = jobs.some((job) => job.estado === 'ESPERANDO_CONFIRMACION_TRANSFERENCIA');
    return hasPendingTransfer ? buildDashboardTarget('professional', { focus: 'confirm_transfer' }) : { expired: true };
  }

  const job = await fetchJob(trabajoId);
  if (!job) return { expired: true };
  if (job.estado === 'CONFIRMADO_CLIENTE') return { to: `/professional/receipt/${trabajoId}` };
  if (job.estado !== 'ESPERANDO_CONFIRMACION_TRANSFERENCIA') return { expired: true };

  return buildDashboardTarget('professional', { focus: 'confirm_transfer', trabajo_id: trabajoId });
};

export const resolveNotificationTarget = async (notif, role) => {
  const metadata = normalizeMetadata(notif.metadata);
  const action = inferAction(notif, metadata, role);

  if (action === 'view_client_receipt') return validateReceiptTarget(metadata, 'client');
  if (action === 'open_professional_receipt') return validateReceiptTarget(metadata, 'professional');
  if (action === 'review_quote') return validateQuoteTarget(metadata);
  if (action === 'confirm_job') return validateConfirmJobTarget(metadata);
  if (action === 'confirm_transfer') return validateTransferTarget(metadata);

  if (action === 'open_professional_job') {
    const trabajoId = getTrabajoId(metadata);
    return buildDashboardTarget('professional', { focus: 'job', trabajo_id: trabajoId || undefined });
  }

  if (action === 'open_client_dashboard') {
    const trabajoId = getTrabajoId(metadata);
    return buildDashboardTarget('client', { focus: 'job', trabajo_id: trabajoId || undefined });
  }

  if (action === 'open_url' && metadata.url && String(metadata.url).startsWith('/')) {
    return { to: metadata.url };
  }

  return { expired: true };
};
