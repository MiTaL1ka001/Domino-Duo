import { z } from 'zod';

export const CreateRoomSchema = z.object({
  nickname: z.string().trim().min(1, 'Nickname must have at least 1 character').max(20, 'Nickname maximum 20 characters'),
  preferredTeam: z.union([z.literal(0), z.literal(1)]).optional()
});

export const JoinRoomSchema = z.object({
  roomCode: z.string().trim().min(1, 'Room code is required').transform((v) => v.toUpperCase()),
  nickname: z.string().trim().min(1, 'Nickname is required').max(20, 'Nickname maximum 20 characters'),
  sessionToken: z.string().optional(),
  preferredTeam: z.union([z.literal(0), z.literal(1)]).optional()
});

export const SelectTeamSchema = z.object({
  roomCode: z.string().trim().transform((v) => v.toUpperCase()),
  sessionToken: z.string().min(1, 'Session token is required'),
  targetTeam: z.union([z.literal(0), z.literal(1)])
});

export const RoomActionSchema = z.object({
  roomCode: z.string().trim().transform((v) => v.toUpperCase()),
  sessionToken: z.string().min(1, 'Session token is required')
});

export const PlayTileSchema = z.object({
  roomCode: z.string().trim().transform((v) => v.toUpperCase()),
  sessionToken: z.string().min(1, 'Session token is required'),
  tileId: z.string().min(3, 'Tile ID is required'),
  end: z.enum(['left', 'right'])
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;
export type SelectTeamInput = z.infer<typeof SelectTeamSchema>;
export type RoomActionInput = z.infer<typeof RoomActionSchema>;
export type PlayTileInput = z.infer<typeof PlayTileSchema>;
