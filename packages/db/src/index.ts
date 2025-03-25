export { prisma as db, prisma } from './client' // exports instance of prisma 
export * from "../generated/client" // exports generated types from prisma

// Export all services
export * from './services/client.service'
export * from './services/user.service'
export * from './services/project.service'
export * from './services/website.service'
export * from './services/invite.service'
