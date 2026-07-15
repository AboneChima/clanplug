import { Router } from 'express';
import { groupController } from '../controllers/group.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all available groups
router.get('/', groupController.getGroups);

// Get group details
router.get('/:chatId', groupController.getGroupDetails);

// Join a group
router.post('/:chatId/join', groupController.joinGroup);

// Leave a group
router.post('/:chatId/leave', groupController.leaveGroup);

// Get group messages
router.get('/:chatId/messages', groupController.getGroupMessages);

export default router;
