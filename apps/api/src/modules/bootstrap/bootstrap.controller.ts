import { Body, Controller, Post } from "@nestjs/common";
import { BootstrapWorkspaceDto } from "./dto/bootstrap-workspace.dto";
import { BootstrapService } from "./bootstrap.service";

@Controller("bootstrap")
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Post("workspace")
  bootstrapWorkspace(@Body() body: BootstrapWorkspaceDto) {
    return this.bootstrapService.bootstrapWorkspace(body);
  }
}
