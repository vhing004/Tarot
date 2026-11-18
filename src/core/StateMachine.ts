export interface StateHandler<TPayload = unknown> {
  enter?: (payload?: TPayload) => void;
  update?: (dt: number) => void;
  exit?: () => void;
}

export class StateMachine<TState extends string> {
  private handlers = new Map<TState, StateHandler<never>>();
  private currentState: TState | null = null;

  addState<TPayload>(name: TState, handler: StateHandler<TPayload>): this {
    this.handlers.set(name, handler as StateHandler<never>);
    return this;
  }

  get current(): TState | null {
    return this.currentState;
  }

  go<TPayload>(nextState: TState, payload?: TPayload): void {
    if (this.currentState) {
      const prevHandler = this.handlers.get(this.currentState);
      if (prevHandler && prevHandler.exit) {
        prevHandler.exit();
      }
    }

    this.currentState = nextState;
    const nextHandler = this.handlers.get(nextState);
    if (nextHandler && nextHandler.enter) {
      nextHandler.enter(payload as never);
    }
  }

  update(dt: number): void {
    if (!this.currentState) return;
    const handler = this.handlers.get(this.currentState);
    if (handler && handler.update) {
      handler.update(dt);
    }
  }

  dispose(): void {
    if (this.currentState) {
      const handler = this.handlers.get(this.currentState);
      if (handler && handler.exit) {
        handler.exit();
      }
      this.currentState = null;
    }
    this.handlers.clear();
  }
}
