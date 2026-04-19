/**
 * Centralized export of all API services
 */

export { authService } from './auth.service';
export { bookingsService } from './bookings.service';
export { negotiationsService } from './negotiations.service';
export { paymentsService } from './payments.service';
export { servicesService } from './services.service';
export { usersService } from './users.service';
export { wishlistsService } from './wishlists.service';

// Export axios client for custom requests if needed
export { apiClient, createAxiosInstance, handleApiError, type ApiError } from '@/lib/axios';
