import { Router } from 'express'
import sessionRoutes from './sessionRoutes'
import messageRoutes from './messageRoutes'
import systemRoutes from './systemRoutes'

const router = Router()

router.use('/sessions', sessionRoutes)
router.use('/messages', messageRoutes)
router.use('/system', systemRoutes)

export default router
