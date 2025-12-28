// framework/src/utils/shutdown-manager.ts
export class ShutdownManager {
  private static shutting = false;

  static setShutdown(value: boolean) {
    this.shutting = value;
  }

  static isShuttingDown(): boolean {
    return this.shutting;
  }

  static checkShutdown(): void {
    if (this.shutting) {
      throw new Error("Operation cancelled - shutting down");
    }
  }
}

export default ShutdownManager;
