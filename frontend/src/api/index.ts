/**
 * Exportación centralizada de servicios API
 */

export { default as apiClient } from './client';
export { authService } from './auth.service';
export { productsService } from './products.service';
export { 
  categoriesService, 
  type CreateCategoryDto, 
  type UpdateCategoryDto 
} from './categories.service';
export { 
  suppliersService, 
  type CreateSupplierDto, 
  type UpdateSupplierDto 
} from './suppliers.service';
export { movementsService } from './movements.service';
export { alertsService } from './alerts.service';
export { reportsService } from './reports.service';
