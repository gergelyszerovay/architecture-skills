/** The order does not exist or belongs to another customer; callers cannot tell which. */
export class OrderNotVisibleError extends Error {
  constructor() {
    super('Order not found');
    this.name = 'OrderNotVisibleError';
  }
}
