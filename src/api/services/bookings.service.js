import { apiClient } from "../client.js"
import { ENDPOINTS } from "../endpoints.js"

export const bookingsService = {
  getAll: async () => {
    return await apiClient.get(ENDPOINTS.BOOKINGS.LIST)
  },

  getById: async (id) => {
    return await apiClient.get(ENDPOINTS.BOOKINGS.GET(id))
  },

  getByPackage: async (packageId) => {
    return await apiClient.get(ENDPOINTS.BOOKINGS.BY_PACKAGE(packageId))
  },

  updateStatus: async (id, status) => {
    return await apiClient.put(ENDPOINTS.BOOKINGS.UPDATE_STATUS(id), { status })
  },
}
