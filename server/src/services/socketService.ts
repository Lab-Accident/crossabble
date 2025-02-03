import { Server } from 'socket.io';

export class SocketService {
    constructor(private io: Server) {}

    notifyGameUpdate(gameCode: string, event: string, data: any) {
        this.io.to(gameCode).emit(event, data);
    }
}