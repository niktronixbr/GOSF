import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.notificationsService.findAll(user.id);
  }

  @Get("unread-count")
  countUnread(@CurrentUser() user: { id: string }) {
    return this.notificationsService.countUnread(user.id);
  }

  @Get("stream")
  sseStream(
    @CurrentUser() user: { id: string },
    @Req() req: any,
    @Res() reply: any,
  ): void {
    const raw: import("http").ServerResponse = reply.raw;
    raw.setHeader("Content-Type", "text/event-stream");
    raw.setHeader("Cache-Control", "no-cache, no-transform");
    raw.setHeader("Connection", "keep-alive");
    raw.setHeader("X-Accel-Buffering", "no");
    raw.flushHeaders();

    const unsub = this.notificationsService.subscribe(
      user.id,
      (notification) => {
        raw.write(`data: ${JSON.stringify(notification)}\n\n`);
      },
    );

    const heartbeat = setInterval(() => {
      raw.write(": ping\n\n");
    }, 25_000);

    const cleanup = () => {
      clearInterval(heartbeat);
      unsub();
      try {
        raw.end();
      } catch {}
    };

    req.raw.on("close", cleanup);
    req.raw.on("error", cleanup);
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  markRead(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markRead(id, user.id);
  }
}
